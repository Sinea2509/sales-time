import { createHash, randomBytes } from "node:crypto";

/** Raw token for cookie / email links (never store raw in DB). */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
