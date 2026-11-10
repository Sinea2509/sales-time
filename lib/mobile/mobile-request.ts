import { NextResponse } from "next/server";
import { getApplicationDeps } from "@/lib/application-deps";
import type { OrgActorSuccess } from "@/lib/analysis-server-context";
import { makeBearerAuthAdapter } from "@/src/adapters/auth/bearer-auth-adapter";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

/** L'organisation que l'application mobile a choisie pour la requête. */
export const MOBILE_ORGANIZATION_HEADER = "x-sales-time-organization";

/** Le jeton porté par `Authorization: Bearer <jeton>`, ou rien. */
export function readBearerToken(headers: Headers): string | null {
  const value = headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(value);
  if (!match?.[1]) return null;
  /* Un jeton de session fait 43 caractères ; au-delà, ce n'en est pas un. */
  return match[1].length <= 256 ? match[1] : null;
}

export function readRequestedOrganizationId(headers: Headers): string | null {
  const value = headers.get(MOBILE_ORGANIZATION_HEADER)?.trim() ?? "";
  return value.length > 0 && value.length <= 64 ? value : null;
}

export type MobileActor = OrgActorSuccess & { rawToken: string };

type MobileActorFailure = { ok: false; error: "UNAUTHENTICATED" | "NO_ORG" };

/**
 * Le pendant mobile de `requireOrgActor` : la même résolution des droits,
 * à partir du jeton et de l'en-tête d'organisation au lieu des cookies.
 * L'élévation super admin n'existe pas sur le téléphone.
 */
export async function requireMobileOrgActor(
  request: Request,
): Promise<MobileActor | MobileActorFailure> {
  const rawToken = readBearerToken(request.headers);
  if (!rawToken) return { ok: false, error: "UNAUTHENTICATED" };

  const deps = getApplicationDeps();
  const auth = makeBearerAuthAdapter(deps.session, {
    rawToken,
    requestedOrganizationId: readRequestedOrganizationId(request.headers),
  });
  const ctx = await getCurrentActorContext(
    { auth },
    { superAdminElevation: null },
  );
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "UNAUTHENTICATED" };
  }
  if (!ctx.activeOrganizationId) return { ok: false, error: "NO_ORG" };

  return {
    ok: true,
    deps,
    rawToken,
    organizationId: ctx.activeOrganizationId,
    actorUserId: ctx.userId,
    internalUserId: ctx.internalUserId,
    email: ctx.email,
    canManageOrganization: ctx.canManageOrganization,
    workspaceRoleMode: ctx.workspaceRoleMode,
  };
}

const STATUS_BY_ERROR: Record<string, number> = {
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  ACCOUNT_DISABLED: 403,
  FORBIDDEN: 403,
  NO_ORG: 403,
  NOT_FOUND: 404,
  NOT_READY: 409,
  NO_TRANSCRIPT: 422,
  FAILED: 503,
  VALIDATION: 400,
  AUDIO_NOT_FOUND: 400,
  AUDIO_TOO_LARGE: 413,
  UNSUPPORTED_FORMAT: 415,
  TRANSCRIPT_TOO_SHORT_FOR_ANALYSIS: 422,
  INVALID_PERSON: 422,
  QUOTA_EXHAUSTED: 402,
  TRANSCRIPTION_FAILED: 502,
  AI_NOT_CONFIGURED: 503,
  STORAGE_NOT_CONFIGURED: 503,
};

/** Une réponse que ni le téléphone ni un intermédiaire ne doivent garder. */
export function mobileJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Un refus, avec un code stable que l'application traduit pour l'utilisateur. */
export function mobileError(error: string): NextResponse {
  return mobileJson({ error }, STATUS_BY_ERROR[error] ?? 500);
}
