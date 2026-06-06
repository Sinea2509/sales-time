/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS config for Jest */
const path = require("path");
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import("jest").Config} */
const customJestConfig = {
  /** Align with real project root so V8 URLs match `collectCoverageFrom` resolution. */
  rootDir: path.resolve(__dirname),
  testEnvironment: "node",
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  moduleNameMapper: {
    // SWC emits `.js` specifiers for TS sources; map back so Jest resolves `.ts` files.
    "^(\\.\\.?/.+)\\.js$": "$1",
    "^@/(.*)\\.js$": "<rootDir>/$1",
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "!app/**/*.test.ts",
    "!app/**/*.test.tsx",
    "src/core/domain/**/*.ts",
    "!src/core/domain/**/*.test.ts",
    "lib/auth/password.ts",
    "lib/auth/tokens.ts",
    "lib/website/normalize-website.ts",
    "lib/super-admin-org-cookie-crypto.ts",
    "src/adapters/vercel/meeting-text-for-ai-prompt.ts",
    "src/core/application/run-meeting-analysis.ts",
    "src/core/application/publish-global-prompt-version.ts",
    "src/core/application/enter-organization-as-super-admin.ts",
  ],
  coveragePathIgnorePatterns: ["/node_modules/"],
  coverageProvider: "v8",
  // Threshold disabled: Jest+V8+next/jest (SWC) currently yields 0% merged coverage in this
  // repo on Node 22/24 despite tests running; re-enable when upstream/Jest reports hits again.
};

module.exports = createJestConfig(customJestConfig);
