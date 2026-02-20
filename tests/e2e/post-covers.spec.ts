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

test("home latest posts renders card covers", async ({ page }) => {
  await page.goto("/");

  const latestPosts = page.locator("[data-latest-posts]");
  await expect(latestPosts).toBeVisible();

  const covers = latestPosts.locator('[data-post-cover="card"]');
  await expect(covers.first()).toBeVisible();
  expect(await covers.count()).toBeGreaterThan(0);
});

test("topic page related posts renders card covers", async ({ page }) => {
  await page.goto("/topics/knowledge-network");

  const topicPosts = page.locator("[data-topic-posts]");
  await expect(topicPosts).toBeVisible();

  const covers = topicPosts.locator('[data-post-cover="card"]');
  await expect(covers.first()).toBeVisible();
  expect(await covers.count()).toBeGreaterThan(0);
});

test("concept page related posts renders card covers", async ({ page }) => {
  await page.goto("/concepts/anchor-id");

  const conceptPosts = page.locator("[data-concept-posts]");
  await expect(conceptPosts).toBeVisible();

  const covers = conceptPosts.locator('[data-post-cover="card"]');
  await expect(covers.first()).toBeVisible();
  expect(await covers.count()).toBeGreaterThan(0);
});

test("post detail renders hero cover", async ({ page }) => {
  await page.goto("/posts/paragraph-anchor-design");

  const heroCover = page.locator('[data-post-cover="hero"]');
  await expect(heroCover).toBeVisible();
});
