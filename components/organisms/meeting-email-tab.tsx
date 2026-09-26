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
          <h2 className={cardTitleClass}>E-mail de suivi proposé</h2>
          <p className="text-muted-foreground mt-1 max-w-[64ch] text-xs leading-relaxed">
            Rédigé depuis le transcript et vos préférences de ton. Relisez,
            ajustez, envoyez depuis votre messagerie : le produit propose un
            brouillon, il n&apos;envoie rien à votre place.
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
