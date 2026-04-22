import { test, expect } from "@playwright/test";

test.describe("Clerk hosted routes", () => {
  test("sign-in page renders Clerk", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("body")).toBeVisible();
  });

  test("sign-up page renders Clerk", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.locator("body")).toBeVisible();
  });
});
