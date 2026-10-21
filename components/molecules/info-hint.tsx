import type { ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Un (i) qui garde pour lui la note de lecture d'un graphique.
 *
 * Audit du tableau de bord du 21 octobre 2026 : les phrases qui expliquent
 * comment un graphique est construit prenaient deux lignes sous chaque bloc.
 * Elles restent à un survol, ou à une touche au clavier, de qui les cherche.
 */
export function InfoHint({
  label,
  children,
  className,
}: {
  /** Ce que le bouton annonce au lecteur d'écran. */
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(
          "text-muted-foreground hover:text-foreground inline-flex shrink-0 rounded-sm align-middle outline-none focus-visible:ring-2 focus-visible:ring-brand-ring",
          className,
        )}
        aria-label={label}
      >
        <Info className="size-3.5" aria-hidden />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-sm text-left leading-relaxed"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
