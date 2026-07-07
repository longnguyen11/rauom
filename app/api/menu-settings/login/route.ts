import { NextResponse } from "next/server";
import { z } from "zod";

import {
  clearMenuSettingsCookie,
  isMenuSettingsPassword,
  setMenuSettingsCookie,
} from "@/lib/menu-settings-auth";

const schema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    if (!isMenuSettingsPassword(payload.password)) {
      const response = NextResponse.json(
        { error: "Invalid password." },
        { status: 401 },
      );
      clearMenuSettingsCookie(response);
      return response;
    }

    const response = NextResponse.json({ ok: true });
    setMenuSettingsCookie(response, request.url);
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearMenuSettingsCookie(response);
  return response;
}
