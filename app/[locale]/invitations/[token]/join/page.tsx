import { redirect } from "next/navigation";

type Props = { params: Promise<{ token: string }> };

/**
 * L'ancienne page d'inscription d'un invité.
 *
 * Depuis le 20 octobre 2026, le formulaire est sur la page de l'invitation
 * elle-même. Cette adresse reste pour les liens déjà partagés.
 */
export default async function JoinInvitationPage({ params }: Props) {
  const { token } = await params;
  redirect(`/invitations/${encodeURIComponent(token)}`);
}
