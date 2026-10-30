import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Icon3d, type Icon3dTone } from "@/components/atoms/icon-3d";
import { ToneChip } from "@/components/atoms/tone-chip";
import { Card, CardContent } from "@/components/ui/card";
import type { LikelyObjection } from "@/src/core/domain/meeting-briefing-zod";

/**
 * Une rubrique de « Préparer un RDV » : une icône en relief, un titre, son
 * contenu. La même carte pour les deux préparations, qui n'étaient que du texte
 * ou quatre bordures de couleur (retour de Thomas du 29 octobre 2026 : « très
 * triste par rapport au reste »). La couleur reste dans l'icône.
 */
export function PrepareCard({
  icon: Icon,
  tone = "violet",
  title,
  className,
  children,
}: {
  icon: LucideIcon;
  tone?: Icon3dTone;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardContent className="py-1">
        <div className="mb-3 flex items-center gap-3">
          <Icon3d tone={tone} size="sm">
            <Icon aria-hidden />
          </Icon3d>
          <h3 className="text-[15px] font-semibold">{title}</h3>
        </div>
        <div className="space-y-2 text-sm leading-relaxed">{children}</div>
      </CardContent>
    </Card>
  );
}

/** Une liste à puces de la couleur de la marque. */
export function PrepareList({ items }: { items: readonly string[] }) {
  return (
    <ul className="marker:text-brand list-disc space-y-1.5 pl-4.5">
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  );
}

/** Les objections à anticiper : ce que le prospect risque de dire, puis la réponse. */
export function LikelyObjectionsList({
  items,
}: {
  items: readonly LikelyObjection[];
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.objection}>
          <p className="font-semibold">{item.objection}</p>
          <p className="text-muted-foreground mt-0.5">{item.answer}</p>
        </li>
      ))}
    </ul>
  );
}

/** Les mots-clés d'une fiche de préparation. */
export function PrepareChips({ items }: { items: readonly string[] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <ToneChip key={item} tone="brand">
          {item}
        </ToneChip>
      ))}
    </span>
  );
}
