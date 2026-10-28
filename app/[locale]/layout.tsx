import { hasLocale } from "next-intl";
import { Plus_Jakarta_Sans, Schibsted_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

/*
  Les polices de la charte 4 bis : Plus Jakarta Sans pour le texte, Schibsted
  Grotesk pour les titres et les grands chiffres. Elles se déclarent sur
  :root et non sur un conteneur, pour que les menus, les info-bulles et les
  boîtes de dialogue, posés hors de la page, les reçoivent aussi.
*/
const textFont = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" });
const headingFont = Schibsted_Grotesk({ subsets: ["latin"], display: "swap" });
const CHARTER_FONTS_CSS = `:root{--font-texte:${textFont.style.fontFamily};--font-titres:${headingFont.style.fontFamily}}`;

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return (
    <>
      <style href="charter-fonts" precedence="default">
        {CHARTER_FONTS_CSS}
      </style>
      {children}
    </>
  );
}
