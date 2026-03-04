import { Temporal } from "@js-temporal/polyfill";

import type { FulfillmentType, Timeslot } from "@/lib/types";
import { dbAll, requireDb } from "@/lib/db";
import { getBlackoutDateSet, getOperationalSettings } from "@/lib/settings";
import { addMinutesToLocalTime, minEligibleInstant } from "@/lib/time";

interface TimeslotRow {
  id: string;
  date_local: string;
  start_time_local: string;
  end_time_local: string;
  start_time_utc: string;
  end_time_utc: string;
  slot_type: FulfillmentType;
  capacity_limit: number;
  reserved_count: number;
  is_open: number;
  timezone: string;
  minimum_lead_time_days: number;
}

const DEFAULT_SLOT_SPECS: Record<FulfillmentType, string[]> = {
  delivery: ["11:30", "13:30", "17:30", "19:30"],
  pickup: ["11:00", "13:00", "17:00", "19:00"],
};

function mapTimeslotRow(row: TimeslotRow): Timeslot {
  return {
    id: row.id,
    dateLocal: row.date_local,
    startTimeLocal: row.start_time_local,
    endTimeLocal: row.end_time_local,
    startTimeUtc: row.start_time_utc,
    endTimeUtc: row.end_time_utc,
    slotType: row.slot_type,
    capacityLimit: row.capacity_limit,
    reservedCount: row.reserved_count,
    isOpen: row.is_open === 1,
    timezone: row.timezone,
    minimumLeadTimeDays: row.minimum_lead_time_days,
  };
}

async function countUpcomingTimeslots(): Promise<number> {
  const rows = await dbAll<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM fulfillment_timeslots
     WHERE start_time_utc >= datetime('now')`,
  );

  return rows[0]?.count ?? 0;
}

export async function ensureUpcomingTimeslots(days = 14): Promise<void> {
  const db = requireDb();
  const existing = await countUpcomingTimeslots();
  const slotsPerDay =
    DEFAULT_SLOT_SPECS.delivery.length + DEFAULT_SLOT_SPECS.pickup.length;

  if (existing >= days * slotsPerDay) {
    return;
  }

  const settings = await getOperationalSettings();
  const timezone = settings.timezone;
  const now = Temporal.Now.zonedDateTimeISO(timezone);

  const statements: D1PreparedStatement[] = [];
  for (let dayOffset = 0; dayOffset <= days; dayOffset += 1) {
    const dateLocal = now.add({ days: dayOffset }).toPlainDate();

    for (const slotType of ["delivery", "pickup"] as const) {
      for (const startTimeLocal of DEFAULT_SLOT_SPECS[slotType]) {
        const start = Temporal.PlainDateTime.from(
          `${dateLocal.toString()}T${startTimeLocal}:00`,
        ).toZonedDateTime(timezone);

        const endTimeLocal = addMinutesToLocalTime(startTimeLocal, 60);
        const end = Temporal.PlainDateTime.from(
          `${dateLocal.toString()}T${endTimeLocal}:00`,
        ).toZonedDateTime(timezone);

        const slotId = `${slotType}_${dateLocal.toString()}_${startTimeLocal.replace(":", "")}`;

        statements.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO fulfillment_timeslots (
                id,
                date_local,
                start_time_local,
                end_time_local,
                start_time_utc,
                end_time_utc,
                slot_type,
                capacity_limit,
                reserved_count,
                is_open,
                timezone,
                cutoff_time_local,
                minimum_lead_time_days,
                created_at_utc
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, 1, CURRENT_TIMESTAMP)`,
            )
            .bind(
              slotId,
              dateLocal.toString(),
              startTimeLocal,
              endTimeLocal,
              start.toInstant().toString(),
              end.toInstant().toString(),
              slotType,
              slotType === "delivery" ? 8 : 10,
              timezone,
              "09:00",
            ),
        );
      }
    }
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

export async function listAvailableTimeslots(
  slotType: FulfillmentType,
  minDishLeadDays: number,
  daysAhead = 60,
): Promise<Timeslot[]> {
  await ensureUpcomingTimeslots(daysAhead + 7);

  const { timezone, minLeadDaysDefault, manualPaymentBufferHours } =
    await getOperationalSettings();

  const finalLeadDays = Math.max(minLeadDaysDefault, minDishLeadDays);
  const minInstant = minEligibleInstant(
    finalLeadDays,
    manualPaymentBufferHours,
    timezone,
  );
  const maxInstant = Temporal.Now.zonedDateTimeISO(timezone)
    .add({ days: daysAhead })
    .toInstant();

  const blackoutDates = await getBlackoutDateSet();

  const rows = await dbAll<TimeslotRow>(
    `SELECT
      id,
      date_local,
      start_time_local,
      end_time_local,
      start_time_utc,
      end_time_utc,
      slot_type,
      capacity_limit,
      reserved_count,
      is_open,
      timezone,
      minimum_lead_time_days
    FROM fulfillment_timeslots
    WHERE slot_type = ?
      AND is_open = 1
      AND reserved_count < capacity_limit
      AND start_time_utc >= ?
      AND start_time_utc <= ?
    ORDER BY start_time_utc ASC
    LIMIT 500`,
    [slotType, minInstant.toString(), maxInstant.toString()],
  );

  return rows
    .filter((row) => !blackoutDates.has(row.date_local))
    .map(mapTimeslotRow);
}

export async function getTimeslotById(id: string): Promise<Timeslot | null> {
  const row = await dbAll<TimeslotRow>(
    `SELECT
      id,
      date_local,
      start_time_local,
      end_time_local,
      start_time_utc,
      end_time_utc,
      slot_type,
      capacity_limit,
      reserved_count,
      is_open,
      timezone,
      minimum_lead_time_days
    FROM fulfillment_timeslots
    WHERE id = ?
    LIMIT 1`,
    [id],
  );

  if (!row[0]) {
    return null;
  }

  return mapTimeslotRow(row[0]);
}

export async function reserveTimeslotCapacity(id: string): Promise<boolean> {
  const db = requireDb();

  const result = await db
    .prepare(
      `UPDATE fulfillment_timeslots
       SET reserved_count = reserved_count + 1
       WHERE id = ?
         AND is_open = 1
         AND reserved_count < capacity_limit`,
    )
    .bind(id)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function releaseTimeslotCapacity(id: string): Promise<void> {
  const db = requireDb();
  await db
    .prepare(
      `UPDATE fulfillment_timeslots
       SET reserved_count = CASE
          WHEN reserved_count > 0 THEN reserved_count - 1
          ELSE 0
       END
       WHERE id = ?`,
    )
    .bind(id)
    .run();
}
