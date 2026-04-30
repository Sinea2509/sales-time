import Link from "next/link";
import { ForgotPasswordForm } from "@/components/organisms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Mot de passe oublié
          </h1>
          <p className="text-muted-foreground text-sm">
            Nous vous enverrons un lien si un compte existe pour cet e-mail.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-center text-sm">
          <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
