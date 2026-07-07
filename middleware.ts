import { NextResponse, type NextRequest } from "next/server";

const MENU_PATHS = new Set(["/menu", "/menu/settings"]);
const PUBLIC_FILE_PATTERN = /\.[^/]+$/;

function isAllowedAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/menu-assets/") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE_PATTERN.test(pathname)
  );
}

function isAllowedApiPath(pathname: string): boolean {
  return pathname === "/api/locale" || pathname.startsWith("/api/menu-settings");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAllowedAssetPath(pathname) || isAllowedApiPath(pathname)) {
    return NextResponse.next();
  }

  if (MENU_PATHS.has(pathname) || pathname.startsWith("/menu/settings/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-rauom-menu-shell", "1");

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (request.method === "GET" || request.method === "HEAD") {
    const url = request.nextUrl.clone();
    url.pathname = "/menu";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export const config = {
  matcher: ["/:path*"],
};
