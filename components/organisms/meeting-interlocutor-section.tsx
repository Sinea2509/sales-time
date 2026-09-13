import { InterlocutorProfileTabs } from "@/components/molecules/interlocutor-profile-tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  cardProseBodyClass,
  pageTitleClass,
  sectionHeadingClass,
} from "@/lib/page-typography";
import { prospectInitials } from "@/lib/prospect-initials";
import { cn } from "@/lib/utils";
import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import {
  discBarItemsForUi,
  soncasBarItemsForUi,
} from "@/src/core/domain/prospect-profile-bars";

export function MeetingInterlocutorSection({
  prospectName,
  prospectCompany,
  interlocutorProfile,
  discResult,
  soncasResult,
  analysisPending = false,
}: {
  prospectName: string;
  prospectCompany: string | null;
  interlocutorProfile: string;
  discResult: DiscAnalysisResult | null;
  soncasResult: SoncasAnalysisResult | null;
  analysisPending?: boolean;
}) {
  const discBars = discResult ? discBarItemsForUi(discResult) : null;
  const soncasBars = soncasResult ? soncasBarItemsForUi(soncasResult) : null;

  return (
    <section className="space-y-3">
      <h2 className={sectionHeadingClass}>Interlocuteur</h2>
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-card text-lg font-semibold text-foreground shadow-sm ring-1 ring-border/80 dark:bg-zinc-100 dark:ring-zinc-700/80">
              {prospectInitials(prospectName)}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <p className={cn(pageTitleClass, "text-xl")}>{prospectName}</p>
              {prospectCompany?.trim() ? (
                <p className="text-muted-foreground text-sm">
                  {prospectCompany.trim()}
                </p>
              ) : null}
              <p className={cn(cardProseBodyClass, "text-sm leading-relaxed")}>
                {interlocutorProfile}
              </p>
            </div>
          </div>

          <InterlocutorProfileTabs
            discBars={discBars}
            soncasBars={soncasBars}
            discActionableAdvice={discResult?.actionableAdvice ?? null}
            soncasActionableAdvice={soncasResult?.actionableAdvice ?? null}
            analysisPending={analysisPending}
          />
        </CardContent>
      </Card>
    </section>
  );
}
