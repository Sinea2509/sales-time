import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterProfileForm } from "@/components/organisms/register-profile-form";
import { SignupFlowIllustration } from "@/components/molecules/signup-flow-illustration";
import { needsRegisterProfile } from "@/lib/register-profile-gate";
import { makeApplicationDeps } from "@/src/adapters/composition";

export const dynamic = "force-dynamic";

export default async function RegisterProfilePage() {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }

  const user = await deps.users.findRegisterGateByUserId(principal.userId);

  if (!needsRegisterProfile(user)) {
    if (user?.onboardingProfile?.completedAt) {
      redirect("/company");
    }
    redirect("/onboarding");
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      <section className="hidden bg-brand/10 lg:flex lg:items-center lg:justify-center">
        <SignupFlowIllustration />
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10">
        <div className="w-full max-w-md space-y-6">
          <header className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Étape 2 sur 3
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Votre profil
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vérifiez votre nom tel qu&apos;il apparaîtra dans l&apos;équipe,
              puis choisissez votre rôle métier pour continuer vers
              l&apos;onboarding.
            </p>
          </header>

          <RegisterProfileForm
            defaultFirstName={user?.firstName ?? null}
            defaultLastName={user?.lastName ?? null}
          />

          <p className="text-muted-foreground text-sm">
            Un problème avec le compte ?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-[#6C4DFF] hover:underline"
            >
              Retour à la connexion
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
