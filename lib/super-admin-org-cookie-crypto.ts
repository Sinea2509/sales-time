import { createHmac, timingSafeEqual } from "node:crypto";

const PAYLOAD_VERSION = 1 as const;

type CookiePayload = {
  v: typeof PAYLOAD_VERSION;
  /** Internal app user id — cookie is only valid for this actor. */
  uid: string;
  /** Internal organization id being operated in. */
  org: string;
  /** Unix seconds (UTC). */
  exp: number;
};

function requireHmacSecretForSigning(): string {
  const explicit = process.env.SUPER_ADMIN_ORG_COOKIE_SECRET?.trim();
  if (explicit) return explicit;
  if (process.env.NODE_ENV !== "production") {
    return "dev-super-admin-org-cookie-hmac-insecure";
  }
  throw new Error(
    "Set SUPER_ADMIN_ORG_COOKIE_SECRET to sign the super-admin elevation cookie.",
  );
}

/** Verification must never throw: missing prod secret means we ignore elevation cookies. */
function hmacSecretForVerification(): string | null {
  const explicit = process.env.SUPER_ADMIN_ORG_COOKIE_SECRET?.trim();
  if (explicit) return explicit;
  if (process.env.NODE_ENV !== "production") {
    return "dev-super-admin-org-cookie-hmac-insecure";
  }
  return null;
}

/**
 * Signed cookie value: base64url(payloadJson).base64url(hmacSha256(payloadB64)).
 * Legacy unsigned values (no dot) are rejected so users re-enter after deploy.
 */
export function signSuperAdminOrgCookieValue(input: {
  actorUserId: string;
  targetOrganizationId: string;
  maxAgeSec: number;
}): string {
  const exp = Math.floor(Date.now() / 1000) + input.maxAgeSec;
  const payload: CookiePayload = {
    v: PAYLOAD_VERSION,
    uid: input.actorUserId,
    org: input.targetOrganizationId,
    exp,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson, "utf8").toString("base64url");
  const sig = createHmac("sha256", requireHmacSecretForSigning())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifySuperAdminOrgCookieValue(
  raw: string,
  currentActorUserId: string,
): string | null {
  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const secret = hmacSecretForVerification();
  if (!secret) return null;

  const expectedSig = createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  const sigBuf = Buffer.from(sigB64, "utf8");
  const expBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  let parsed: CookiePayload;
  try {
    parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as CookiePayload;
  } catch {
    return null;
  }

  if (parsed.v !== PAYLOAD_VERSION || typeof parsed.org !== "string") {
    return null;
  }
  if (parsed.uid !== currentActorUserId) return null;
  if (typeof parsed.exp !== "number" || parsed.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return parsed.org;
}
