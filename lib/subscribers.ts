import { nanoid } from "nanoid";

import { getEnv } from "@/lib/cloudflare";
import { dbAll, dbRun } from "@/lib/db";

interface SubscriberRow {
  id: string;
  status: "pending" | "active" | "unsubscribed";
}

async function sendDoubleOptInEmail(email: string, token: string): Promise<void> {
  const env = getEnv();

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://rau-om.example.com";
  const confirmUrl = `${baseUrl}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: "Confirm your Rau Om newsletter subscription",
      html: `<p>Thanks for joining Rau Om updates.</p><p>Confirm your subscription: <a href=\"${confirmUrl}\">Activate subscription</a></p>`,
    }),
  });
}

export async function createPendingEmailSubscriber(email: string): Promise<{ token: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await dbAll<SubscriberRow>(
    `SELECT id, status FROM subscribers WHERE email = ? AND channel = 'email' LIMIT 1`,
    [normalizedEmail],
  );

  const token = nanoid(40);

  if (existing[0]) {
    await dbRun(
      `UPDATE subscribers
       SET status = 'pending',
           verification_token = ?,
           verification_sent_at_utc = CURRENT_TIMESTAMP,
           consented_at_utc = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [token, existing[0].id],
    );
  } else {
    await dbRun(
      `INSERT INTO subscribers (
        id,
        channel,
        email,
        status,
        consent_text_version,
        consented_at_utc,
        verification_token,
        verification_sent_at_utc
      ) VALUES (?, 'email', ?, 'pending', 'v1', CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)`,
      [`sub_${nanoid(16)}`, normalizedEmail, token],
    );
  }

  await sendDoubleOptInEmail(normalizedEmail, token);

  return { token };
}

export async function confirmSubscriberByToken(token: string): Promise<boolean> {
  const match = await dbAll<{ id: string }>(
    `SELECT id FROM subscribers
     WHERE verification_token = ?
       AND status = 'pending'
       AND channel = 'email'
     LIMIT 1`,
    [token],
  );

  const subscriber = match[0];
  if (!subscriber) {
    return false;
  }

  await dbRun(
    `UPDATE subscribers
     SET status = 'active',
         verification_token = NULL
     WHERE id = ?`,
    [subscriber.id],
  );

  return true;
}
