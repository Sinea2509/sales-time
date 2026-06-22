import { Card, CardContent } from "@/components/ui/card";
import { cardProseBodyClass, sectionHeadingClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

export function MeetingSynthesisSection({
  meetingSynthesis,
  fromAi,
}: {
  meetingSynthesis: string;
  fromAi: boolean;
}) {
  return (
    <section className="space-y-3">
      <h2 className={sectionHeadingClass}>Synthèse du rendez-vous</h2>
      <Card>
        <CardContent className={cn("pt-6", cardProseBodyClass)}>
          <p className="leading-relaxed">{meetingSynthesis}</p>
          {!fromAi ? (
            <p className="text-muted-foreground mt-3 text-xs">
              {meetingSynthesis.includes("analyse automatique")
                ? "La synthèse complète apparaîtra une fois l'analyse automatique terminée."
                : "Synthèse indicative — une version enrichie est générée après analyse."}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
