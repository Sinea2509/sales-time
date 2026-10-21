import type { LucideIcon } from "lucide-react";
import { Icon3d, type Icon3dTone } from "@/components/atoms/icon-3d";
import { Visual3d, type Visual3dName } from "@/components/atoms/visual-3d";

type PrdEmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  /** La teinte de l'icône en relief ; le violet de la marque par défaut. */
  tone?: Icon3dTone;
  /** Un visuel 3D de la charte, à la place de l'icône. */
  illustration?: Visual3dName;
  action?: React.ReactNode;
};

/**
 * Un écran vide qui dit pourquoi il l'est et quoi faire ensuite.
 *
 * Revue UX du 21 octobre 2026 : une page vide n'est pas une page en panne.
 * Un visuel 3D de la charte l'illustre quand il en existe un pour ce cas,
 * sinon une icône en relief ; l'action devient le point d'arrivée du regard.
 */
export function PrdEmptyState({
  title,
  description,
  icon: Icon,
  tone = "violet",
  illustration,
  action,
}: PrdEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-[radial-gradient(60%_80%_at_50%_0%,rgba(108,77,255,0.06),transparent)] px-6 py-10 text-center dark:border-neutral-700">
      {illustration ? (
        <Visual3d
          name={illustration}
          width={240}
          height={180}
          className="mb-2"
        />
      ) : Icon ? (
        <Icon3d tone={tone} size="lg" className="mb-4">
          <Icon aria-hidden />
        </Icon3d>
      ) : null}
      <h3 className="text-base font-semibold text-foreground dark:text-neutral-100">
        {title}
      </h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
