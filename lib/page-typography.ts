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

/** Tag a card title is rendered with. */
export type CardHeadingTag = "h2" | "h3";

/**
 * Which tag the card titles of a section should use.
 *
 * A card title sits under the section's own `h2`, so it is an `h3`. When the
 * page carries that title instead and the section stays silent, the `h2` is not
 * rendered at all and the cards move up one rank: an `h3` hanging straight off
 * the page `h1` leaves a hole in the outline, and someone browsing by headings
 * reads that hole as a title they failed to reach.
 *
 * The visual class does not follow the tag. Rank here is the document
 * structure, not the type size, and the card titles keep the size their layout
 * was drawn for.
 */
export function cardHeadingTag(sectionWritesHeading: boolean): CardHeadingTag {
  return sectionWritesHeading ? "h3" : "h2";
}

/** Dense body copy under subsections. */
export const cardProseBodyClass =
  "text-foreground/90 text-sm leading-relaxed sm:text-[15px] sm:leading-relaxed";
