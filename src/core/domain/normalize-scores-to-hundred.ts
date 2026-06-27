/**
 * Répartit des scores non négatifs sur 100 % (méthode des plus grands restes).
 */
export function normalizeScoresToHundred(
  values: Record<string, number>,
): Record<string, number> {
  const keys = Object.keys(values);
  if (keys.length === 0) return {};

  const sanitized = keys.map((key) => ({
    key,
    value: Math.max(0, values[key] ?? 0),
  }));
  const total = sanitized.reduce((acc, { value }) => acc + value, 0);
  if (total <= 0) {
    const equal = Math.floor(100 / keys.length);
    const remainder = 100 - equal * keys.length;
    return Object.fromEntries(
      keys.map((key, i) => [key, equal + (i < remainder ? 1 : 0)]),
    );
  }

  const raw = sanitized.map(({ key, value }) => ({
    key,
    exact: (100 * value) / total,
    floor: Math.floor((100 * value) / total),
  }));
  let assigned = raw.reduce((acc, r) => acc + r.floor, 0);
  const ranked = [...raw].sort(
    (a, b) => b.exact - b.floor - (a.exact - a.floor),
  );
  const out: Record<string, number> = {};
  for (const row of raw) {
    out[row.key] = row.floor;
  }
  for (const row of ranked) {
    if (assigned >= 100) break;
    out[row.key] = (out[row.key] ?? 0) + 1;
    assigned += 1;
  }
  return out;
}
