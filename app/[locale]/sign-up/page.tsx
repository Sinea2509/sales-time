import Link from "next/link";
import { SignUpForm } from "@/components/organisms/sign-up-form";
import { pageTitleClass } from "@/lib/page-typography";
import { SignupFlowIllustration } from "@/components/molecules/signup-flow-illustration";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <section className="hidden bg-brand/10 lg:flex lg:items-center lg:justify-center">
        <SignupFlowIllustration />
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-10 sm:px-10">
        <div className="w-full max-w-md space-y-6">
          <header className="space-y-1">
            <h1 className={pageTitleClass}>Créer un compte</h1>
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
