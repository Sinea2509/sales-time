import { Loader2 } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";

export function MeetingAnalysisStatusBanner({
  status,
}: {
  status: MeetingStatus;
}) {
  if (status !== "PROCESSING") {
    return null;
  }

  return (
    <Card className="border-brand/30 bg-brand/5">
      <CardHeader>
        <CardTitle className={cardTitleClass}>Analyse en cours</CardTitle>
        <CardDescription>
          SONCAS, DISC et KISS sont générés automatiquement à partir du
          transcript. Rechargez la page dans quelques instants si les résultats
          n&apos;apparaissent pas encore.
        </CardDescription>
        <div className="text-brand flex items-center gap-2 pt-1 text-sm font-medium">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Analyse automatique…
        </div>
      </CardHeader>
    </Card>
  );
}
