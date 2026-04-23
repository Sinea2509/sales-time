/**
 * Normalized key for deduplicating contacts within an org.
 * Must stay aligned with SQL in `prisma/migrations/...add_person_model/migration.sql`.
 */
export function normalizePersonDisplayKey(displayName: string): string {
  return displayName.trim().replace(/\s+/g, " ").toLowerCase();
}
