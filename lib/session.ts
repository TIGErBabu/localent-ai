import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "./types";
import { adapter, findUser } from "./store";
import { verifyAccessToken } from "./jwt";
import { ACCESS_COOKIE } from "./cookies";

// Session resolution: verify the signed JWT access token (lib/jwt.ts) and load
// the user through the DataAdapter. Expired access tokens are renewed by the
// middleware → /api/auth/refresh rotation flow, not here (server-component
// renders cannot set cookies).
export const SESSION_COOKIE = ACCESS_COOKIE; // name kept for older imports

export async function getSessionUser(): Promise<User | null> {
  const raw = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!raw) return null;
  const claims = await verifyAccessToken(raw);
  if (!claims) return null;
  // The user lookup reads the adapter's cache. If this instance's boot-time
  // hydrate failed (transient pooler refusal), the cache is the empty
  // skeleton and findUser would miss — concluding "logged out" for a valid
  // session and bouncing the user to /login (observed in production).
  // ensureReady() retries a failed hydration and re-hydrates once the
  // snapshot is older than the adapter's freshness TTL, so this gate is
  // also what keeps every page load and server action (all of which funnel
  // through here: requireUser, requireRole, Header, API routes) from
  // acting on a frozen cross-instance snapshot. For the in-memory adapter
  // it is a no-op.
  await adapter.ensureReady();
  return findUser(claims.sub) ?? null;
}
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
export async function requireRole(role: Role): Promise<User> {
  const user = await requireUser();
  if (user.role !== role) redirect("/login");
  return user;
}
