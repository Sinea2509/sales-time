import { z } from "zod";
import { getApplicationDeps } from "@/lib/application-deps";
import { verifyPassword } from "@/lib/auth/password";
import { generateOpaqueToken } from "@/lib/auth/tokens";
import {
  mobileError,
  mobileJson,
  readBearerToken,
} from "@/lib/mobile/mobile-request";
import { signInMobile } from "@/src/core/application/sign-in-mobile";

export const dynamic = "force-dynamic";

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1)
    .max(320)
    .email()
    .transform((e) => e.toLowerCase()),
  password: z.string().min(1).max(200),
});

/**
 * Connexion de l'application mobile. Rend un jeton de session à garder dans
 * le trousseau du téléphone et à présenter dans `Authorization: Bearer`.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return mobileError("VALIDATION");
  }
  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) return mobileError("VALIDATION");

  const deps = getApplicationDeps();
  const result = await signInMobile(
    {
      signInRead: deps.signInRead,
      session: deps.session,
      verifyPassword,
      generateToken: () => generateOpaqueToken(),
    },
    {
      email: parsed.data.email,
      password: parsed.data.password,
      userAgent: request.headers.get("user-agent"),
    },
  );
  if (!result.ok) return mobileError(result.error);

  return mobileJson({ token: result.rawToken }, 201);
}

/** Déconnexion : le jeton présenté est supprimé, les autres appareils restent connectés. */
export async function DELETE(request: Request) {
  const rawToken = readBearerToken(request.headers);
  if (!rawToken) return mobileError("UNAUTHENTICATED");
  await getApplicationDeps().session.deleteSessionByRawToken(rawToken);
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
