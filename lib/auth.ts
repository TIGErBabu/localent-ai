import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { db, findUser } from "./store";
import { sha256Hex } from "./password";
import { ACCESS_TOKEN_TTL_SECONDS, signAccessToken } from "./jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./cookies";
import { nowIso, uid } from "./utils";
import type { User } from "./types";

// Real session issuance (blueprint 4.3): short-lived signed JWT access token +
// rotating refresh token. Only the sha256 hash of each refresh token is stored
// (RefreshToken rows via the DataAdapter), so a store leak yields no sessions.
// Rotation: every refresh revokes the presented token and issues a new pair —
// a replayed old refresh token is rejected.
export const REFRESH_TTL_MS = 30 * 24 * 3600 * 1000; // 30 days

const cookieOpts = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
});

export async function issueSession(user: User): Promise<void> {
  const jar = await cookies();
  const access = await signAccessToken(user);
  jar.set(ACCESS_COOKIE, access, { ...cookieOpts(), maxAge: ACCESS_TOKEN_TTL_SECONDS });
  const refresh = randomBytes(32).toString("hex");
  db().refreshTokens.push({
    id: uid("rt"), userId: user.id, tokenHash: sha256Hex(refresh),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS).toISOString(), revokedAt: null, createdAt: nowIso(),
  });
  jar.set(REFRESH_COOKIE, refresh, { ...cookieOpts(), maxAge: Math.floor(REFRESH_TTL_MS / 1000) });
}

export async function rotateSession(rawRefresh: string): Promise<User | null> {
  const row = db().refreshTokens.find((t) => t.tokenHash === sha256Hex(rawRefresh));
  if (!row || row.revokedAt || row.expiresAt <= nowIso()) return null;
  const user = findUser(row.userId);
  if (!user) return null;
  row.revokedAt = nowIso(); // rotation: the presented token dies here
  await issueSession(user);
  return user;
}

export async function revokeSession(rawRefresh: string | null | undefined): Promise<void> {
  if (rawRefresh) {
    const row = db().refreshTokens.find((t) => t.tokenHash === sha256Hex(rawRefresh));
    if (row && !row.revokedAt) row.revokedAt = nowIso();
  }
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function revokeAllSessions(userId: string): Promise<void> {
  for (const t of db().refreshTokens) {
    if (t.userId === userId && !t.revokedAt) t.revokedAt = nowIso();
  }
}
