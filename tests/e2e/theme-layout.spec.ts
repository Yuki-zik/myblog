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

test("post preview cards use the editorial cover-meta-title-summary-stats rhythm", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const firstCard = page.locator(".post-card").first();
  await expect(firstCard.locator(".post-cover--card")).toBeVisible();
  await expect(firstCard.locator(".post-card-meta-row")).toBeVisible();
  await expect(firstCard.locator('[data-meta-icon="calendar"]')).toBeVisible();
  await expect(firstCard.locator(".post-card-title")).toBeVisible();
  await expect(firstCard.locator(".post-card-summary")).toBeVisible();
  await expect(firstCard.locator(".post-card-stats-row")).toBeVisible();
  await expect(firstCard.locator('[data-meta-icon="clock"]')).toBeVisible();
  await expect(firstCard.locator(".post-card-topics")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const grid = document.querySelector(".post-card-grid") as HTMLElement | null;
    const card = document.querySelector(".post-card") as HTMLElement | null;
    const title = document.querySelector(".post-card-title") as HTMLElement | null;
    const meta = document.querySelector(".post-card-meta-row") as HTMLElement | null;
    const summary = document.querySelector(".post-card-summary") as HTMLElement | null;
    const stats = document.querySelector(".post-card-stats-row") as HTMLElement | null;
    const tags = document.querySelector(".post-card-topics") as HTMLElement | null;
    const endmark = document.querySelector(".post-card-endmark") as HTMLElement | null;
    const cover = document.querySelector(".post-card .post-cover--card") as HTMLElement | null;

    return {
      gridWidth: grid?.getBoundingClientRect().width ?? 0,
      cardWidth: card?.getBoundingClientRect().width ?? 0,
      metaTop: meta?.getBoundingClientRect().top ?? 0,
      titleTop: title?.getBoundingClientRect().top ?? 0,
      summaryTop: summary?.getBoundingClientRect().top ?? 0,
      statsTop: stats?.getBoundingClientRect().top ?? 0,
      tagsTop: tags?.getBoundingClientRect().top ?? 0,
      endmarkTop: endmark?.getBoundingClientRect().top ?? 0,
      titleFontSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      metaFontSize: meta ? Number.parseFloat(getComputedStyle(meta).fontSize) : 0,
      statsFontSize: stats ? Number.parseFloat(getComputedStyle(stats).fontSize) : 0,
      coverAspectRatio: cover ? getComputedStyle(cover).aspectRatio : ""
    };
  });

  expect(metrics.gridWidth).toBeGreaterThan(800);
  expect(metrics.cardWidth).toBeGreaterThan(800);
  expect(metrics.titleFontSize).toBeGreaterThan(metrics.metaFontSize);
  expect(metrics.titleFontSize).toBeGreaterThan(metrics.statsFontSize);
  expect(metrics.metaTop).toBeLessThan(metrics.titleTop);
  expect(metrics.titleTop).toBeLessThan(metrics.summaryTop);
  expect(metrics.summaryTop).toBeLessThan(metrics.statsTop);
  expect(metrics.statsTop).toBeLessThan(metrics.tagsTop);
  expect(metrics.tagsTop).toBeLessThan(metrics.endmarkTop);
  expect(metrics.coverAspectRatio).toBe("16 / 9");
});

