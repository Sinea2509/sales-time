import { MeetingFollowUpEmailBlock } from "@/components/organisms/meeting-follow-up-email";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";

export function MeetingEmailTab({
  meetingId,
  initialDraft,
}: {
  meetingId: string;
  initialDraft: string | null;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className={cardTitleClass}>
            Le mail qui accompagne votre prochain rendez-vous
          </h2>
          <p className="text-muted-foreground mt-1 max-w-[64ch] text-xs leading-relaxed">
            Il reprend ce que vous avez retenu et propose ou confirme le
            prochain rendez-vous, avec sa date quand elle a été dite.
            Retouchez-le en un clic avec le coach, puis envoyez-le depuis votre
            messagerie : rien ne part sans vous.
          </p>
        </div>
        <MeetingFollowUpEmailBlock
          meetingId={meetingId}
          initialDraft={initialDraft}
        />
      </CardContent>
    </Card>
  );
}
