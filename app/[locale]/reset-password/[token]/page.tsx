import Link from "next/link";
import { ResetPasswordForm } from "@/components/organisms/reset-password-form";
import { SignupFlowSplitLayout } from "@/components/templates/signup-flow-split-layout";

type Props = { params: Promise<{ token: string }> };

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;

  return (
    <SignupFlowSplitLayout
      title="Nouveau mot de passe"
      description={
        <p>
          Choisissez un mot de passe d&apos;au moins 8 caractères. Ce lien expire
          au bout d&apos;une heure.
        </p>
      }
    >
      <div className="space-y-6">
        <ResetPasswordForm token={token} />
        <p className="text-muted-foreground text-center text-sm">
          <Link
            href="/sign-in"
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            Annuler
          </Link>
        </p>
      </div>
    </SignupFlowSplitLayout>
  );
}
