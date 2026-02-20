import { expect, test, type Page } from "@playwright/test";

async function mockSupabase(page: Page) {
  await page.route("https://example.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === "OPTIONS") {
      return route.fulfill({ status: 204 });
    }

    if (url.pathname.startsWith("/auth/v1/")) {
      const now = Math.floor(Date.now() / 1000);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-access-token",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: now + 3600,
          refresh_token: "mock-refresh-token",
          user: {
            id: "00000000-0000-0000-0000-000000000001",
            aud: "authenticated",
            role: "authenticated",
            app_metadata: { provider: "anonymous", providers: ["anonymous"] },
            user_metadata: { is_anonymous: true },
            created_at: new Date().toISOString()
          }
        })
      });
    }

    if (url.pathname === "/rest/v1/comments" && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([])
      });
    }

    if (url.pathname === "/rest/v1/comments" && method === "POST") {
      const payload = JSON.parse(request.postData() ?? "{}");
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ...payload,
          id: 1,
          created_at: new Date().toISOString()
        })
      });
    }

    return route.fulfill({ status: 404, body: "Not Found" });
  });
}

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
});

test("archives page renders timeline and cover cards", async ({ page }) => {
  await page.goto("/archives");

  await expect(page.locator("[data-archive-year]").first()).toBeVisible();
  await expect(page.locator("[data-archive-month]").first()).toBeVisible();
  await expect(page.locator("[data-archive-card]").first()).toBeVisible();
  await expect(page.locator("[data-archive-date]").first()).toHaveText(/\d{4}-\d{2}-\d{2}/);
  await expect(page.locator("[data-archive-author]").first()).toContainText("By");
});

test("archive card navigates to post detail", async ({ page }) => {
  await page.goto("/archives");

  await page.locator("[data-archive-card] a").first().click();
  await expect(page).toHaveURL(/\/posts\//);
});

test("header and homepage provide archive entry", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("[data-home-archive-entry]")).toBeVisible();
  await page.locator('header .site-nav a[href="/archives"]').click();
  await expect(page).toHaveURL("/archives");
});
