"use client";

import type { ReactNode } from "react";
import { PanelTabs } from "@/components/organisms/panel-tabs";

export type MeetingDetailTabId =
  | "grille"
  | "objections"
  | "soncas"
  | "disc"
  | "kiss"
  | "pipedrive"
  | "email"
  | "transcript";

export type MeetingDetailTab = {
  id: MeetingDetailTabId;
  label: string;
  panel: ReactNode;
};

/** Les onglets de la fiche d'un rendez-vous, sur le modèle commun `PanelTabs`. */
export function MeetingDetailTabs({
  tabs,
  initial = "grille",
}: {
  tabs: MeetingDetailTab[];
  initial?: MeetingDetailTabId;
}) {
  return (
    <PanelTabs tabs={tabs} initial={initial} label="Détail de l'analyse" />
  );
}
