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

test("home hero and header stay structured on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await expect(page.locator(".home-hero")).toBeVisible();
  await expect(page.locator(".home-hero-title")).toBeVisible();
  await expect(page.locator(".home-hero-actions a")).toHaveCount(2);

  const metrics = await page.evaluate(() => {
    const brand = document.querySelector(".brand") as HTMLElement | null;
    const search = document.querySelector("[data-search-trigger]") as HTMLElement | null;
    const nav = document.querySelector(".site-nav-links") as HTMLElement | null;

    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      brandBox: brand?.getBoundingClientRect() ?? null,
      searchBox: search?.getBoundingClientRect() ?? null,
      navBox: nav?.getBoundingClientRect() ?? null
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.brandBox).not.toBeNull();
  expect(metrics.searchBox).not.toBeNull();
  expect(metrics.navBox).not.toBeNull();
  expect(metrics.searchBox!.x).toBeGreaterThan(metrics.brandBox!.x + metrics.brandBox!.width);
  expect(metrics.searchBox!.x + metrics.searchBox!.width).toBeLessThan(metrics.navBox!.x);
});

test("archives page stays readable without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/archives");

  await expect(page.locator(".archives-hero")).toBeVisible();
  await expect(page.locator(".archive-grid")).toBeVisible();

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
});

test("post page collapses to a single mobile column and shows follow-up navigation", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/posts/paragraph-anchor-design");

  await expect(page.locator(".post-reading-toc-summary")).toBeVisible();
  await expect(page.locator(".post-reading-article")).toBeVisible();
  await expect(page.locator(".post-pager")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const layout = document.querySelector(".post-reading-layout--tri") as HTMLElement | null;
    const rail = document.querySelector(".post-reading-rail") as HTMLElement | null;
    const article = document.querySelector(".post-reading-article") as HTMLElement | null;
    const layoutStyles = layout ? getComputedStyle(layout) : null;

    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      gridColumns: layoutStyles?.gridTemplateColumns ?? "",
      articleWidth: article?.getBoundingClientRect().width ?? 0,
      railWidth: rail?.getBoundingClientRect().width ?? 0
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.gridColumns.split(" ").length).toBe(1);
  expect(metrics.articleWidth).toBeGreaterThan(300);
  expect(metrics.railWidth).toBeGreaterThan(300);
});
