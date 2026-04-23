import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      <section className="hidden bg-[#6C4DFF]/10 lg:flex lg:items-center lg:justify-center">
        <div className="h-[78%] w-[80%] rounded-3xl border border-[#6C4DFF]/20 bg-white/40" />
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10">
        <div className="w-full max-w-md space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Créer votre compte
            </h1>
            <p className="text-muted-foreground text-sm">
              Commençons avec votre essai gratuit de 30 jours
            </p>
          </header>

          <SignUp
            fallbackRedirectUrl="/onboarding"
            signInUrl="/sign-in"
            appearance={{
              elements: {
                card: "shadow-none border-0 p-0",
                rootBox: "w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                footer: "hidden",
                socialButtonsBlockButton:
                  "h-10 rounded-lg border-neutral-200 dark:border-neutral-800",
                formFieldInput:
                  "h-10 rounded-lg border-neutral-200 shadow-none dark:border-neutral-800",
                formButtonPrimary:
                  "h-10 rounded-lg bg-[#6C4DFF] text-white hover:bg-[#5a3fd9]",
              },
            }}
          />

          <p className="text-muted-foreground text-sm">
            Vous avez déjà un compte ?{" "}
            <Link href="/sign-in" className="font-medium text-[#6C4DFF] hover:underline">
              Connectez-vous
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
