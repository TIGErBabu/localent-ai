import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/cookies";

// Route protection (blueprint 4.3 steps 1–2: authenticate, then role gate).
// Authentication = a valid signed JWT access token. An expired/absent access
// token with a live refresh cookie detours through /api/auth/refresh, which
// rotates the refresh token and mints a fresh access token. Resource-level
// policy (step 3) runs inside pages/actions via lib/policy.ts.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const want = pathname.startsWith("/dashboard/customer")
    ? "CUSTOMER"
    : pathname.startsWith("/dashboard/pro")
      ? "PRO"
      : pathname.startsWith("/admin")
        ? "ADMIN"
        : null;
  if (!want) return NextResponse.next();

  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const claims = access ? await verifyAccessToken(access) : null;
  if (claims) {
    if (claims.role !== want) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }
  if (req.cookies.get(REFRESH_COOKIE)) {
    const url = new URL("/api/auth/refresh", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.redirect(new URL("/login", req.url));
}
export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
