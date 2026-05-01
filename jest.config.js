const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import("jest").Config} */
const customJestConfig = {
  testEnvironment: "node",
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "src/core/domain/authorization-policy.ts",
    "src/core/domain/person-normalize.ts",
    "src/core/domain/person-outreach-priority.ts",
    "src/core/domain/org-soncas-team-aggregate.ts",
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
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
