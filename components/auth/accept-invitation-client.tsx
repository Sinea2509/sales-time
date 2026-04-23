"use client";

import { useTransition } from "react";
import { acceptOrganizationInvitationAction } from "@/app/[locale]/invitations/[token]/actions";
import { Button } from "@/components/ui/button";

type Props = { token: string };

export function AcceptInvitationClient({ token }: Props) {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      className="w-full"
      disabled={pending}
      onClick={() => {
        start(() => {
          void acceptOrganizationInvitationAction(token);
        });
      }}
    >
      {pending ? "Acceptation…" : "Rejoindre l'organisation"}
    </Button>
  );
}
