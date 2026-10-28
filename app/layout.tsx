import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { Metadata } from "next";
import {
  Geist_Mono,
  Plus_Jakarta_Sans,
  Schibsted_Grotesk,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

/** Required: `getLocale` / `getMessages` read request headers via next-intl (see DYNAMIC_SERVER_USAGE). */
export const dynamic = "force-dynamic";

/*
  Les polices de la charte 4 bis : Plus Jakarta Sans pour le texte, Schibsted
  Grotesk pour les titres et les grands chiffres. Posées sur <html>, elles
  valent aussi pour les menus et les boîtes de dialogue rendus hors de la page.
*/
const textFont = Plus_Jakarta_Sans({
  variable: "--font-texte",
  subsets: ["latin"],
});

const headingFont = Schibsted_Grotesk({
  variable: "--font-titres",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sales Time · Coach commercial IA",
    template: "%s · Sales Time",
  },
  description:
    "Sales Time transforme vos transcripts de RDV en compte rendu structuré, coaching KISS, profil prospect DISC/SONCAS et mail de suivi, pour gagner du TUC et piloter la qualité commerciale.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${textFont.variable} ${headingFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/*
          Les graphiques MUI se peignent avec emotion. Sans registre, emotion
          glisse au rendu serveur une balise <style> juste avant chaque
          élément stylé, que le client ne produit pas : React signale alors
          une erreur d'hydratation. Ce fournisseur collecte ces règles pendant
          le rendu et les remonte dans le <head> via useServerInsertedHTML,
          ce qui garde un balisage identique des deux côtés.
        */}
        <AppRouterCacheProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <TooltipProvider>{children}</TooltipProvider>
          </NextIntlClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
