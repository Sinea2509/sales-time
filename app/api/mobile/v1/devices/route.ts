import { z } from "zod";
import {
  mobileError,
  mobileJson,
  requireMobileOrgActor,
} from "@/lib/mobile/mobile-request";

export const dynamic = "force-dynamic";

/* Le format des jetons Expo : « ExponentPushToken[…] » ou « ExpoPushToken[…] ». */
const tokenSchema = z
  .string()
  .trim()
  .max(200)
  .regex(/^(ExpoPushToken|ExponentPushToken)\[[A-Za-z0-9_-]+\]$/);

const registerSchema = z.object({
  expoPushToken: tokenSchema,
  platform: z.enum(["ios", "android"]),
});

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Le téléphone s'enregistre pour recevoir « Analyse terminée ». */
export async function POST(request: Request) {
  const actor = await requireMobileOrgActor(request);
  if (!actor.ok) return mobileError(actor.error);

  const parsed = registerSchema.safeParse(await readJson(request));
  if (!parsed.success) return mobileError("VALIDATION");

  await actor.deps.mobileDevices.register({
    userId: actor.actorUserId,
    expoPushToken: parsed.data.expoPushToken,
    platform: parsed.data.platform,
  });
  return mobileJson({ ok: true }, 201);
}

/** À la déconnexion, le téléphone ne reçoit plus rien pour ce compte. */
export async function DELETE(request: Request) {
  const actor = await requireMobileOrgActor(request);
  if (!actor.ok) return mobileError(actor.error);

  const parsed = z
    .object({ expoPushToken: tokenSchema })
    .safeParse(await readJson(request));
  if (!parsed.success) return mobileError("VALIDATION");

  await actor.deps.mobileDevices.unregister({
    userId: actor.actorUserId,
    expoPushToken: parsed.data.expoPushToken,
  });
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
