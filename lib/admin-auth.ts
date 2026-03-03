import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getEnv } from "@/lib/cloudflare";

export const ADMIN_COOKIE_NAME = "rauom_admin_token";

export async function isAdminAuthorizedForRequest(
  request: NextRequest,
): Promise<boolean> {
  const env = getEnv();
  const expected = env.ADMIN_ACCESS_TOKEN;

  if (!expected) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token === expected) {
      return true;
    }
  }

  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return cookieToken === expected;
}

export async function isAdminAuthorizedForPage(): Promise<boolean> {
  const env = getEnv();
  const expected = env.ADMIN_ACCESS_TOKEN;

  if (!expected) {
    return true;
  }

  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === expected;
}

export function setAdminCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: "/",
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
  });
}

export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
