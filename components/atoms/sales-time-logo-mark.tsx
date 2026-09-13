import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type SalesTimeLogoMarkProps = {
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses = {
  sm: "size-6 rounded-md [&_svg]:size-3",
  md: "size-[30px] rounded-lg [&_svg]:size-[15px]",
} as const;

/*
  Le blanc est ici volontaire, et c'est la seule exception au passage général à
  `text-brand-foreground` sur les aplats de marque. Ce glyphe n'est pas du texte
  mais une marque graphique : l'exigence qui s'y applique est celle des éléments
  non textuels, 3:1, et le blanc sur l'aplat éclairci du thème sombre tient
  3,27:1, mesuré au navigateur. Le faire basculer en encre sombre retournerait
  le logo d'un thème à l'autre, alors qu'un carré violet à glyphe blanc est ce à
  quoi le produit se reconnaît, ici comme partout ailleurs. Le même raisonnement
  vaut pour le bloc-marque de l'administration, dans `admin-shell.tsx`.
*/
export function SalesTimeLogoMark({
  size = "md",
  className,
}: SalesTimeLogoMarkProps) {
  return (
    <span
      className={cn(
        "bg-brand text-brand-foreground flex shrink-0 items-center justify-center",
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      <TrendingUp strokeWidth={2.3} />
    </span>
  );
}
