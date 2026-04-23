import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type Props = { params: Promise<{ token: string }> };

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Nouveau mot de passe
          </h1>
          <p className="text-muted-foreground text-sm">
            Choisissez un mot de passe d&apos;au moins 8 caractères.
          </p>
        </div>
        <ResetPasswordForm token={token} />
        <p className="text-center text-sm">
          <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
            Annuler
          </Link>
        </p>
      </div>
    </div>
  );
}
