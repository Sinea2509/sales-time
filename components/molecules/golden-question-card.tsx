import { Star } from "lucide-react";
import { Icon3d } from "@/components/atoms/icon-3d";
import { Card, CardContent } from "@/components/ui/card";

/**
 * La question en or d'un rendez-vous à préparer, à relire juste avant d'entrer.
 *
 * Sur la carte nuit, comme le score sur la fiche : c'est la seule chose de la
 * page qu'il faut retenir. Thomas ne la retrouvait plus (« la question en or,
 * on n'a plus ça ? », retour du 29 octobre 2026) : elle était rangée parmi les
 * autres questions, sous un simple numéro.
 */
export function GoldenQuestionCard({
  title,
  questions,
  why,
}: {
  title: string;
  questions: readonly string[];
  /** Pourquoi cette question : une phrase, quand il n'y en a qu'une. */
  why?: string | null;
}) {
  return (
    <Card className="dark st-night">
      <CardContent className="py-2">
        <div className="flex items-start gap-4">
          <Icon3d tone="amber" size="lg">
            <Star className="fill-current" aria-hidden />
          </Icon3d>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold tracking-[.09em] text-white/70 uppercase">
              {title}
            </p>
            {questions.length === 1 ? (
              <p className="mt-1.5 text-[19px] leading-snug font-semibold text-white">
                {questions[0]}
              </p>
            ) : (
              <ol className="mt-2.5 space-y-2.5">
                {questions.map((question, index) => (
                  <li
                    key={question}
                    className="flex gap-3 text-[15px] leading-snug font-semibold text-white"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-[12px] tabular-nums">
                      {index + 1}
                    </span>
                    <span className="min-w-0 pt-0.5">{question}</span>
                  </li>
                ))}
              </ol>
            )}
            {why?.trim() ? (
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/70">
                {why}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
