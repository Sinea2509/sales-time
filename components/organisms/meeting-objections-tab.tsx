import { ToneChip } from "@/components/atoms/tone-chip";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";

/**
 * L'analyse des objections n'existe pas encore : l'onglet tient sa place
 * dans la fiche et dit ce qu'il montrera, pour que la promesse soit lisible
 * avant d'être tenue.
 */
export function MeetingObjectionsTab({
  prospectName,
}: {
  prospectName: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className={cardTitleClass}>Objections</h2>
          <ToneChip tone="warn">Bientôt disponible</ToneChip>
        </div>
        <p className="text-muted-foreground max-w-[64ch] text-sm leading-relaxed">
          Une objection est une phrase de {prospectName} qui freine, doute ou
          pose une condition. Pour chacune, vous lirez ici ce qui a été répondu
          sur le moment, l&apos;effet que cela a produit, et une suggestion qui
          contient toujours une question à poser : c&apos;est la question qui
          fait avancer, pas l&apos;argument.
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          En attendant, la question en or de l&apos;onglet KISS est le meilleur
          endroit pour faire sortir une objection au prochain rendez-vous.
        </p>
      </CardContent>
    </Card>
  );
}
