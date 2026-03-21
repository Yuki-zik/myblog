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

test("post detail uses minimal reading header without hero cover", async ({ page }) => {
  await page.goto("/posts/paragraph-anchor-design");

  const heroCover = page.locator('[data-post-cover="hero"]');
  await expect(heroCover).toHaveCount(0);
  await expect(page.locator(".post-header--scholarly h1")).toBeVisible();
});

test("desktop header search stays between brand and navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const brand = page.locator(".brand");
  const searchTrigger = page.locator("[data-search-trigger]");
  const navLinks = page.locator(".site-nav-links");

  await expect(brand).toBeVisible();
  await expect(searchTrigger).toBeVisible();
  await expect(navLinks).toBeVisible();

  const brandBox = await brand.boundingBox();
  const searchBox = await searchTrigger.boundingBox();
  const navBox = await navLinks.boundingBox();

  if (!brandBox || !searchBox || !navBox) {
    throw new Error("Expected brand, search trigger, and nav links to have layout boxes");
  }

  expect(searchBox.x).toBeGreaterThan(brandBox.x + brandBox.width + 8);
  expect(searchBox.x + searchBox.width).toBeLessThan(navBox.x - 8);
  expect(brandBox.x).toBeGreaterThan(60);
  expect(navBox.x + navBox.width).toBeLessThan(1380);
  expect(Math.abs(searchBox.x + searchBox.width / 2 - 720)).toBeLessThan(160);
});

test("reading progress bar updates aria value and visible fill on scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  const progressBar = page.locator("#reading-progress-bar");
  const progressFill = page.locator("[data-reading-progress-fill]");

  await expect(progressBar).toBeVisible();

  const initialValue = Number(await progressBar.getAttribute("aria-valuenow"));
  const initialWidth = await progressFill.evaluate((el) => Number.parseFloat(getComputedStyle(el).width));
  const initialMetrics = await progressBar.evaluate((el) => {
    const styles = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      top: Number.parseFloat(styles.top),
      left: Number.parseFloat(styles.left),
      width: Number.parseFloat(styles.width),
      rectTop: rect.top,
      rectBottom: rect.bottom
    };
  });

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight * 0.72);
  });
  await page.waitForTimeout(300);

  await expect(page.locator(".site-header")).toHaveClass(/is-scrolled/);
  await expect(page.locator(".site-header")).toHaveAttribute("data-header-state", "hidden");

  const nextValue = Number(await progressBar.getAttribute("aria-valuenow"));
  const nextWidth = await progressFill.evaluate((el) => Number.parseFloat(getComputedStyle(el).width));
  const progressMetrics = await progressBar.evaluate((el) => {
    const styles = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      top: Number.parseFloat(styles.top),
      left: Number.parseFloat(styles.left),
      width: Number.parseFloat(styles.width),
      height: Number.parseFloat(styles.height) || rect.height,
      rectTop: rect.top,
      rectBottom: rect.bottom,
      backgroundImage: styles.backgroundImage,
      opacity: styles.opacity
    };
  });

  expect(nextValue).toBeGreaterThan(initialValue);
  expect(nextWidth).toBeGreaterThan(initialWidth);
  expect(Math.abs(progressMetrics.top - initialMetrics.top)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(progressMetrics.left - initialMetrics.left)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(progressMetrics.width - initialMetrics.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(progressMetrics.rectTop - initialMetrics.rectTop)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(progressMetrics.rectBottom - initialMetrics.rectBottom)).toBeLessThanOrEqual(0.5);
  expect(progressMetrics.height).toBeGreaterThanOrEqual(3);
  expect(progressMetrics.opacity).toBe("1");
  expect(progressMetrics.backgroundImage).toContain("linear-gradient");
});

test("reading toc clearly separates h2 and h3 hierarchy on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  const tocRail = page.locator(".post-reading-toc-rail");
  const h2Link = tocRail.locator(".toc-sidebar__link--level-2").first();
  const h3Link = tocRail.locator(".toc-sidebar__link--level-3").first();

  await expect(tocRail).toBeVisible();
  await expect(h2Link).toBeVisible();
  await expect(h3Link).toBeVisible();

  const railWidth = await tocRail.evaluate((el) => el.getBoundingClientRect().width);
  const h2Metrics = await h2Link.evaluate((el) => {
    const titleEl = el.querySelector(".toc-sidebar__title") as HTMLElement | null;
    const targetEl = titleEl || el;
    const styles = getComputedStyle(targetEl);
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      textLeft: titleEl?.getBoundingClientRect().left ?? rect.left,
      fontSize: Number.parseFloat(styles.fontSize),
      fontWeight: Number.parseFloat(styles.fontWeight)
    };
  });
  const h3Metrics = await h3Link.evaluate((el) => {
    const titleEl = el.querySelector(".toc-sidebar__title") as HTMLElement | null;
    const targetEl = titleEl || el;
    const styles = getComputedStyle(targetEl);
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      textLeft: titleEl?.getBoundingClientRect().left ?? rect.left,
      fontSize: Number.parseFloat(styles.fontSize),
      fontWeight: Number.parseFloat(styles.fontWeight)
    };
  });

  expect(railWidth).toBeGreaterThan(150);
  expect(h2Metrics.fontSize).toBeGreaterThan(h3Metrics.fontSize);
  expect(h2Metrics.fontWeight).toBeGreaterThan(h3Metrics.fontWeight);
  expect(h3Metrics.textLeft - h2Metrics.textLeft).toBeGreaterThan(10);
});
