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
    const tocRail = document.querySelector(".post-reading-toc-rail") as HTMLElement | null;
    const article = document.querySelector(".post-reading-article") as HTMLElement | null;
    const layoutStyles = layout ? getComputedStyle(layout) : null;

    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      gridColumns: layoutStyles?.gridTemplateColumns ?? "",
      articleWidth: article?.getBoundingClientRect().width ?? 0,
      railWidth: rail?.getBoundingClientRect().width ?? 0,
      tocTop: tocRail?.getBoundingClientRect().top ?? 0,
      articleTop: article?.getBoundingClientRect().top ?? 0,
      railTop: rail?.getBoundingClientRect().top ?? 0
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.gridColumns.split(" ").length).toBe(1);
  expect(metrics.articleWidth).toBeGreaterThan(300);
  expect(metrics.railWidth).toBeGreaterThan(300);
  expect(metrics.articleTop).toBeGreaterThan(metrics.tocTop);
  expect(metrics.railTop).toBeGreaterThan(metrics.articleTop);
});

test("article header transitions through top, compact, hidden, and restores on upward scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  const header = page.locator(".site-header");
  await expect(header).toHaveAttribute("data-header-state", "top");

  await page.evaluate(() => {
    window.scrollTo(0, 96);
  });
  await page.waitForTimeout(250);
  await expect(header).toHaveAttribute("data-header-state", "compact");

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight * 0.68);
  });
  await page.waitForTimeout(320);
  await expect(header).toHaveAttribute("data-header-state", "hidden");

  await page.evaluate(() => {
    window.scrollBy(0, -280);
  });
  await page.waitForTimeout(260);
  await expect(header).toHaveAttribute("data-header-state", "compact");

  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(260);
  await expect(header).toHaveAttribute("data-header-state", "top");
});

