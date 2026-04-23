import { getRequestConfig } from "next-intl/server";

const locales = ["fr", "en"] as const;

export type AppLocale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as AppLocale | undefined;
  if (!locale || !locales.includes(locale)) {
    locale = "fr";
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
