import { CopyTextButton } from "@/components/molecules/copy-text-button";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";

export function MeetingTranscriptTab({
  transcript,
  notes,
  sourceLabel,
}: {
  transcript: string;
  notes: string | null;
  /** D'où vient le texte : « transcrit depuis un enregistrement audio », etc. */
  sourceLabel: string | null;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0">
              <h2 className={cardTitleClass}>Transcript du rendez-vous</h2>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                C&apos;est la matière première de toutes les analyses.
                {sourceLabel ? ` ${sourceLabel}` : ""}
              </p>
            </div>
            <span className="flex-1" />
            <CopyTextButton text={transcript} label="Copier" />
          </div>
          <pre className="m-0 rounded-lg border border-border bg-muted/40 px-4 py-3.5 font-sans text-[12.9px] leading-[1.85] break-words whitespace-pre-wrap">
            {transcript}
          </pre>
        </CardContent>
      </Card>
      {notes ? (
        <Card>
          <CardContent className="space-y-2 pt-6">
            <h2 className={cardTitleClass}>Notes du commercial</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {notes}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
