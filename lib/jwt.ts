import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./types";

// Signed JWT access tokens (blueprint 4.3). Edge-safe: only jose + TextEncoder,
// so middleware.ts can verify tokens too. Set JWT_ACCESS_SECRET in production —
// the fallback below is a clearly-labeled dev secret so demo mode works with
// zero env configuration.
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes; refresh token rotates beneath it
const DEV_SECRET = "localent-dev-jwt-secret-REPLACE-IN-PRODUCTION";

export function jwtSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? DEV_SECRET);
}

export interface AccessClaims {
  sub: string;
  role: Role;
  email: string;
}

export async function signAccessToken(user: { id: string; role: Role; email: string }): Promise<string> {
  return new SignJWT({ role: user.role, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(jwtSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    if (!payload.sub || typeof payload.role !== "string") return null;
    return { sub: payload.sub, role: payload.role as Role, email: String(payload.email ?? "") };
  } catch {
    return null;
  }
}
