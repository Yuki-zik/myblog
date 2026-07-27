import { expect, test, type Page } from "@playwright/test";
import { waitForScrollSettled } from "./helpers/page-state";

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

test("home featured publication renders the same-source ghost cover stack", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const featuredPost = page.locator("[data-home-featured-post]");
  await expect(featuredPost).toBeVisible();
  await expect(featuredPost.locator(".home-featured-cover-image--main")).toBeVisible();
  await expect(featuredPost.locator(".home-featured-cover-image--ghost")).toHaveCount(1);

  const collectMetrics = () =>
    page.evaluate(() => {
      const stack = document.querySelector("[data-home-featured-cover]") as HTMLElement | null;
      const main = document.querySelector(".home-featured-cover-image--main") as HTMLElement | null;
      const ghost = document.querySelector(".home-featured-cover-image--ghost") as HTMLElement | null;
      const stackStyles = stack ? getComputedStyle(stack) : null;
      const mainStyles = main ? getComputedStyle(main) : null;
      const ghostStyles = ghost ? getComputedStyle(ghost) : null;
      const mainBox = main?.getBoundingClientRect();
      const ghostBox = ghost?.getBoundingClientRect();

      return {
        stackAspectRatio: stackStyles?.aspectRatio ?? "",
        mainBorderWidth: mainStyles ? Number.parseFloat(mainStyles.borderTopWidth) : 0,
        mainShadow: mainStyles?.boxShadow ?? "",
        ghostFilter: ghostStyles?.filter ?? "",
        ghostBlurPx: ghostStyles?.filter
          ? Number.parseFloat(ghostStyles.filter.match(/blur\(([\d.]+)px\)/)?.[1] ?? "0")
          : 0,
        ghostOpacity: ghostStyles ? Number.parseFloat(ghostStyles.opacity) : 0,
        ghostPosition: ghostStyles?.position ?? "",
        ghostOffsetY: mainBox && ghostBox ? ghostBox.top - mainBox.top : 0,
        ghostWidth: ghostBox?.width ?? 0,
        mainWidth: mainBox?.width ?? 0,
        ghostSpread: mainBox && ghostBox ? mainBox.width - ghostBox.width : 0,
        mainTop: mainBox?.top ?? 0
      };
    });

  const initialMetrics = await collectMetrics();

  expect(initialMetrics.stackAspectRatio).toBe("4 / 3");
  expect(initialMetrics.mainBorderWidth).toBeGreaterThanOrEqual(1);
  expect(initialMetrics.mainShadow).not.toBe("none");
  expect(initialMetrics.ghostFilter).toContain("blur");
  expect(initialMetrics.ghostBlurPx).toBeGreaterThanOrEqual(38);
  expect(initialMetrics.ghostOpacity).toBeGreaterThan(0.45);
  expect(initialMetrics.ghostOpacity).toBeLessThan(0.85);
  expect(initialMetrics.ghostPosition).toBe("absolute");
  expect(initialMetrics.ghostOffsetY).toBeGreaterThan(12);
  expect(initialMetrics.ghostSpread).toBeGreaterThan(initialMetrics.mainWidth * 0.04);

  await featuredPost.locator(".home-reference-featured-card").hover();

  // Poll for the hover transition to settle. Under parallel load the CSS
  // transition can take longer than a fixed timeout, so wait until the ghost
  // opacity has actually advanced past the threshold instead of relying on a
  // brittle waitForTimeout.
  await expect
    .poll(
      async () => {
        const m = await collectMetrics();
        return m.ghostOpacity;
      },
      { timeout: 4000 }
    )
    .toBeGreaterThan(initialMetrics.ghostOpacity + 0.08);

  const hoverMetrics = await collectMetrics();

  expect(hoverMetrics.mainTop).toBeLessThan(initialMetrics.mainTop - 2);
  expect(hoverMetrics.ghostOpacity).toBeGreaterThan(initialMetrics.ghostOpacity + 0.08);
  expect(hoverMetrics.ghostOffsetY).toBeGreaterThan(initialMetrics.ghostOffsetY + 4);
  expect(hoverMetrics.ghostBlurPx).toBeGreaterThanOrEqual(38);
  expect(hoverMetrics.ghostSpread).toBeGreaterThan(hoverMetrics.mainWidth * 0.04);
  expect(Math.abs(hoverMetrics.ghostWidth - initialMetrics.ghostWidth)).toBeLessThan(1.5);
});

