"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

export function ElevatedModeIndicator() {
  const t = useTranslations("elevated");
  return (
    <Badge variant="destructive" className="font-medium">
      {t("badge")}
    </Badge>
  );
}
