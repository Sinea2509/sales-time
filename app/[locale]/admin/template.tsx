/**
 * À chaque changement de page, les blocs de la nouvelle page montent l'un
 * après l'autre (classe `st-page` dans globals.css). Le menu et l'en-tête,
 * portés par le layout, ne bougent pas.
 */
export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="st-page">{children}</div>;
}
