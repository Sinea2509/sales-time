import Link from "next/link";
import { hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { AcceptInvitationClient } from "@/components/auth/accept-invitation-client";

type Props = { params: Promise<{ token: string }> };

export default async function InvitationPage({ params }: Props) {
  const { token } = await params;
  const th = hashToken(token);
  const inv = await prisma.organizationInvitation.findFirst({
    where: {
      tokenHash: th,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: { organization: { select: { name: true } } },
  });

  if (!inv) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <p className="text-muted-foreground text-center text-sm">
          Ce lien d&apos;invitation est invalide ou a expiré.
        </p>
        <Link href="/sign-in" className="mt-4 text-primary underline">
          Connexion
        </Link>
      </div>
    );
  }

  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Invitation — {inv.organization.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          Vous avez été invité en tant que{" "}
          <span className="font-medium text-foreground">
            {inv.role === "ADMIN" ? "administrateur" : "membre"}
          </span>{" "}
          pour l&apos;adresse{" "}
          <span className="font-mono text-foreground">{inv.email}</span>.
        </p>
        {principal ? (
          principal.email.toLowerCase() === inv.email.toLowerCase() ? (
            <AcceptInvitationClient token={token} />
          ) : (
            <p className="text-destructive text-sm">
              Connecté en tant que {principal.email}. Déconnectez-vous et
              connectez-vous avec {inv.email} pour accepter.
            </p>
          )
        ) : (
          <p className="text-muted-foreground text-sm">
            <Link href={`/sign-in?next=/invitations/${encodeURIComponent(token)}`} className="text-primary underline">
              Connectez-vous
            </Link>{" "}
            avec {inv.email} pour rejoindre l&apos;organisation.
          </p>
        )}
      </div>
    </div>
  );
}
