import { test, expect } from "@playwright/test";

test.describe("Org meetings & super-admin prompts (unauthenticated)", () => {
  test("rendez-vous redirects away from dashboard when not signed in", async ({
    page,
  }) => {
    await page.goto("/company/rendez-vous");
    await expect(page).not.toHaveURL(/\/company\/rendez-vous$/);
  });

  test("super-admin prompts redirects when not signed in", async ({
    page,
  }) => {
    await page.goto("/admin/prompts");
    await expect(page).not.toHaveURL(/\/company\/super-admin\/prompts$/);
  });
});
