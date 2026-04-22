import { test, expect } from "@playwright/test";

test.describe("Org meetings & super-admin prompts (unauthenticated)", () => {
  test("rendez-vous redirects away from dashboard when not signed in", async ({
    page,
  }) => {
    await page.goto("/dashboard/rendez-vous");
    await expect(page).not.toHaveURL(/\/dashboard\/rendez-vous$/);
  });

  test("super-admin prompts redirects when not signed in", async ({
    page,
  }) => {
    await page.goto("/dashboard/super-admin/prompts");
    await expect(page).not.toHaveURL(/\/dashboard\/super-admin\/prompts$/);
  });
});
