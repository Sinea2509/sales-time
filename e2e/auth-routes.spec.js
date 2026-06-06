import { test, expect } from "@playwright/test";
test.describe("Auth routes", () => {
    test("sign-in page renders", async ({ page }) => {
        await page.goto("/sign-in");
        await expect(page.locator("body")).toBeVisible();
    });
    test("sign-up page renders", async ({ page }) => {
        await page.goto("/sign-up");
        await expect(page.locator("body")).toBeVisible();
    });
});
