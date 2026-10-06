import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";

/** Un passage-clé, prêt à afficher. */
export type ProfileMomentView = {
  readonly moment: string;
  /** Ce que le passage montre : « Nouveauté (net), Argent (faible) ». */
  readonly tags: string;
  readonly question: string;
  readonly words: string;
  readonly reading: string;
};

/**
 * Les passages qui fondent un profil SONCAS ou DISC : la note se lit ainsi
 * sur des réponses précises du prospect, et non sur une impression
 * d'ensemble.
 */
export function ProfileMomentsList({
  title,
  intro,
  moments,
}: {
  title: string;
  intro: string;
  moments: readonly ProfileMomentView[];
}) {
  if (moments.length === 0) return null;
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div>
          <h2 className={cardTitleClass}>{title}</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {intro}
          </p>
        </div>
        <ol className="grid gap-2.5">
          {moments.map((m, index) => (
            <li
              key={`${index}-${m.words}`}
              className="rounded-lg border border-border bg-muted/30 px-3.5 py-3 text-[12.8px] leading-relaxed"
            >
              <p className="text-muted-foreground text-[11.5px] font-semibold">
                {m.moment ? `${m.moment} · ` : ""}
                {m.tags}
              </p>
              {m.question ? (
                <p className="text-muted-foreground mt-1">
                  <span className="font-semibold">Question : </span>«{" "}
                  {m.question} »
                </p>
              ) : null}
              <p className="mt-1 italic">« {m.words} »</p>
              {m.reading ? <p className="mt-1">{m.reading}</p> : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
