import { z } from "zod";
import { NextResponse } from "next/server";

import { getEnv } from "@/lib/cloudflare";
import { clearAdminCookie, setAdminCookie } from "@/lib/admin-auth";

const schema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  const env = getEnv();
  const expected = env.ADMIN_ACCESS_TOKEN;

  if (!expected) {
    return NextResponse.json({ ok: true, message: "No admin token set." });
  }

  try {
    const payload = schema.parse(await request.json());

    if (payload.token !== expected) {
      const response = NextResponse.json({ error: "Invalid token." }, { status: 401 });
      clearAdminCookie(response);
      return response;
    }

    const response = NextResponse.json({ ok: true });
    setAdminCookie(response, payload.token);
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearAdminCookie(response);
  return response;
}
