import { redirect } from "next/navigation";

/** La page d’aperçu des paramètres a été retirée ; entrée directe sur Contexte. */
export default function OrganizationSettingsIndexPage() {
  redirect("/company/settings/contexte");
}
