"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { inviteMemberAction } from "@/app/[locale]/company/settings/equipe/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import { cn } from "@/lib/utils";

/** Même style que « Voir tous les plans » (sidebar) : brand + texte blanc. */
const triggerClass =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:outline-none";

export function DashboardAddMemberPopover() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const el = rootRef.current;
      if (!el?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setMsg(null);
          setOpen((v) => !v);
        }}
      >
        <Plus className="size-4 shrink-0" aria-hidden />
        Ajouter un membre
      </button>
      {open ? (
        <div
          className="absolute top-full left-0 z-50 mt-1.5 w-[min(calc(100vw-2rem),20rem)] rounded-lg border border-zinc-200 bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-black/5 sm:left-auto sm:right-0 dark:border-zinc-700 dark:ring-white/10"
          role="dialog"
          aria-label="Inviter un membre"
        >
          <p className="text-foreground mb-3 text-sm font-medium">
            Inviter un membre
          </p>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setMsg(null);
              startTransition(async () => {
                const r = await inviteMemberAction({
                  email: inviteEmail,
                  role: inviteRole,
                });
                if (!r.ok) {
                  setMsg(r.message);
                  return;
                }
                setMsg("Invitation envoyée.");
                setInviteEmail("");
                setOpen(false);
                router.refresh();
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="dash-invite-email">E-mail</Label>
              <Input
                id="dash-invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collegue@entreprise.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dash-invite-role">Rôle</Label>
              <select
                id="dash-invite-role"
                className={cn(
                  nativeSelectClassName,
                  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
                )}
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "ADMIN" | "MEMBER")
                }
              >
                <option value="MEMBER">Membre</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
            {msg ? (
              <p className="text-destructive text-xs" role="status">
                {msg}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 bg-brand text-white hover:bg-brand-hover"
                disabled={pending}
              >
                {pending ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
