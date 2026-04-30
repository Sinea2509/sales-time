import { redirect } from "next/navigation";

/** Forfaits avec barre latérale / en-tête : route canonique sous `/company/plan`. */
export default function PlanPageRedirect() {
  redirect("/company/plan");
}