test("topic pages keep post preview cards centered in a single-column editorial stack", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/topics/knowledge-network");

  const grid = page.locator("[data-topic-posts] .post-card-grid");
  const firstCard = grid.locator(".post-card").first();
  await expect(grid).toBeVisible();
  await expect(firstCard).toBeVisible();

  const metrics = await page.evaluate(() => {
    const gridEl = document.querySelector("[data-topic-posts] .post-card-grid") as HTMLElement | null;
    const cardEl = gridEl?.querySelector(".post-card") as HTMLElement | null;
    const gridStyle = gridEl ? getComputedStyle(gridEl) : null;
    const gridBox = gridEl?.getBoundingClientRect();
    const cardBox = cardEl?.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const leftGap = gridBox?.left ?? 0;
    const rightGap = gridBox ? viewportWidth - gridBox.right : 0;

    return {
      gridWidth: gridBox?.width ?? 0,
      cardWidth: cardBox?.width ?? 0,
      gridColumns: gridStyle?.gridTemplateColumns ?? "",
      leftGap,
      rightGap,
      viewportWidth
    };
  });

  expect(metrics.gridColumns.split(" ").length).toBe(1);
  expect(metrics.gridWidth).toBeGreaterThan(800);
  expect(metrics.cardWidth).toBeGreaterThan(800);
  expect(metrics.leftGap).toBeGreaterThan(120);
  expect(metrics.rightGap).toBeGreaterThan(120);
  expect(Math.abs(metrics.leftGap - metrics.rightGap)).toBeLessThan(10);
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

  await expect(page.locator("[data-toc-sidebar]")).toBeHidden();
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

test("article toc sidebar tracks active sections and keeps a progress rail", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  const sidebar = page.locator("[data-toc-sidebar]");
  await expect(sidebar).toBeVisible();
  await expect(sidebar.locator("[data-toc-link].is-active")).toContainText("锚点规则");

  const initialMetrics = await page.evaluate(() => {
    const progress = document.querySelector("[data-toc-progress]") as HTMLElement | null;
    return {
      progressHeight: progress?.getBoundingClientRect().height ?? 0,
      progressTransform: progress ? getComputedStyle(progress).transform : "none"
    };
  });

  await page.locator("h2", { hasText: "工程边界" }).evaluate((heading) => {
    heading.scrollIntoView({ behavior: "auto", block: "start" });
  });
  await page.waitForFunction(() => {
    const heading = Array.from(document.querySelectorAll("h2")).find((node) => node.textContent?.includes("工程边界"));
    if (!(heading instanceof HTMLElement)) {
      return false;
    }

    const top = heading.getBoundingClientRect().top;
    return top > 70 && top < 180;
  });
  await page.waitForFunction(() => {
    const active = document.querySelector("[data-toc-link].is-active");
    return active?.textContent?.includes("工程边界") ?? false;
  });

  const activeMetrics = await page.evaluate(() => {
    const active = document.querySelector("[data-toc-link].is-active") as HTMLElement | null;
    const progress = document.querySelector("[data-toc-progress]") as HTMLElement | null;
    return {
      activeText: active?.textContent ?? "",
      progressHeight: progress?.getBoundingClientRect().height ?? 0,
      progressTransform: progress ? getComputedStyle(progress).transform : "none"
    };
  });

  expect(activeMetrics.activeText).toContain("工程边界");
  expect(activeMetrics.progressHeight).toBeGreaterThanOrEqual(40);
  expect(activeMetrics.progressTransform).not.toBe(initialMetrics.progressTransform);

  await sidebar.locator("[data-toc-link]").filter({ hasText: "状态与回滚" }).click();
  await page.waitForFunction(() => {
    const active = document.querySelector("[data-toc-link].is-active");
    const heading = Array.from(document.querySelectorAll("h3")).find((node) => node.textContent?.includes("状态与回滚"));
    if (!(heading instanceof HTMLElement)) {
      return false;
    }

    const top = heading.getBoundingClientRect().top;
    return (active?.textContent?.includes("状态与回滚") ?? false) && top > 70 && top < 180;
  });

  const clickMetrics = await page.evaluate(() => {
    const active = document.querySelector("[data-toc-link].is-active") as HTMLElement | null;
    const heading = Array.from(document.querySelectorAll("h3")).find((node) => node.textContent?.includes("状态与回滚")) as HTMLElement | undefined;
    return {
      activeText: active?.textContent ?? "",
      top: heading?.getBoundingClientRect().top ?? 0
    };
  });

  expect(clickMetrics.activeText).toContain("状态与回滚");
  expect(clickMetrics.top).toBeGreaterThan(70);
  expect(clickMetrics.top).toBeLessThan(180);
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

  await expect(page.locator(".post-title-card")).toBeVisible();
  await expect(page.locator(".post-header--scholarly h1")).toBeVisible();
  await expect(page.locator('.post-title-card [data-meta-icon="calendar"]')).toBeVisible();
  await expect(page.locator('.post-title-card [data-meta-icon="clock"]')).toBeVisible();
  await expect(page.locator(".post-reading-toc-rail")).toBeVisible();
  await expect(page.locator(".post-cover--hero")).toBeVisible();
  await expect(page.locator(".post-header-stats-row")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const layout = document.querySelector(".post-reading-layout--tri") as HTMLElement | null;
    const body = document.querySelector(".post-body--scholarly") as HTMLElement | null;
    const firstParagraph = body?.querySelector("p[data-anchor]") as HTMLElement | null;
    const cover = document.querySelector(".post-cover--hero") as HTMLElement | null;
    const titleCard = document.querySelector(".post-title-card") as HTMLElement | null;
    const meta = document.querySelector(".post-title-card .post-header-meta") as HTMLElement | null;
    const title = document.querySelector(".post-title-card .post-header--scholarly h1") as HTMLElement | null;
    const dek = document.querySelector(".post-header-dek") as HTMLElement | null;
    const stats = document.querySelector(".post-header-stats-row") as HTMLElement | null;
    const topics = document.querySelector(".post-title-card .post-header-topics") as HTMLElement | null;
    const divider = document.querySelector(".post-title-card .post-header-divider") as HTMLElement | null;
    const tocRail = document.querySelector(".post-reading-toc-rail") as HTMLElement | null;
    const article = document.querySelector(".post-reading-article") as HTMLElement | null;
    const scholarRail = document.querySelector(".post-reading-rail") as HTMLElement | null;
    const titleGroup = document.querySelector(".post-header--scholarly") as HTMLElement | null;
    const firstH2 = body?.querySelector("h2") as HTMLElement | null;
    const firstH3 = body?.querySelector("h3") as HTMLElement | null;

    const layoutBandStyles = layout ? getComputedStyle(layout, "::after") : null;
    const bodyStyles = body ? getComputedStyle(body) : null;
    const titleCardStyles = titleCard ? getComputedStyle(titleCard) : null;
    const metaStyles = meta ? getComputedStyle(meta) : null;
    const titleStyles = title ? getComputedStyle(title) : null;
    const dekStyles = dek ? getComputedStyle(dek) : null;
    const statsStyles = stats ? getComputedStyle(stats) : null;
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
      titleCardWidth: titleCard?.getBoundingClientRect().width ?? 0,
      titleCardRadius: titleCardStyles ? Number.parseFloat(titleCardStyles.borderTopLeftRadius) : 0,
      titleCardShadow: titleCardStyles?.boxShadow ?? "",
      titleCardBackgroundImage: titleCardStyles?.backgroundImage ?? "",
      coverRadius: coverStyles ? Number.parseFloat(coverStyles.borderTopLeftRadius) : 0,
      coverTop: cover?.getBoundingClientRect().top ?? 0,
      metaTop: meta?.getBoundingClientRect().top ?? 0,
      titleTop: title?.getBoundingClientRect().top ?? 0,
      dekTop: dek?.getBoundingClientRect().top ?? 0,
      statsTop: stats?.getBoundingClientRect().top ?? 0,
      topicsTop: topics?.getBoundingClientRect().top ?? 0,
      dividerTop: divider?.getBoundingClientRect().top ?? 0,
      dividerWidth: divider?.getBoundingClientRect().width ?? 0,
      metaFontSize: metaStyles ? Number.parseFloat(metaStyles.fontSize) : 0,
      titleFontSize: titleStyles ? Number.parseFloat(titleStyles.fontSize) : 0,
      dekFontStyle: dekStyles?.fontStyle ?? "",
      statsFontSize: statsStyles ? Number.parseFloat(statsStyles.fontSize) : 0,
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
  expect(metrics.titleCardWidth).toBeGreaterThan(640);
  expect(metrics.titleCardRadius).toBeGreaterThanOrEqual(24);
  expect(metrics.titleCardShadow).not.toBe("none");
  expect(metrics.titleCardBackgroundImage).toContain("gradient");
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
  expect(metrics.coverTop).toBeLessThan(metrics.metaTop);
  expect(metrics.metaTop).toBeLessThan(metrics.titleTop);
  expect(metrics.titleTop).toBeLessThan(metrics.dekTop);
  expect(metrics.dekTop).toBeLessThan(metrics.statsTop);
  expect(metrics.statsTop).toBeLessThan(metrics.topicsTop);
  expect(metrics.topicsTop).toBeLessThan(metrics.dividerTop);
  expect(metrics.titleFontSize).toBeGreaterThan(metrics.metaFontSize);
  expect(metrics.titleFontSize).toBeGreaterThan(metrics.statsFontSize);
  expect(metrics.dividerWidth).toBeGreaterThan(70);
  expect(metrics.dividerWidth).toBeLessThan(160);
  expect(metrics.firstH2Counter).not.toBe("none");
  expect(metrics.firstH2Counter).toContain("SECTION");
  expect(metrics.firstH2CounterColor).not.toBe("rgb(47, 52, 64)");
  expect(metrics.firstH2CounterFontSize).toBeGreaterThanOrEqual(13);
  expect(metrics.firstH2PaddingLeft).toBeLessThanOrEqual(2);
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

test("article layout expands on ultra-wide screens without oversized gutters", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto("/posts/paragraph-anchor-design");

  const metrics = await page.evaluate(() => {
    const shell = document.querySelector(".shell--article-reading") as HTMLElement | null;
    const layout = document.querySelector(".post-reading-layout--tri") as HTMLElement | null;
    const titleCard = document.querySelector(".post-title-card") as HTMLElement | null;
    const firstParagraph = document.querySelector(".post-body--scholarly > p") as HTMLElement | null;

    return {
      viewportWidth: window.innerWidth,
      shellWidth: shell?.getBoundingClientRect().width ?? 0,
      shellLeft: shell?.getBoundingClientRect().left ?? 0,
      layoutWidth: layout?.getBoundingClientRect().width ?? 0,
      titleWidth: titleCard?.getBoundingClientRect().width ?? 0,
      bodyWidth: firstParagraph?.getBoundingClientRect().width ?? 0
    };
  });

  expect(metrics.shellWidth).toBeGreaterThanOrEqual(2200);
  expect(metrics.shellLeft).toBeLessThanOrEqual(180);
  expect(metrics.layoutWidth).toBeGreaterThanOrEqual(2200);
  expect(metrics.titleWidth).toBeGreaterThanOrEqual(780);
  expect(metrics.bodyWidth).toBeGreaterThanOrEqual(780);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(860);
});