test("article reading layout keeps restrained desktop proportions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.addInitScript(() => {
    localStorage.setItem("theme", "light");
  });
  await page.goto("/posts/paragraph-anchor-design");

  await expect(page.locator(".post-header--scholarly h1")).toBeVisible();
  await expect(page.locator(".post-reading-toc-rail")).toBeVisible();
  await expect(page.locator(".post-cover--hero")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const layout = document.querySelector(".post-reading-layout--tri") as HTMLElement | null;
    const body = document.querySelector(".post-body--scholarly") as HTMLElement | null;
    const firstParagraph = body?.querySelector("p[data-anchor]") as HTMLElement | null;
    const cover = document.querySelector(".post-cover--hero") as HTMLElement | null;
    const dek = document.querySelector(".post-header-dek") as HTMLElement | null;
    const tocRail = document.querySelector(".post-reading-toc-rail") as HTMLElement | null;
    const article = document.querySelector(".post-reading-article") as HTMLElement | null;
    const scholarRail = document.querySelector(".post-reading-rail") as HTMLElement | null;
    const titleGroup = document.querySelector(".post-header--scholarly") as HTMLElement | null;
    const firstH2 = body?.querySelector("h2") as HTMLElement | null;
    const firstH3 = body?.querySelector("h3") as HTMLElement | null;

    const layoutBandStyles = layout ? getComputedStyle(layout, "::after") : null;
    const bodyStyles = body ? getComputedStyle(body) : null;
    const dekStyles = dek ? getComputedStyle(dek) : null;
    const coverStyles = cover ? getComputedStyle(cover) : null;
    const tocStyles = tocRail ? getComputedStyle(tocRail) : null;
    const articleStyles = article ? getComputedStyle(article) : null;
    const scholarRailStyles = scholarRail ? getComputedStyle(scholarRail) : null;
    const h2BeforeStyles = firstH2 ? getComputedStyle(firstH2, "::before") : null;
    const h3BeforeStyles = firstH3 ? getComputedStyle(firstH3, "::before") : null;

    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      bodyFontSize: bodyStyles ? Number.parseFloat(bodyStyles.fontSize) : 0,
      bodyLineHeight: bodyStyles ? Number.parseFloat(bodyStyles.lineHeight) : 0,
      firstParagraphWidth: firstParagraph?.getBoundingClientRect().width ?? 0,
      coverRadius: coverStyles ? Number.parseFloat(coverStyles.borderTopLeftRadius) : 0,
      dekFontStyle: dekStyles?.fontStyle ?? "",
      tocOpacity: tocStyles ? Number.parseFloat(tocStyles.opacity) : 0,
      articleRadius: articleStyles ? Number.parseFloat(articleStyles.borderTopLeftRadius) : 0,
      articleShadow: articleStyles?.boxShadow ?? "",
      articleBackgroundImage: articleStyles?.backgroundImage ?? "",
      articleBackgroundColor: articleStyles?.backgroundColor ?? "",
      paperBandBackgroundImage: layoutBandStyles?.backgroundImage ?? "",
      paperBandShadow: layoutBandStyles?.boxShadow ?? "",
      paperBandRadius: layoutBandStyles ? Number.parseFloat(layoutBandStyles.borderTopLeftRadius) : 0,
      scholarRailPaddingLeft: scholarRailStyles ? Number.parseFloat(scholarRailStyles.paddingLeft) : 0,
      firstH2Counter: h2BeforeStyles?.content ?? "",
      firstH2CounterColor: h2BeforeStyles?.color ?? "",
      firstH2CounterFontFamily: h2BeforeStyles?.fontFamily ?? "",
      firstH2CounterFontSize: h2BeforeStyles ? Number.parseFloat(h2BeforeStyles.fontSize) : 0,
      firstH2PaddingLeft: firstH2 ? Number.parseFloat(getComputedStyle(firstH2).paddingLeft) : 0,
      firstH3Counter: h3BeforeStyles?.content ?? "",
      firstH3CounterFontFamily: h3BeforeStyles?.fontFamily ?? "",
      firstH3CounterFontSize: h3BeforeStyles ? Number.parseFloat(h3BeforeStyles.fontSize) : 0,
      firstH3PaddingLeft: firstH3 ? Number.parseFloat(getComputedStyle(firstH3).paddingLeft) : 0,
      titleToBodyGap:
        body && titleGroup
          ? body.getBoundingClientRect().top - titleGroup.getBoundingClientRect().bottom
          : 0
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.bodyFontSize).toBeGreaterThanOrEqual(18);
  expect(metrics.bodyFontSize).toBeLessThanOrEqual(19.5);
  expect(metrics.bodyLineHeight / metrics.bodyFontSize).toBeGreaterThan(1.8);
  expect(metrics.bodyLineHeight / metrics.bodyFontSize).toBeLessThan(1.92);
  expect(metrics.firstParagraphWidth).toBeGreaterThan(640);
  expect(metrics.firstParagraphWidth).toBeLessThan(740);
  expect(metrics.paperBandRadius).toBeGreaterThanOrEqual(20);
  expect(metrics.paperBandShadow).not.toBe("none");
  expect(metrics.paperBandBackgroundImage).toContain("gradient");
  expect(metrics.articleRadius).toBe(0);
  expect(metrics.articleShadow).toBe("none");
  expect(metrics.articleBackgroundImage).toBe("none");
  expect(metrics.articleBackgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(metrics.scholarRailPaddingLeft).toBeLessThanOrEqual(4);
  expect(metrics.firstH2Counter).not.toBe("none");
  expect(metrics.firstH2CounterColor).not.toBe("rgb(47, 52, 64)");
  expect(metrics.firstH2CounterFontFamily).toContain("Source Serif");
  expect(metrics.firstH2CounterFontSize).toBeGreaterThanOrEqual(20);
  expect(metrics.firstH2PaddingLeft).toBeGreaterThanOrEqual(48);
  expect(metrics.firstH3Counter).not.toBe("none");
  expect(metrics.firstH3CounterFontFamily).toContain("Source Serif");
  expect(metrics.firstH3CounterFontSize).toBeGreaterThanOrEqual(16);
  expect(metrics.firstH3PaddingLeft).toBeGreaterThanOrEqual(36);
  expect(metrics.titleToBodyGap).toBeGreaterThan(50);
  expect(metrics.coverRadius).toBeLessThanOrEqual(12.5);
  expect(metrics.dekFontStyle).toBe("normal");
  expect(metrics.tocOpacity).toBeGreaterThan(0.8);
  expect(metrics.tocOpacity).toBeLessThanOrEqual(1);
});
