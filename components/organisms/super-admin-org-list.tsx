"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { enterSuperAdminOrganizationAction } from "@/app/[locale]/company/super-admin-actions";
import type { OrganizationSummary } from "@/src/core/ports/organization-directory-port";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  organizations: OrganizationSummary[];
};

export function SuperAdminOrgList({ organizations }: Props) {
  const [pending, startTransition] = useTransition();
  const t = useTranslations("superAdminOrgList");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <CardTitle className="text-base">{org.name}</CardTitle>
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
                  placeholder={t("reasonPlaceholder")}
                  disabled={pending}
                />
              </div>
              <Button
                type="button"
                disabled={pending}
                onClick={() => {
                  const input = document.getElementById(
                    `reason-${org.id}`,
                  ) as HTMLInputElement | null;
                  const reason = input?.value?.trim() || null;
                  startTransition(() => {
                    void enterSuperAdminOrganizationAction({
                      targetOrganizationId: org.id,
                      reason,
                    });
                  });
                }}
              >
                {t("operateButton")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
