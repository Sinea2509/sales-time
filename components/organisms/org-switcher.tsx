"use client";

import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { switchOrganizationAction } from "@/app/[locale]/company/switch-organization-action";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { prospectInitials } from "@/lib/prospect-initials";
import { blobProxyUrl } from "@/lib/blob-paths";
import { cn } from "@/lib/utils";
import { organizationMembershipRoleLabel } from "@/src/core/domain/organization-membership-role";

export type OrgSwitcherMembership = {
  organizationId: string;
  name: string;
  role: string;
  logoUrl: string | null;
};

type Props = {
  memberships: OrgSwitcherMembership[];
  currentOrganizationId: string | null;
};

function OrgMark({
  name,
  logoUrl,
  size = "default",
  className,
}: {
  name: string;
  logoUrl: string | null;
  size?: "default" | "sm";
  className?: string;
}) {
  const initials = prospectInitials(name);
  const dim =
    size === "sm"
      ? "size-7 min-h-7 min-w-7 text-[10px]"
      : "size-8 min-h-8 min-w-8 text-[11px]";
  const trimmed = logoUrl?.trim();
  if (trimmed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- proxied org blob asset
      <img
        src={blobProxyUrl(trimmed)}
        alt=""
        className={cn(
          "shrink-0 rounded-lg border border-sidebar-border object-cover",
          dim,
          className,
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent font-semibold uppercase leading-none tracking-tight text-sidebar-foreground",
        dim,
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function PlaceholderMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 min-h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-sidebar-border bg-sidebar-accent/50 text-xs font-semibold text-sidebar-foreground/70",
        className,
      )}
      aria-hidden
    >
      ?
    </span>
  );
}

export function OrgSwitcher({ memberships, currentOrganizationId }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (memberships.length === 0) {
    return (
      <p className="text-sidebar-foreground/70 px-2 text-xs">
        Aucune organisation
      </p>
    );
  }

  const current = memberships.find(
    (m) => m.organizationId === currentOrganizationId,
  );
  const displayName = current?.name ?? "Choisir une organisation…";

  return (
    <div className="group-data-[collapsible=icon]:hidden px-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          disabled={pending}
          className={cn(
            "group/org-switch-trigger text-sidebar-foreground flex h-10 w-full max-w-full cursor-pointer items-center gap-2 rounded-lg py-0 pl-2 pr-2 text-left text-sm outline-none transition-colors",
            "hover:bg-sidebar-accent/40",
            "focus-visible:ring-2 focus-visible:ring-sidebar-ring/25 focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar",
            "aria-expanded:bg-sidebar-accent/35",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
          aria-label={`Organisation active : ${displayName}`}
          aria-haspopup="menu"
        >
          {current ? (
            <OrgMark name={current.name} logoUrl={current.logoUrl} />
          ) : (
            <PlaceholderMark />
          )}
          <span className="text-sidebar-foreground/85 min-w-0 flex-1 truncate font-medium tracking-tight">
            {displayName}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-sidebar-foreground/45 transition-colors group-hover/org-switch-trigger:text-sidebar-foreground/65 group-aria-expanded/org-switch-trigger:text-sidebar-foreground/80"
            aria-hidden
            strokeWidth={2}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          {memberships.map((m) => {
            const isActive = m.organizationId === currentOrganizationId;
            const roleLabel = organizationMembershipRoleLabel(
              m.role === "ADMIN" ? "ADMIN" : "MEMBER",
            ).toLowerCase();
            return (
              <DropdownMenuItem
                key={m.organizationId}
                className="cursor-pointer gap-2 py-2 pr-2"
                onClick={() => {
                  if (isActive) return;
                  start(async () => {
                    const r = await switchOrganizationAction(m.organizationId);
                    if (r.ok) router.refresh();
                  });
                }}
              >
                <OrgMark name={m.name} logoUrl={m.logoUrl} size="sm" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="block truncate font-medium">{m.name}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {roleLabel}
                  </span>
                </span>
                {isActive ? (
                  <Check
                    className="size-4 shrink-0 text-sidebar-foreground opacity-70"
                    aria-hidden
                  />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