test("topic page related posts renders card covers", async ({ page }) => {
  await page.goto("/topics/knowledge-network");

  const topicPosts = page.locator("[data-topic-posts]");
  await expect(topicPosts).toBeVisible();

  const covers = topicPosts.locator('[data-post-cover="card"]');
  await expect(covers.first()).toBeVisible();
  expect(await covers.count()).toBeGreaterThan(0);

  const manualCover = topicPosts.locator('[data-post-cover="card"][data-post-cover-manual="true"]').first();
  await expect(manualCover.locator(".post-cover-img--main")).toBeVisible();
  await expect(manualCover.locator(".post-cover-img--ghost")).toHaveCount(1);
});

test("concept page related posts renders card covers", async ({ page }) => {
  await page.goto("/concepts/anchor-id");

  const conceptPosts = page.locator("[data-concept-posts]");
  await expect(conceptPosts).toBeVisible();

  const covers = conceptPosts.locator('[data-post-cover="card"]');
  await expect(covers.first()).toBeVisible();
  expect(await covers.count()).toBeGreaterThan(0);

  const manualCover = conceptPosts.locator('[data-post-cover="card"][data-post-cover-manual="true"]').first();
  await expect(manualCover.locator(".post-cover-img--main")).toBeVisible();
  await expect(manualCover.locator(".post-cover-img--ghost")).toHaveCount(1);
});

test("archive tiles reuse the shared manual cover stack", async ({ page }) => {
  await page.goto("/archives");

  const archiveManualCover = page.locator('[data-post-cover="archive-square"][data-post-cover-manual="true"]').first();
  await expect(archiveManualCover).toBeVisible();
  await expect(archiveManualCover.locator(".post-cover-img--main")).toBeVisible();
  await expect(archiveManualCover.locator(".post-cover-img--ghost")).toHaveCount(1);
});

test("author page published posts reuse the shared post card cover stack", async ({ page }) => {
  await page.goto("/author");

  const authorCard = page.locator(".author-post-grid .post-card").first();
  await expect(authorCard).toBeVisible();

  const manualCover = page.locator('.author-post-grid [data-post-cover="card"][data-post-cover-manual="true"]').first();
  await expect(manualCover).toBeVisible();
  await expect(manualCover.locator(".post-cover-img--main")).toBeVisible();
  await expect(manualCover.locator(".post-cover-img--ghost")).toHaveCount(1);
});

test("post detail uses minimal reading header without hero cover", async ({ page }) => {
  await page.goto("/posts/paragraph-anchor-design");

  const heroCover = page.locator('[data-post-cover="hero"]');
  await expect(heroCover).toHaveCount(0);
  await expect(page.locator(".post-header--scholarly h1")).toBeVisible();
});

