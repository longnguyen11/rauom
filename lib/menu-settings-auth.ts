import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getEnv } from "@/lib/cloudflare";

const DEFAULT_MENU_SETTINGS_PASSWORD = "NovaNova112!";
export const MENU_SETTINGS_COOKIE_NAME = "rauom_menu_settings_token";

function getMenuSettingsPassword(): string {
  return getEnv().MENU_SETTINGS_PASSWORD ?? DEFAULT_MENU_SETTINGS_PASSWORD;
}

export async function isMenuSettingsAuthorizedForPage(): Promise<boolean> {
  const cookieStore = await cookies();
  return (
    cookieStore.get(MENU_SETTINGS_COOKIE_NAME)?.value === getMenuSettingsPassword()
  );
}

export function isMenuSettingsAuthorizedForRequest(request: NextRequest): boolean {
  return (
    request.cookies.get(MENU_SETTINGS_COOKIE_NAME)?.value ===
    getMenuSettingsPassword()
  );
}

export function setMenuSettingsCookie(
  response: NextResponse,
  requestUrl: string,
): void {
  response.cookies.set({
    name: MENU_SETTINGS_COOKIE_NAME,
    value: getMenuSettingsPassword(),
    httpOnly: true,
    path: "/",
    secure: new URL(requestUrl).protocol === "https:",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
  });
}

export function clearMenuSettingsCookie(response: NextResponse): void {
  response.cookies.set({
    name: MENU_SETTINGS_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

export function isMenuSettingsPassword(value: string): boolean {
  return value === getMenuSettingsPassword();
}

export function menuSettingsUnauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
