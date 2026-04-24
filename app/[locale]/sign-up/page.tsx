import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SignupFlowIllustration } from "@/components/register/signup-flow-illustration";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      <section className="hidden bg-brand/10 lg:flex lg:items-center lg:justify-center">
        <SignupFlowIllustration />
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10">
        <div className="w-full max-w-md space-y-6">
          <header className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Étape 1 sur 3
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Créer un compte
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Prénom, nom, e-mail professionnel, site web de l&apos;entreprise et
              mot de passe. Nous vérifions le domaine pour qu&apos;une seule
              organisation soit créée par site. Ensuite vous indiquerez votre
              rôle métier puis l&apos;onboarding équipe.
            </p>
          </header>

          <SignUpForm />

          <p className="text-muted-foreground text-sm">
            Déjà inscrit ?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-brand hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
