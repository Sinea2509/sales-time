"use client";

import { useRouter } from "next/navigation";
import { MeetingCreateForm } from "@/components/organisms/meeting-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";

/**
 * La première connexion : rien n'a encore été analysé, et le tableau de bord
 * n'aurait que des cases vides à montrer. À la place, une seule page, avec le
 * formulaire d'analyse ouvert et le dépôt de fichier en premier : le
 * commercial glisse son transcript et voit son premier rendez-vous analysé.
 *
 * Le tableau de bord reprend sa place dès qu'un rendez-vous existe.
 */
export function FirstMeetingWelcome({
  meetingTypeOptions,
}: {
  meetingTypeOptions: string[];
}) {
  const router = useRouter();
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.62fr)_minmax(300px,1fr)]">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className={cardTitleClass}>
              Analysez votre premier rendez-vous
            </h2>
            <p className="text-muted-foreground mt-1 max-w-[64ch] text-sm leading-relaxed">
              Glissez le transcript ou l&apos;enregistrement d&apos;un
              rendez-vous, ou collez son texte. En deux minutes, vous aurez le
              compte rendu, le profil du prospect, les objections et votre
              coaching.
            </p>
          </div>
          <MeetingCreateForm
            meetingTypeOptions={meetingTypeOptions}
            variant="page"
            onSuccess={(meetingId) =>
              router.push(`/company/rendez-vous/${meetingId}`)
            }
          />
        </CardContent>
      </Card>

      <div className="grid content-start gap-4">
        <Card className="border-brand/30 bg-brand-soft shadow-none dark:bg-brand/10">
          <CardContent className="space-y-2 pt-6">
            <h2 className={cardTitleClass}>Ce que vous obtiendrez</h2>
            <ul className="text-[13.5px] leading-relaxed">
              <li>Un compte rendu prêt à coller dans votre CRM.</li>
              <li>Le SalesScore du rendez-vous et la grille de découverte.</li>
              <li>Les motivations et le style du prospect, SONCAS et DISC.</li>
              <li>
                Les objections, ce qui a été répondu, et quoi dire ensuite.
              </li>
              <li>Votre coaching KISS, la question en or et un défi.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 pt-6">
            <h2 className={cardTitleClass}>D&apos;où vient le transcript ?</h2>
            <p className="text-muted-foreground text-[13px] leading-relaxed">
              L&apos;export de votre outil de visioconférence, un fichier texte,
              Word ou PDF, ou directement l&apos;enregistrement audio du
              rendez-vous : Sales Time le transcrit, un intervenant par ligne.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
