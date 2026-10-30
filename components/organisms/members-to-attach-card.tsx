"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UsersRound } from "lucide-react";
import { attachToMyTeamAction } from "@/app/[locale]/company/equipe/actions";
import { Icon3d } from "@/components/atoms/icon-3d";
import { Button } from "@/components/ui/button";
import { prospectInitials } from "@/lib/prospect-initials";
import { teamMemberDisplayName } from "@/lib/team-member-display-name";
import type { MemberToAttach } from "@/lib/load-members-to-attach";

/**
 * Les commerciaux de l'organisation rattachés à personne, que le manager
 * ajoute à son équipe d'un clic.
 *
 * Retour de Thomas du 21 octobre 2026 : un collaborateur sans manager était
 * invisible dans le tableau de bord, et le rattacher demandait de trouver une
 * colonne au fond des paramètres. La carte se montre là où l'absence se
 * remarque, et disparaît d'elle-même quand il n'y a plus personne à ajouter.
 */
export function MembersToAttachCard({
  members,
}: {
  members: MemberToAttach[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (members.length === 0) return null;

  function attach(ids: string[], key: string) {
    setError(null);
    setBusyId(key);
    startTransition(async () => {
      const res = await attachToMyTeamAction(ids);
      setBusyId(null);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    });
  }

  const plusieurs = members.length > 1;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <Icon3d tone="teal" size="md">
            <UsersRound aria-hidden />
          </Icon3d>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">
              {plusieurs
                ? `${members.length} commerciaux à rattacher à votre équipe`
                : "Un commercial à rattacher à votre équipe"}
            </h2>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
              {plusieurs
                ? "Ils ne sont dans l'équipe de personne : vous ne voyez ni leurs rendez-vous, ni leur progression. Ajoutez ceux que vous accompagnez."
                : "Il n'est dans l'équipe de personne : vous ne voyez ni ses rendez-vous, ni sa progression. Ajoutez-le si vous l'accompagnez."}
            </p>
          </div>
        </div>
        {plusieurs ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              attach(
                members.map((m) => m.userId),
                "tous",
              )
            }
            className="shrink-0"
          >
            {busyId === "tous" ? "Ajout…" : "Tout ajouter"}
          </Button>
        ) : null}
      </div>

      <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card dark:border-neutral-800">
        {members.map((m) => {
          const name = teamMemberDisplayName(m);
          return (
            <li key={m.userId} className="flex items-center gap-3 px-4 py-3">
              <span className="bg-muted grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold dark:bg-zinc-800">
                {prospectInitials(name.initialsSource)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name.primary}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {m.email}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => attach([m.userId], m.userId)}
                className="bg-brand text-brand-foreground hover:bg-brand-hover ml-auto shrink-0"
              >
                <UserPlus className="size-4" aria-hidden />
                {busyId === m.userId ? "Ajout…" : "Ajouter à mon équipe"}
              </Button>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p className="text-destructive mt-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
