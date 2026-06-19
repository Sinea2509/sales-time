"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { OrganizationSummary } from "@/src/core/ports/organization-directory-port";
import { SuperAdminEnterOrgButton } from "@/components/molecules/super-admin-enter-org-control";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardTitleClass, pageTitleClass } from "@/lib/page-typography";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SuperAdminOrgCard({ org }: { org: OrganizationSummary }) {
  const t = useTranslations("superAdminOrgList");
  const [reason, setReason] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cardTitleClass}>{org.name}</CardTitle>
        <CardDescription className="font-mono text-xs">
          {org.id}
          {org.slug ? ` · ${org.slug}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`reason-${org.id}`}>{t("reasonLabel")}</Label>
          <Input
            id={`reason-${org.id}`}
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
          />
        </div>
        <SuperAdminEnterOrgButton
          targetOrganizationId={org.id}
          organizationName={org.name}
          reason={reason.trim() || null}
          buttonLabel={t("operateButton")}
        />
      </CardContent>
    </Card>
  );
}

type Props = {
  organizations: OrganizationSummary[];
};

export function SuperAdminOrgList({ organizations }: Props) {
  const t = useTranslations("superAdminOrgList");

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClass}>{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {organizations.map((org) => (
          <SuperAdminOrgCard key={org.id} org={org} />
        ))}
      </div>
    </div>
  );
}
