import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Document parsers run only in Server Actions; keep them out of the bundle so
  // pdf.js/mammoth/word-extractor load natively at runtime.
  serverExternalPackages: ["unpdf", "mammoth", "word-extractor"],
  experimental: {
    // Transcript uploads (.txt/.vtt/.srt/.md) exceed the 1 MB Server Action
    // default; 4 MB is the practical ceiling (Vercel caps request bodies ~4.5 MB).
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default withNextIntl(nextConfig);
