/**
 * À chaque changement de page, les blocs de la nouvelle page montent l'un
 * après l'autre (classe `st-page` dans globals.css). Ici, d'un onglet des
 * paramètres à l'autre : le menu des paramètres, porté par le layout, reste
 * en place.
 */
export default function SettingsTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="st-page">{children}</div>;
}
