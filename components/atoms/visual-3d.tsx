// cspell:words expiree
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Les visuels 3D livrés dans `public/visuels`, en WebP et en PNG. */
export type Visual3dName =
  | "c1-aucun-rdv"
  | "c2-analyse-en-cours"
  | "c3-donnees-insuffisantes"
  | "c4-aucun-contact"
  | "c5-recherche-vide"
  | "c6-invitation-expiree"
  | "c7-erreur"
  | "b3-coaching"
  | "b8-prospect"
  | "b9-objections";

type Props = {
  name: Visual3dName;
  /** La taille d'affichage ; le fichier est livré au double. */
  width: number;
  height: number;
  className?: string;
  /** Vrai pour un visuel visible dès l'arrivée sur la page. */
  priority?: boolean;
};

/**
 * Un visuel 3D de la charte, décoratif : le texte qu'il illustre est à côté,
 * d'où le texte alternatif vide.
 *
 * Les fichiers sont déjà optimisés (WebP au double de la taille affichée) :
 * ils passent tels quels, sans le service d'optimisation d'images. L'ombre au
 * sol est posée en CSS (`.visual3d` dans globals.css), pour suivre le thème.
 */
export function Visual3d({ name, width, height, className, priority }: Props) {
  return (
    <span className={cn("visual3d", className)}>
      <Image
        src={`/visuels/${name}.webp`}
        width={width}
        height={height}
        alt=""
        unoptimized
        priority={priority}
        draggable={false}
      />
    </span>
  );
}
