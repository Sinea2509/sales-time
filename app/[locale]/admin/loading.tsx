import { Skeleton } from "@/components/ui/skeleton";

/* La même silhouette que le segment /company : en-tête, indicateurs, table. */
export default function AdminLoading() {
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
      <Skeleton className="h-96" />
      <p className="sr-only">Chargement de la page</p>
    </div>
  );
}
