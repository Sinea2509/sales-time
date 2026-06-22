const SELLER_SCATTER_COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f43f5e",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#65a30d",
] as const;

const SELLER_PILL_CLASSES = [
  "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/50 dark:text-sky-200",
  "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/50 dark:text-emerald-200",
  "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/50 dark:text-rose-200",
  "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/50 dark:text-amber-200",
  "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/50 dark:text-violet-200",
  "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/40 dark:bg-cyan-950/50 dark:text-cyan-200",
  "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-950/50 dark:text-indigo-200",
  "border-pink-200 bg-pink-50 text-pink-800 dark:border-pink-900/40 dark:bg-pink-950/50 dark:text-pink-200",
  "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/40 dark:bg-teal-950/50 dark:text-teal-200",
  "border-lime-200 bg-lime-50 text-lime-800 dark:border-lime-900/40 dark:bg-lime-950/50 dark:text-lime-200",
] as const;

export function sellerScatterColorForIndex(index: number): string {
  return SELLER_SCATTER_COLORS[index % SELLER_SCATTER_COLORS.length]!;
}

export function sellerScatterPillClassForIndex(index: number): string {
  return SELLER_PILL_CLASSES[index % SELLER_PILL_CLASSES.length]!;
}

export type SellerScatterStyle = {
  color: string;
  pillClass: string;
};

/** Couleur stable par commercial — tri alphabétique sur le libellé affiché. */
export function sellerScatterStylesByUserId(
  entries: ReadonlyArray<{ sellerUserId: string; sellerDisplayName: string }>,
): Map<string, SellerScatterStyle & { label: string }> {
  const labelById = new Map<string, string>();
  for (const entry of entries) {
    if (!labelById.has(entry.sellerUserId)) {
      labelById.set(entry.sellerUserId, entry.sellerDisplayName);
    }
  }

  const sortedIds = [...labelById.keys()].sort((a, b) =>
    (labelById.get(a) ?? a).localeCompare(labelById.get(b) ?? b, "fr"),
  );

  const styles = new Map<string, SellerScatterStyle & { label: string }>();
  sortedIds.forEach((sellerUserId, index) => {
    styles.set(sellerUserId, {
      label: labelById.get(sellerUserId) ?? sellerUserId,
      color: sellerScatterColorForIndex(index),
      pillClass: sellerScatterPillClassForIndex(index),
    });
  });
  return styles;
}
