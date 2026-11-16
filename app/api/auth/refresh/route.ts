import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rotateSession } from "@/lib/auth";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/cookies";

// Refresh-token rotation endpoint. Middleware sends expired-access requests
// here; we validate the refresh cookie against the stored token hashes,
// revoke it, issue a fresh access+refresh pair, and bounce back to the page
// the user originally wanted. Any failure clears the cookies and goes to login.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const nextParam = req.nextUrl.searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const raw = (await cookies()).get(REFRESH_COOKIE)?.value;
  const user = raw ? await rotateSession(raw) : null;
  if (!user) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(ACCESS_COOKIE);
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }
  return NextResponse.redirect(new URL(next, req.url));
}
