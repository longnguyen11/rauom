import { getOptionalDb } from "@/lib/cloudflare";

export async function dbAll<T>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = getOptionalDb();
  if (!db) {
    return [];
  }

  const statement = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const result = await statement.all<T>();
  return result.results ?? [];
}

export async function dbFirst<T>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await dbAll<T>(sql, params);
  return rows[0] ?? null;
}

export async function dbRun(sql: string, params: unknown[] = []): Promise<D1Result | null> {
  const db = getOptionalDb();
  if (!db) {
    return null;
  }

  const statement = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  return statement.run();
}

export function requireDb(): D1Database {
  const db = getOptionalDb();
  if (!db) {
    throw new Error("D1 binding `DB` is unavailable.");
  }
  return db;
}
