"use client";

import { useId, useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  changeAccountPasswordAction,
  removeAccountAvatarAction,
  sendAccountPasswordResetEmailAction,
  updateAccountProfileAction,
  uploadAccountAvatarAction,
} from "@/app/[locale]/company/account/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blobProxyUrl } from "@/lib/blob-paths";
import { pageTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

export type AccountProfileInitial = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

function profileInitials(input: AccountProfileInitial): string {
  const f = input.firstName?.trim().charAt(0) ?? "";
  const l = input.lastName?.trim().charAt(0) ?? "";
  if (f && l) return `${f}${l}`.toUpperCase();
  if (f) return f.toUpperCase();
  return (input.email.split("@")[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export function AccountProfileForm({ profile }: { profile: AccountProfileInitial }) {
  const router = useRouter();
  const avatarInputId = useId();
  const [pending, startTransition] = useTransition();
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const avatarSrc = profile.avatarUrl?.trim()
    ? blobProxyUrl(profile.avatarUrl)
    : undefined;

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarMessage(null);
    setAvatarError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("avatar", file);
      const result = await uploadAccountAvatarAction(fd);
      if (!result.ok) {
        setAvatarError(result.message);
        return;
      }
      setAvatarMessage(result.message ?? "Photo enregistrée.");
      router.refresh();
    });
  }

  function onRemoveAvatar() {
    setAvatarMessage(null);
    setAvatarError(null);
    startTransition(async () => {
      const result = await removeAccountAvatarAction();
      if (!result.ok) {
        setAvatarError(result.message);
        return;
      }
      setAvatarMessage(result.message ?? "Photo supprimée.");
      router.refresh();
    });
  }

  function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    startTransition(async () => {
      const result = await updateAccountProfileAction({ firstName, lastName });
      if (!result.ok) {
        setProfileError(result.message);
        return;
      }
      setProfileMessage(result.message ?? "Profil enregistré.");
      router.refresh();
    });
  }

  function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    startTransition(async () => {
      const result = await changeAccountPasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!result.ok) {
        setPasswordError(result.message);
        return;
      }
      setPasswordMessage(result.message ?? "Mot de passe mis à jour.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  function onSendResetEmail() {
    setResetMessage(null);
    setResetError(null);
    startTransition(async () => {
      const result = await sendAccountPasswordResetEmailAction();
      if (!result.ok) {
        setResetError(result.message);
        return;
      }
      setResetMessage(result.message ?? "E-mail envoyé.");
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <div className="space-y-1">
        <h1 className={pageTitleClass}>Mon profil</h1>
        <p className="text-muted-foreground text-sm">
          Gérez votre identité et la sécurité de votre compte.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Photo de profil</h2>
        {avatarMessage ? (
          <p className="text-sm text-green-700 dark:text-green-400" role="status">
            {avatarMessage}
          </p>
        ) : null}
        {avatarError ? (
          <p className="text-destructive text-sm" role="alert">
            {avatarError}
          </p>
        ) : null}
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-20">
            {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
            <AvatarFallback className="text-lg">
              {profileInitials(profile)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input
              id={avatarInputId}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              disabled={pending}
              onChange={onAvatarChange}
            />
            <label
              htmlFor={avatarInputId}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                pending && "pointer-events-none opacity-50",
                "cursor-pointer",
              )}
            >
              {pending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-2 size-4" />
              )}
              Changer la photo
            </label>
            {profile.avatarUrl ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-muted-foreground hover:text-destructive h-auto justify-start px-0"
                disabled={pending}
                onClick={onRemoveAvatar}
              >
                Supprimer la photo
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Informations personnelles</h2>
        {profileMessage ? (
          <p className="text-sm text-green-700 dark:text-green-400" role="status">
            {profileMessage}
          </p>
        ) : null}
        {profileError ? (
          <p className="text-destructive text-sm" role="alert">
            {profileError}
          </p>
        ) : null}
        <form className="space-y-4" onSubmit={onSaveProfile}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-firstName">Prénom</Label>
              <Input
                id="account-firstName"
                name="firstName"
                autoComplete="given-name"
                maxLength={80}
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-lastName">Nom</Label>
              <Input
                id="account-lastName"
                name="lastName"
                autoComplete="family-name"
                maxLength={80}
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-email">E-mail</Label>
            <Input
              id="account-email"
              name="email"
              type="email"
              value={profile.email}
              readOnly
              disabled
              className={cn("bg-muted/50")}
              aria-describedby="account-email-help"
            />
            <p id="account-email-help" className="text-muted-foreground text-xs">
              L&apos;adresse e-mail ne peut pas être modifiée ici.
            </p>
          </div>
          <Button type="submit" disabled={pending}>
            Enregistrer le profil
          </Button>
        </form>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Mot de passe</h2>
        {passwordMessage ? (
          <p className="text-sm text-green-700 dark:text-green-400" role="status">
            {passwordMessage}
          </p>
        ) : null}
        {passwordError ? (
          <p className="text-destructive text-sm" role="alert">
            {passwordError}
          </p>
        ) : null}
        <form className="space-y-4" onSubmit={onChangePassword}>
          <div className="space-y-2">
            <Label htmlFor="account-current-password">Mot de passe actuel</Label>
            <Input
              id="account-current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-new-password">Nouveau mot de passe</Label>
            <Input
              id="account-new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-confirm-password">
              Confirmer le nouveau mot de passe
            </Label>
            <Input
              id="account-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={pending}>
            Mettre à jour le mot de passe
          </Button>
        </form>

        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-3 text-sm">
            Vous préférez réinitialiser par e-mail ?
          </p>
          {resetMessage ? (
            <p className="mb-2 text-sm text-green-700 dark:text-green-400" role="status">
              {resetMessage}
            </p>
          ) : null}
          {resetError ? (
            <p className="text-destructive mb-2 text-sm" role="alert">
              {resetError}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onSendResetEmail}
          >
            Envoyer un lien de réinitialisation
          </Button>
        </div>
      </section>
    </div>
  );
}
