var _a;
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
    testDir: "e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "list",
    use: {
        baseURL: (_a = process.env.PLAYWRIGHT_BASE_URL) !== null && _a !== void 0 ? _a : "http://127.0.0.1:3000",
        trace: "on-first-retry",
    },
    projects: [{ name: "chromium", use: Object.assign({}, devices["Desktop Chrome"]) }],
    webServer: process.env.CI
        ? undefined
        : {
            command: "npm run dev",
            url: "http://127.0.0.1:3000",
            reuseExistingServer: true,
            timeout: 120000,
        },
});
