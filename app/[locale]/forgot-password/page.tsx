import Link from "next/link";
import { ForgotPasswordForm } from "@/components/organisms/forgot-password-form";
import { SignupFlowSplitLayout } from "@/components/templates/signup-flow-split-layout";

export default function ForgotPasswordPage() {
  return (
    <SignupFlowSplitLayout
      title="Mot de passe oublié"
      description={
        <p>
          Indiquez l’adresse e-mail de votre compte. Si elle est reconnue, nous
          vous enverrons un lien pour choisir un nouveau mot de passe.
        </p>
      }
    >
      <div className="space-y-6">
        <ForgotPasswordForm />
        <p className="text-muted-foreground text-center text-sm">
          <Link
            href="/sign-in"
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            Retour à la connexion
          </Link>
        </p>
      </div>
    </SignupFlowSplitLayout>
  );
}
