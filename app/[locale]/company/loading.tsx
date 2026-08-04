import { Skeleton } from "@/components/ui/skeleton";

/*
  Le segment /company est force-dynamic et enchaîne plusieurs requêtes avant
  de rendre quoi que ce soit : sans ce fichier, cliquer une entrée du menu
  laisse l'écran précédent figé, et rien ne dit que la navigation a eu lieu.
  Le squelette reprend la silhouette la plus courante des pages du segment :
  un en-tête, une rangée d'indicateurs, une grande carte.
*/
export default function CompanyLoading() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-80" />
      <p className="sr-only">Chargement de la page</p>
    </div>
  );
}
