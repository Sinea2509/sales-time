export function optionsWithLegacy(
  options: readonly { value: string; label: string }[],
  stored: string,
): { value: string; label: string }[] {
  if (!stored) return [...options];
  const known = options.some((o) => o.value === stored);
  if (known) return [...options];
  return [...options, { value: stored, label: stored }];
}
