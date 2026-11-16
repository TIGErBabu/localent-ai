import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Password hashing with Node's built-in scrypt (no native dependencies).
// Stored format: "scrypt:<saltHex>:<hashHex>".
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith("scrypt:")) {
    const [, saltHex, hashHex] = stored.split(":");
    if (!saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, "hex");
    if (expected.length === 0) return false;
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    return timingSafeEqual(actual, expected);
  }
  // Legacy rows from the pre-auth-upgrade demo seed stored the literal password.
  // Current seeds store scrypt hashes, so this path is only a safety net.
  return stored === password;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
