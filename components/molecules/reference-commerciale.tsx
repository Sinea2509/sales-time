"use client";

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  GRILLE_KISS,
  profilDeLaGrille,
  type GrilleCommerciale,
} from "@/lib/grilles-commerciales";

/**
 * Un nom de profil (« Influent », « Sécurité ») qui explique ce qu'il recouvre
 * quand on le touche, et surtout comment s'y adapter en rendez-vous.
 *
 * Le mot lui-même est la commande, souligné en pointillé et suivi d'un « i » :
 * c'est le signe convenu qu'il en dit plus. La bulle s'ouvre au clic ou au
 * toucher plutôt qu'au survol, pour que le téléphone ait droit à l'explication
 * autant que l'écran, et pour qu'on puisse lire les deux phrases sans que la
 * bulle s'échappe.
 *
 * Si la clé ne correspond à aucun profil connu, le mot s'affiche nu, sans
 * commande morte : mieux vaut un libellé simple qu'un « i » qui n'ouvre rien.
 */
export function TermeDeGrille({
  grille,
  code,
  libelle,
  className,
}: {
  grille: GrilleCommerciale;
  code: string;
  /** Le texte affiché, quand il diffère du nom du référentiel (ex. une lettre). */
  libelle?: string;
  className?: string;
}) {
  const profil = profilDeLaGrille(grille, code);
  const texte = libelle ?? profil?.nom ?? code;

  if (!profil) {
    return <span className={className}>{texte}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "focus-visible:ring-brand/60 inline-flex items-center gap-1 rounded-sm underline decoration-dotted decoration-zinc-400 underline-offset-2 outline-none hover:decoration-zinc-600 focus-visible:ring-2 dark:decoration-zinc-500",
          className,
        )}
        aria-label={`${profil.nom} : ce que c'est et comment s'y adapter`}
      >
        {texte}
        <Info className="size-3 shrink-0 text-zinc-400" aria-hidden />
      </PopoverTrigger>
      <PopoverContent>
        <p className="flex items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {profil.lettre}
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {profil.nom}
          </span>
          <span className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
            {grille.nom}
          </span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {profil.resume}
        </p>
        <p className="mt-2 border-t border-zinc-100 pt-2 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            En rendez-vous
          </span>{" "}
          · {profil.enRendezVous}
        </p>
      </PopoverContent>
    </Popover>
  );
}

/**
 * L'affordance d'en-tête : « Comprendre le DISC », qui ouvre la grille entière.
 *
 * Elle double le mot à mot des bulles de profil, à dessein : qui découvre la
 * grille veut d'abord la vue d'ensemble, les quatre ou six profils d'un coup,
 * avant d'aller lire le geste de l'un d'eux. La bulle par profil répond ensuite
 * à « et pour celui-là, je fais quoi ? ».
 */
export function GuideDeGrille({
  grille,
  className,
}: {
  grille: GrilleCommerciale;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "focus-visible:ring-brand/60 text-brand inline-flex items-center gap-1 rounded-sm text-xs font-medium outline-none hover:underline focus-visible:ring-2",
          className,
        )}
      >
        <Info className="size-3.5 shrink-0" aria-hidden />
        Comprendre le {grille.nom}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {grille.nom}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {grille.intro}
        </p>
        <ul className="mt-3 space-y-2.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {grille.profils.map((p) => (
            <li key={p.code} className="flex gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {p.lettre}
              </span>
              <span className="min-w-0">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {p.nom}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {p.enRendezVous}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/**
 * « Comment lire ces quatre colonnes » : ce que trient Keep, Improve, Start et
 * Stop, pour qui découvre la méthode KISS.
 *
 * Les titres restent en anglais, c'est le nom de la méthode ; la bulle en donne
 * la clé en français, une fois, à côté du bloc où ils apparaissent.
 */
export function GuideKiss({ className }: { className?: string }) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "focus-visible:ring-brand/60 text-brand inline-flex items-center gap-1 rounded-sm text-xs font-medium outline-none hover:underline focus-visible:ring-2",
          className,
        )}
      >
        <Info className="size-3.5 shrink-0" aria-hidden />
        Comment lire ces colonnes
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          La méthode KISS
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {GRILLE_KISS.intro}
        </p>
        <ul className="mt-3 space-y-2.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {GRILLE_KISS.quadrants.map((q) => (
            <li key={q.cle}>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {q.nom}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {q.resume}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
