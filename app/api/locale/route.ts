import { NextResponse } from "next/server";
import { z } from "zod";

import {
  LOCALE_COOKIE_NAME,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n-dictionary";

const schema = z.object({
  locale: z.enum(["en", "vi"]),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const locale = normalizeLocale(payload.locale) as Locale;

    const response = NextResponse.json({ ok: true, locale });
    response.cookies.set({
      name: LOCALE_COOKIE_NAME,
      value: locale,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }
}
