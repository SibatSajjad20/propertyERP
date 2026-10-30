import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);
  const isAuthRoute = pathname.startsWith("/login");
  const isPublic =
    isAuthRoute || pathname.startsWith("/api/auth") || pathname.startsWith("/api/health");

  if (!sessionCookie && !isPublic && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/inventory", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
