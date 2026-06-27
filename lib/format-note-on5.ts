export function formatNoteOn5(value: number | null): string {
  if (value == null) return "—";
  const text =
    Math.abs(value % 1) < 0.05
      ? String(Math.round(value))
      : String(value).replace(".", ",");
  return `${text}/5`;
}
