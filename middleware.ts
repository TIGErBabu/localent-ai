import { NextRequest, NextResponse } from "next/server";

// Route protection (blueprint 4.3 step 1–2: authenticate, then role gate).
// Resource-level policy (step 3) runs inside pages/actions via lib/policy.ts.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const raw = req.cookies.get("localent_session")?.value;
  const role = raw?.split(".")[1];
  const need = (prefix: string, want: string) => {
    if (!pathname.startsWith(prefix)) return null;
    if (!raw) return NextResponse.redirect(new URL("/login", req.url));
    if (role !== want) return NextResponse.redirect(new URL("/login", req.url));
    return null;
  };
  return (
    need("/dashboard/customer", "CUSTOMER") ??
    need("/dashboard/pro", "PRO") ??
    need("/admin", "ADMIN") ??
    NextResponse.next()
  );
}
export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
