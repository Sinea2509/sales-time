/**
 * Shared heading and card title classes so page hierarchy stays consistent
 * (see company member profile: page title → section h2 → card titles → h3 + body).
 */

/** Primary page title (h1 or equivalent). */
export const pageTitleClass =
  "text-foreground text-2xl font-semibold tracking-tight sm:text-3xl";

/** Section heading outside cards (h2), same visual rank as a main card title. */
export const sectionHeadingClass =
  "text-foreground text-lg font-semibold leading-tight tracking-tight";

/**
 * Primary title inside a card header. Overrides CardTitle defaults on `size="sm"`
 * cards (`group-data-[size=sm]/card:text-sm`).
 */
export const cardTitleClass =
  "text-foreground text-lg font-semibold leading-tight tracking-tight group-data-[size=sm]/card:text-lg";

/** Subsection title inside a card (h3). */
export const cardSubsectionTitleClass =
  "text-foreground text-sm font-semibold tracking-tight";

/** Dense body copy under subsections. */
export const cardProseBodyClass =
  "text-foreground/90 text-sm leading-relaxed sm:text-[15px] sm:leading-relaxed";