test("post detail title cover renders a subtle ghost image for floating depth", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  const heroCover = page.locator(".post-title-card .post-cover--hero");
  await expect(heroCover).toBeVisible();
  await expect(page.locator(".post-title-card .post-cover-img--main")).toBeVisible();
  await expect(page.locator(".post-title-card .post-cover-img--ghost")).toHaveCount(1);

  const collectMetrics = () =>
    page.evaluate(() => {
      const hero = document.querySelector(".post-title-card .post-cover--hero") as HTMLElement | null;
      const main = document.querySelector(".post-title-card .post-cover-img--main") as HTMLElement | null;
      const ghost = document.querySelector(".post-title-card .post-cover-img--ghost") as HTMLElement | null;
      const heroStyles = hero ? getComputedStyle(hero) : null;
      const mainStyles = main ? getComputedStyle(main) : null;
      const ghostStyles = ghost ? getComputedStyle(ghost) : null;
      const mainBox = main?.getBoundingClientRect();
      const ghostBox = ghost?.getBoundingClientRect();

      return {
        heroShadow: heroStyles?.boxShadow ?? "",
        mainFilter: mainStyles?.filter ?? "",
        mainShadow: mainStyles?.boxShadow ?? "",
        mainBorderWidth: mainStyles ? Number.parseFloat(mainStyles.borderTopWidth) : 0,
        ghostFilter: ghostStyles?.filter ?? "",
        ghostOpacity: ghostStyles ? Number.parseFloat(ghostStyles.opacity) : 0,
        ghostPosition: ghostStyles?.position ?? "",
        ghostTransform: ghostStyles?.transform ?? "",
        ghostCount: document.querySelectorAll(".post-title-card .post-cover-img--ghost").length,
        ghostOffsetY: mainBox && ghostBox ? ghostBox.top - mainBox.top : 0,
        ghostWidth: ghostBox?.width ?? 0,
        mainWidth: mainBox?.width ?? 0,
        mainTop: mainBox?.top ?? 0,
        mainOpacity: mainStyles ? Number.parseFloat(mainStyles.opacity) : 0
      };
    });

  const initialMetrics = await collectMetrics();

  expect(initialMetrics.heroShadow).toBe("none");
  expect(initialMetrics.mainFilter).not.toContain("drop-shadow");
  expect(initialMetrics.mainShadow).not.toBe("none");
  expect(initialMetrics.mainBorderWidth).toBeGreaterThanOrEqual(1);
  expect(initialMetrics.ghostFilter).toContain("blur");
  expect(initialMetrics.ghostOpacity).toBeGreaterThan(0.52);
  expect(initialMetrics.ghostOpacity).toBeLessThan(0.88);
  expect(initialMetrics.ghostPosition).toBe("absolute");
  expect(initialMetrics.ghostTransform).not.toBe("none");
  expect(initialMetrics.ghostCount).toBe(1);
  expect(initialMetrics.ghostOffsetY).toBeGreaterThan(24);
  expect(initialMetrics.ghostOffsetY).toBeLessThan(56);
  expect(initialMetrics.ghostWidth).toBeLessThan(initialMetrics.mainWidth);
  expect(initialMetrics.mainOpacity).toBeGreaterThan(0.75);
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

  await expect(progressBar).toBeVisible();

  const initialValue = Number(await progressBar.getAttribute("aria-valuenow"));
  const initialFillState = await progressBar.evaluate((el) => {
    const fill = el.querySelector("[data-reading-progress-fill]") as HTMLElement | null;
    const styles = fill ? getComputedStyle(fill) : null;
    return {
      cssProgress: (el as HTMLElement).style.getPropertyValue("--progress"),
      fillWidth: fill?.style.width ?? "",
      fillOpacity: styles?.opacity ?? ""
    };
  });
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

  /*
   * Scroll to a known fraction of the page, wait for it to land, and wait for
   * the bar to catch up.
   *
   * Two separate races had to be closed here. The site opts into
   * `scroll-behavior: smooth`, so this scroll animates: traced under load, the
   * viewport was still at 0 of a 3669px target 300ms after the call and had
   * only reached 214px at 500ms, so the previous fixed wait contributed nothing
   * and the header assertions were carried entirely by Playwright's auto-retry.
   * Separately, the bar is written from a rAF-throttled scroll handler, so even
   * once the scroll itself is settled the attribute can still be a frame or
   * more behind — a one-shot read then samples a stale value, which is how the
   * "progress increased" check could see 0.
   */
  const readProgress = async () => Number(await progressBar.getAttribute("aria-valuenow"));

  const scrollToFraction = async (fraction: number, previousValue: number) => {
    await page.evaluate((value) => {
      window.scrollTo(0, document.body.scrollHeight * value);
    }, fraction);
    await waitForScrollSettled(page);
    // Let the rAF-scheduled handler publish the value for this position.
    await expect.poll(readProgress, { timeout: 10_000 }).toBeGreaterThan(previousValue);
    return readProgress();
  };

  // An intermediate sample, so the test can assert the value actually tracks
  // the scroll rather than merely being non-zero at the end.
  const quarterValue = await scrollToFraction(0.25, initialValue);

  const nextValue = await scrollToFraction(0.72, quarterValue);

  await expect(page.locator(".site-header")).toHaveClass(/is-scrolled/);
  await expect(page.locator(".site-header")).toHaveAttribute("data-header-state", "hidden");

  const nextFillState = await progressBar.evaluate((el) => {
    const fill = el.querySelector("[data-reading-progress-fill]") as HTMLElement | null;
    const styles = fill ? getComputedStyle(fill) : null;
    return {
      cssProgress: (el as HTMLElement).style.getPropertyValue("--progress"),
      fillWidth: fill?.style.width ?? "",
      fillOpacity: styles?.opacity ?? ""
    };
  });
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

  /*
   * Progress must track the scroll, not merely be non-zero.
   *
   * Measured on this article the bar reads 0 / 34 / 100 at 0% / 25% / 72% of
   * the page: it is scaled to the article element and saturates once the
   * article ends, which is before the document does. Bounding the quarter-way
   * sample on both sides is what makes this meaningful — a stale read pins it
   * near 0 and a mis-scaled bar saturates it immediately, and only a two-sided
   * band rejects both. The end value is then required to be well advanced.
   */
  expect(quarterValue, "a quarter down the page the bar should be clearly under way").toBeGreaterThanOrEqual(15);
  expect(quarterValue, "a quarter down the page the bar should not already be finished").toBeLessThanOrEqual(85);
  expect(nextValue).toBeGreaterThan(quarterValue);
  expect(nextValue, "by 72% of the page the reader is past the end of the article body").toBeGreaterThanOrEqual(50);
  expect(nextFillState.cssProgress).not.toBe(initialFillState.cssProgress);
  expect(nextFillState.fillWidth).not.toBe(initialFillState.fillWidth);
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
