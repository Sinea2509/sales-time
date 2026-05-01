import sanitizeHtml from "sanitize-html";

/** HTML sûr pour le corps d’e-mail d’invitation (gras, italique, liens, listes, paragraphes). */
export function sanitizeInviteMessageHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ["p", "br", "strong", "em", "b", "i", "a", "ul", "ol", "li"],
    allowedAttributes: {
      a: ["href", "rel", "target"],
    },
    transformTags: {
      b: "strong",
      i: "em",
    },
  });
}
