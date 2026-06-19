/**
 * Mirrors the browser's `input[accept]` matching for a single file so the same
 * rule can be enforced for both clicked and drag-and-dropped files.
 *
 * Tokens may be extensions (`.txt`), exact MIME types (`text/plain`), or MIME
 * wildcards (`text/*`). An empty `accept` matches everything.
 */
export function fileMatchesAccept(
  fileName: string,
  fileType: string,
  accept: string,
): boolean {
  const tokens = accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }

  const name = fileName.toLowerCase();
  const type = fileType.toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith(".")) {
      return name.endsWith(token);
    }
    if (token.endsWith("/*")) {
      return type.startsWith(token.slice(0, -1));
    }
    return type === token;
  });
}
