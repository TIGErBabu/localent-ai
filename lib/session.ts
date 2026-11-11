import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "./types";
import { findUser } from "./store";

// DEMO session: cookie carries `${userId}.${role}` so middleware (edge) can gate
// routes without a DB. Production replaces this with a signed JWT access token
// + rotating refresh token (RefreshToken model) — see blueprint 4.3.
export const SESSION_COOKIE = "localent_session";

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const userId = raw.split(".")[0];
  return findUser(userId) ?? null;
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
