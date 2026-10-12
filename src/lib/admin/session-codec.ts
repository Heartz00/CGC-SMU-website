import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type AdminSession = {
  username: string;
  password: string;
  userId: number;
  expires: number;
};
export const sessionLifetime = 60 * 60 * 4;
export function sessionKey(secret: string): Buffer {
  if (!/^[A-Za-z0-9+/]{43}=$/.test(secret))
    throw new Error(
      "ADMIN_SESSION_SECRET must be a base64-encoded 32-byte key",
    );
  const key = Buffer.from(secret, "base64");
  if (key.length !== 32) throw new Error("Invalid session key");
  return key;
}
export function sealSession(session: AdminSession, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sessionKey(secret), iv);
  cipher.setAAD(Buffer.from("smu-cgc-admin-v1"));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    "base64url",
  );
}
export function openSession(
  token: string,
  secret: string,
  now = Date.now(),
): AdminSession | null {
  try {
    if (token.length > 3500) return null;
    const bytes = Buffer.from(token, "base64url");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      sessionKey(secret),
      bytes.subarray(0, 12),
    );
    decipher.setAAD(Buffer.from("smu-cgc-admin-v1"));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const payload: unknown = JSON.parse(
      Buffer.concat([
        decipher.update(bytes.subarray(28)),
        decipher.final(),
      ]).toString("utf8"),
    );
    if (!payload || typeof payload !== "object") return null;
    const value = payload as AdminSession;
    return typeof value.username === "string" &&
      typeof value.password === "string" &&
      Number.isSafeInteger(value.userId) &&
      value.userId > 0 &&
      Number.isFinite(value.expires) &&
      value.expires > now
      ? value
      : null;
  } catch {
    return null;
  }
}
