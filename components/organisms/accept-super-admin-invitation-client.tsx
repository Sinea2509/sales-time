"use client";

import { useTransition } from "react";
import { acceptSuperAdminInvitationAction } from "@/app/[locale]/super-admin-invitations/[token]/actions";
import { Button } from "@/components/ui/button";

type Props = { token: string };

export function AcceptSuperAdminInvitationClient({ token }: Props) {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      className="w-full"
      disabled={pending}
      onClick={() => {
        start(() => {
          void acceptSuperAdminInvitationAction(token);
        });
      }}
    >
      {pending ? "Validation…" : "Accepter et accéder à l’admin plateforme"}
    </Button>
  );
}
