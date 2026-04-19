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

async function mockSubstats(page: Page) {
  await page.route("https://api.swo.moe/stats/**", async (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/^\/stats\/([^/]+)\/([^/]+)$/);

    if (!match) {
      return route.fulfill({ status: 404, body: "Not Found" });
    }

    const [, source, key] = match;

    if (source === "telegram" && key === "A_Znkv") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          source,
          key,
          failed: false,
          count: 6
        })
      });
    }

    if (source === "github" && key === "yuki-zik") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          source,
          key,
          failed: false,
          count: 0
        })
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        source,
        key,
        failed: true
      })
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await mockSubstats(page);
});

test("home reference hero and header stay structured on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await expect(page.locator(".home-reference-hero__title")).toBeVisible();
  await expect(page.locator(".home-reference-hero__actions a")).toHaveCount(2);
  await expect(page.locator("[data-home-reference-terminal]")).toBeVisible();
  expect(await page.locator("[data-home-domains] [data-home-domain-card]").count()).toBeGreaterThan(4);
  await expect(page.locator("[data-home-reference-footer]")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const brand = document.querySelector(".brand") as HTMLElement | null;
    const search = document.querySelector("[data-search-trigger]") as HTMLElement | null;
    const nav = document.querySelector(".site-nav-links") as HTMLElement | null;
    const heroCopy = document.querySelector(".home-reference-hero__copy") as HTMLElement | null;
    const terminal = document.querySelector(".home-reference-terminal-wrap") as HTMLElement | null;
    const domainCards = Array.from(document.querySelectorAll("[data-home-domain-card]")) as HTMLElement[];

    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      brandBox: brand?.getBoundingClientRect() ?? null,
      searchBox: search?.getBoundingClientRect() ?? null,
      navBox: nav?.getBoundingClientRect() ?? null,
      heroCopyBox: heroCopy?.getBoundingClientRect() ?? null,
      terminalBox: terminal?.getBoundingClientRect() ?? null,
      terminalPosition: terminal ? getComputedStyle(terminal).position : "",
      domainTops: domainCards.map((card) => card.getBoundingClientRect().top)
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.brandBox).not.toBeNull();
  expect(metrics.searchBox).not.toBeNull();
  expect(metrics.navBox).not.toBeNull();
  expect(metrics.heroCopyBox).not.toBeNull();
  expect(metrics.terminalBox).not.toBeNull();
  expect(metrics.searchBox!.x).toBeGreaterThan(metrics.brandBox!.x + metrics.brandBox!.width);
  expect(metrics.searchBox!.x + metrics.searchBox!.width).toBeLessThan(metrics.navBox!.x);
  expect(metrics.terminalPosition).toBe("sticky");
  expect(metrics.terminalBox!.x).toBeGreaterThan(metrics.heroCopyBox!.x + metrics.heroCopyBox!.width * 0.72);
  expect(Math.abs(metrics.terminalBox!.y - metrics.heroCopyBox!.y)).toBeLessThan(80);
  expect(Math.max(...metrics.domainTops) - Math.min(...metrics.domainTops)).toBeLessThan(12);
});

test("home recent notes keep the reference list rhythm and hover arrow interaction", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const firstItem = page.locator("[data-home-recent-item]").first();
  await expect(firstItem.locator(".home-reference-recent-item__date")).toBeVisible();
  await expect(firstItem.locator(".home-reference-recent-item__tag")).toBeVisible();
  await expect(firstItem.locator(".home-reference-recent-item__title")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const item = document.querySelector("[data-home-recent-item]") as HTMLElement | null;
    const meta = document.querySelector(".home-reference-recent-item__meta") as HTMLElement | null;
    const title = document.querySelector(".home-reference-recent-item__title") as HTMLElement | null;
    const arrow = document.querySelector(".home-reference-recent-item__arrow") as HTMLElement | null;
    const tag = document.querySelector(".home-reference-recent-item__tag") as HTMLElement | null;

    return {
      itemWidth: item?.getBoundingClientRect().width ?? 0,
      metaWidth: meta?.getBoundingClientRect().width ?? 0,
      metaLeft: meta?.getBoundingClientRect().left ?? 0,
      titleLeft: title?.getBoundingClientRect().left ?? 0,
      titleTop: title?.getBoundingClientRect().top ?? 0,
      metaTop: meta?.getBoundingClientRect().top ?? 0,
      arrowOpacity: arrow ? Number.parseFloat(getComputedStyle(arrow).opacity) : 0,
      arrowTransform: arrow ? getComputedStyle(arrow).transform : "",
      tagBackground: tag ? getComputedStyle(tag).backgroundColor : ""
    };
  });

  expect(metrics.itemWidth).toBeGreaterThan(700);
  expect(metrics.metaWidth).toBeGreaterThan(180);
  expect(metrics.titleLeft).toBeGreaterThan(metrics.metaLeft + metrics.metaWidth - 12);
  expect(Math.abs(metrics.metaTop - metrics.titleTop)).toBeLessThan(24);
  expect(metrics.arrowOpacity).toBe(0);
  expect(metrics.arrowTransform).not.toBe("none");
  expect(metrics.tagBackground).not.toBe("rgba(0, 0, 0, 0)");

  await firstItem.hover();
  await page.waitForTimeout(320);

  const hoverArrowOpacity = await firstItem
    .locator(".home-reference-recent-item__arrow")
    .evaluate((node) => Number.parseFloat(getComputedStyle(node).opacity));

  expect(hoverArrowOpacity).toBeGreaterThan(0.7);
});

test("post pages use the article summary for both dek and meta description", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/ant-ai-coding-review");

  const expectedSummary = "记录一次蚂蚁 AI Coding 笔试中的准备过程、现场执行情况、踩坑点与时间线复盘。";
  await expect(page.locator(".post-header-dek")).toHaveText(expectedSummary);

  const metaDescription = await page.locator('meta[name="description"]').getAttribute("content");
  const ogDescription = await page.locator('meta[property="og:description"]').getAttribute("content");
  const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute("content");

  expect(metaDescription).toBe(expectedSummary);
  expect(ogDescription).toBe(expectedSummary);
  expect(twitterDescription).toBe(expectedSummary);
});

test("post pages emit article metadata when SITE_URL is configured", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
    "content",
    "2026-02-20T11:00:00+08:00"
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://myblog.example/posts/paragraph-anchor-design"
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://myblog.example/posts/paragraph-anchor-design"
  );

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute("content");
  const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");

  expect(ogImage).toMatch(/^https:\/\/myblog\.example\//);
  expect(twitterImage).toBe(ogImage);
  expect(twitterCard).toBe("summary_large_image");
});

test("discover routes provide route-specific meta descriptions", async ({ page }) => {
  const routes = [
    "/",
    "/topics",
    "/topics/knowledge-network",
    "/concepts/anchor-id",
    "/archives",
    "/author"
  ];
  const descriptions: string[] = [];

  for (const route of routes) {
    await page.goto(route);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description, route).toBeTruthy();
    descriptions.push(description ?? "");
  }

  expect(new Set(descriptions).size).toBe(descriptions.length);
});

test("post footnotes keep their original reference numbers after rail reordering", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/ant-ai-coding-review");

  await expect(page.locator('a.tufte-footnote-ref[data-footnote-rail-target="note-5"]').first()).toHaveText("5");
  await expect(page.locator('[data-footnote-rail-item="note-5"] .post-scholar-footnote-number-button')).toHaveText("5");
  await expect(page.locator('a.tufte-footnote-ref[data-footnote-rail-target="note-6"]').first()).toHaveText("6");
  await expect(page.locator('[data-footnote-rail-item="note-6"] .post-scholar-footnote-number-button')).toHaveText("6");
});

test("list-item footnotes float near their list section instead of sinking to the rail tail", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/ant-ai-coding-review");

  const positions = await page.evaluate(() => {
    const topOf = (selector: string) => {
      const element = document.querySelector(selector) as HTMLElement | null;
      return element?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
    };

    return {
      note5Top: topOf('[data-footnote-rail-item="note-5"]'),
      note6Top: topOf('[data-footnote-rail-item="note-6"]'),
      note7Top: topOf('[data-footnote-rail-item="note-7"]'),
      note8Top: topOf('[data-footnote-rail-item="note-8"]')
    };
  });

  expect(positions.note5Top).toBeLessThan(positions.note7Top);
  expect(positions.note6Top).toBeLessThan(positions.note8Top);
  expect(positions.note5Top).toBeLessThan(positions.note6Top);
});

test("paragraph-anchor article floats typed sidenotes by first body reference and keeps type distinctions visible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  const positions = await page.evaluate(() => {
    const topOf = (selector: string) => {
      const node = document.querySelector(selector) as HTMLElement | null;
      return node?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
    };
    const labels = Array.from(document.querySelectorAll(".post-scholar-footnote-number-button")).map((node) =>
      (node.textContent || "").trim()
    );
    const typeTags = Array.from(document.querySelectorAll(".post-scholar-item-type-tag")).map((node) =>
      (node.textContent || "").trim()
    );

    return {
      anchorContractTop: topOf('[data-footnote-rail-item="note-anchor-contract"]'),
      supabaseTop: topOf('[data-footnote-rail-item="ref-supabase-rls"]'),
      tufteTop: topOf('[data-footnote-rail-item="ref-tufte-css"]'),
      warmupTop: topOf('[data-footnote-rail-item="note-warmup"]'),
      optimisticTradeoffTop: topOf('[data-footnote-rail-item="note-optimistic-tradeoff"]'),
      referenceCount: document.querySelectorAll('[data-note-type="reference"]').length,
      noteCount: document.querySelectorAll('[data-note-type="note"]').length,
      figureCount: document.querySelectorAll('[data-note-type="figure"]').length,
      labels
      ,
      typeTags
    };
  });

  expect(positions.referenceCount).toBe(2);
  expect(positions.noteCount).toBeGreaterThan(0);
  expect(positions.figureCount).toBe(1);
  expect(positions.anchorContractTop).toBeLessThan(Number.POSITIVE_INFINITY);
  expect(positions.supabaseTop).toBeLessThan(Number.POSITIVE_INFINITY);
  expect(positions.tufteTop).toBeLessThan(Number.POSITIVE_INFINITY);
  expect(positions.warmupTop).toBeLessThan(Number.POSITIVE_INFINITY);
  expect(positions.optimisticTradeoffTop).toBeLessThan(Number.POSITIVE_INFINITY);
  expect(positions.anchorContractTop).toBeLessThan(positions.supabaseTop);
  expect(positions.supabaseTop).toBeLessThan(positions.tufteTop);
  expect(positions.supabaseTop).toBeLessThan(positions.warmupTop);
  expect(positions.tufteTop).toBeLessThan(positions.optimisticTradeoffTop);
  expect(positions.typeTags).toContain("引用");
  expect(positions.typeTags).toContain("注释");
  expect(positions.typeTags).toContain("图表");
  expect(positions.labels).toContain("图1");
  expect(positions.labels.filter((label) => /^\d+$/.test(label))).toEqual([
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10"
  ]);
});

test("paragraph-anchor figure sources can point to footnote-backed bibliography items", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  const figureSourceLink = page.locator(
    '[data-note-key="figure:anchor-diagram"] a[href="#marginalia-footnote-ref-supabase-rls"]'
  );

  await expect(figureSourceLink).toBeVisible();
  await expect(figureSourceLink).toHaveText(/\[\d+\]/);
});

test("paragraph-anchor article keeps the rollback note between the warmup note and later engineering-boundary notes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  const positions = await page.evaluate(() => {
    const topOfNote = (selector: string) => {
      const node = document.querySelector(selector) as HTMLElement | null;
      return node?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
    };

    return {
      warmupTop: topOfNote('[data-footnote-rail-item="note-warmup"]'),
      optimisticFootnoteTop: topOfNote('[data-footnote-rail-item="note-optimistic-tradeoff"]'),
      selectionBoundaryTop: topOfNote('[data-footnote-rail-item="note-selection-caveat"]')
    };
  });

  expect(positions.warmupTop).toBeLessThan(positions.optimisticFootnoteTop);
  expect(positions.optimisticFootnoteTop).toBeLessThan(positions.selectionBoundaryTop);
});

test("topic pages adopt the discover detail runtime with poster hero and two-column post grid", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/topics/knowledge-network");

  await expect(page.locator("body")).toHaveAttribute("data-runtime", "discover");
  await expect(page.locator("[data-discover-hero]")).toBeVisible();
  const grid = page.locator("[data-topic-posts] .discover-post-grid");
  const firstCard = grid.locator(".post-card").first();
  await expect(grid).toBeVisible();
  await expect(firstCard).toBeVisible();

  const metrics = await page.evaluate(() => {
    const gridEl = document.querySelector("[data-topic-posts] .discover-post-grid") as HTMLElement | null;
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

  expect(metrics.gridColumns.split(" ").length).toBe(2);
  expect(metrics.gridWidth).toBeGreaterThan(900);
  expect(metrics.cardWidth).toBeGreaterThan(360);
  expect(metrics.cardWidth).toBeLessThan(metrics.gridWidth * 0.56);
  expect(metrics.leftGap).toBeGreaterThan(24);
  expect(metrics.rightGap).toBeGreaterThan(24);
});

test("archives page stays readable without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/archives");

  await expect(page.locator("[data-discover-hero]")).toBeVisible();
  const archiveGrids = page.locator(".archive-grid");
  await expect(archiveGrids.first()).toBeVisible();
  expect(await archiveGrids.count()).toBeGreaterThan(0);

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
});

test("author page presents a structured research profile without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/author");

  await expect(page.locator("body")).toHaveAttribute("data-runtime", "discover");
  await expect(page.locator("[data-discover-hero]")).toBeVisible();
  await expect(page.locator(".author-avatar")).toBeVisible();
  await expect(page.locator("[data-discover-hero] .discover-hero__panel-copy").getByText("AI 安全 USTC 硕士｜专注大模型系统与安全")).toBeVisible();
  await expect(page.locator("[data-discover-hero] .discover-hero__panel-copy").getByText("把大模型从“能回答问题”变成“能完成任务的系统”")).toBeVisible();
  await expect(page.getByRole("heading", { name: "研究 / 技术方向" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "项目 / 实践" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "当前关注与博客定位" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "联系方式 / 外链" })).toBeVisible();
  await expect(page.locator(".author-post-grid .post-card").first()).toBeVisible();
  await expect(page.locator(".author-social-card", { hasText: "GitHub" })).toContainText("0");
  await expect(page.locator(".author-social-card", { hasText: "小红书" })).toContainText("652");
  await expect(page.locator(".author-social-card", { hasText: "Telegram" })).toContainText("6");
  await expect(page.locator(".author-social-card", { hasText: "知乎" })).toContainText("--");
  await expect(page.getByRole("link", { name: /I\.OVE@outlook\.com/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /github\.com\/yuki-zik/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /scholar\.google\.com/ })).toBeVisible();

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
});

test("runtime matrix marks discover and reading routes explicitly", async ({ page }) => {
  const cases = [
    { path: "/", runtime: "discover" },
    { path: "/topics", runtime: "discover" },
    { path: "/topics/knowledge-network", runtime: "discover" },
    { path: "/concepts/anchor-id", runtime: "discover" },
    { path: "/author", runtime: "discover" },
    { path: "/archives", runtime: "discover" },
    { path: "/posts/paragraph-anchor-design", runtime: "reading" }
  ];

  for (const item of cases) {
    await page.goto(item.path);
    await expect(page.locator("body")).toHaveAttribute("data-runtime", item.runtime);
    await expect(page.locator("main")).toHaveAttribute("data-runtime", item.runtime);
  }

  await page.goto("/posts/paragraph-anchor-design");
  await expect(page.locator(".discover-page__ambient")).toBeVisible();
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

  await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll("h2")).find((node) => node.textContent?.includes("工程边界"));
    if (!(heading instanceof HTMLElement)) {
      return;
    }

    const targetTop = heading.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: targetTop, behavior: "instant" });
  });
  await page.waitForTimeout(400);

  const activeMetrics = await page.evaluate(() => {
    const active = document.querySelector("[data-toc-link].is-active") as HTMLElement | null;
    const progress = document.querySelector("[data-toc-progress]") as HTMLElement | null;
    const track = document.querySelector(".toc-sidebar__track") as HTMLElement | null;
    const heading = Array.from(document.querySelectorAll("h2")).find((node) => node.textContent?.includes("工程边界")) as
      | HTMLElement
      | undefined;
    const progressRect = progress?.getBoundingClientRect();
    const trackRect = track?.getBoundingClientRect();
    return {
      activeText: active?.textContent ?? "",
      progressHeight: progress?.getBoundingClientRect().height ?? 0,
      headingTop: heading?.getBoundingClientRect().top ?? 0,
      progressWithinTrack:
        !!progressRect &&
        !!trackRect &&
        progressRect.top >= trackRect.top - 1 &&
        progressRect.bottom <= trackRect.bottom + 1
    };
  });

  expect(activeMetrics.activeText).toContain("工程边界");
  expect(activeMetrics.progressHeight).toBeGreaterThanOrEqual(40);
  expect(activeMetrics.headingTop).toBeGreaterThan(70);
  expect(activeMetrics.headingTop).toBeLessThan(180);
  expect(activeMetrics.progressWithinTrack).toBe(true);

  await sidebar.locator("[data-toc-link]").filter({ hasText: "状态与回滚" }).click();
  await page.waitForFunction(
    () => {
      const active = document.querySelector("[data-toc-sidebar] [data-toc-link].is-active");
      return active?.textContent?.includes("状态与回滚") ?? false;
    },
    { timeout: 5000 }
  );
  await page.waitForTimeout(250);

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

test("article toc sidebar keeps the last section visible and the progress rail intact near the bottom", async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 760 });
  await page.goto("/posts/myblog-design-manual");

  await page.evaluate(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
  });

  await page.waitForFunction(() => {
    const active = document.querySelector("[data-toc-link].is-active");
    const body = document.querySelector("[data-toc-sidebar-body]") as HTMLElement | null;
    return (
      (active?.textContent?.includes("References") ?? false) &&
      !!body &&
      body.scrollTop > 0
    );
  });

  await page.waitForTimeout(400);

  const metrics = await page.evaluate(() => {
    const body = document.querySelector("[data-toc-sidebar-body]") as HTMLElement | null;
    const track = document.querySelector(".toc-sidebar__track") as HTMLElement | null;
    const progress = document.querySelector("[data-toc-progress]") as HTMLElement | null;
    const active = document.querySelector("[data-toc-sidebar] [data-toc-link].is-active") as HTMLElement | null;
    const item = active?.closest("[data-toc-item]") as HTMLElement | null;
    const bodyRect = body?.getBoundingClientRect();
    const itemRect = item?.getBoundingClientRect();
    const activeRect = active?.getBoundingClientRect();
    const trackRect = track?.getBoundingClientRect();
    const progressRect = progress?.getBoundingClientRect();

    return {
      activeText: active?.textContent ?? "",
      bodyScrollTop: body?.scrollTop ?? 0,
      itemVisible:
        !!bodyRect &&
        !!itemRect &&
        itemRect.top >= bodyRect.top - 1 &&
        itemRect.bottom <= bodyRect.bottom + 1,
      progressWithinTrack:
        !!trackRect &&
        !!progressRect &&
        progressRect.top >= trackRect.top - 1 &&
        progressRect.bottom <= trackRect.bottom + 1,
      progressBottomDelta: trackRect && progressRect ? progressRect.bottom - trackRect.bottom : 0,
      progressTopVsActiveTop: progressRect && activeRect ? progressRect.top - activeRect.top : 0,
      progressBottomVsActiveBottom: progressRect && activeRect ? progressRect.bottom - activeRect.bottom : 0
    };
  });

  expect(metrics.activeText).toContain("References");
  expect(metrics.bodyScrollTop).toBeGreaterThan(0);
  expect(metrics.itemVisible).toBe(true);
  expect(metrics.progressWithinTrack).toBe(true);
  expect(metrics.progressBottomDelta).toBeLessThanOrEqual(1);
  expect(Math.abs(metrics.progressTopVsActiveTop)).toBeLessThanOrEqual(24);
  expect(Math.abs(metrics.progressBottomVsActiveBottom)).toBeLessThanOrEqual(24);
});

test("mobile article toc closes after selecting a heading on tablet widths", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/posts/paragraph-anchor-design");

  const mobileToc = page.locator("[data-post-toc-mobile]");
  await expect(mobileToc).toBeVisible();
  await mobileToc.evaluate((node) => {
    (node as HTMLDetailsElement).open = true;
  });
  await mobileToc.locator("[data-toc-link]").filter({ hasText: "工程边界" }).click();

  await expect(mobileToc).not.toHaveAttribute("open", "");
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
    const coverImg = document.querySelector(".post-title-card .post-cover-img--main") as HTMLElement | null;
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
    const scholarNote = document.querySelector(".post-scholar-item--bubble") as HTMLElement | null;
    const scholarNoteBody = document.querySelector(".post-scholar-footnote-body p") as HTMLElement | null;
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
    const coverImgStyles = coverImg ? getComputedStyle(coverImg) : null;
    const coverGhost = document.querySelector(".post-title-card .post-cover-img--ghost") as HTMLElement | null;
    const coverGhostStyles = coverGhost ? getComputedStyle(coverGhost) : null;
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
      coverBorderWidth: coverStyles ? Number.parseFloat(coverStyles.borderTopWidth) : 0,
      coverShadow: coverStyles?.boxShadow ?? "",
      coverImageRadius: coverImgStyles ? Number.parseFloat(coverImgStyles.borderTopLeftRadius) : 0,
      coverImageFilter: coverImgStyles?.filter ?? "",
      coverImageShadow: coverImgStyles?.boxShadow ?? "",
      coverImageBorderWidth: coverImgStyles ? Number.parseFloat(coverImgStyles.borderTopWidth) : 0,
      coverImageOpacity: coverImgStyles ? Number.parseFloat(coverImgStyles.opacity) : 0,
      coverGhostFilter: coverGhostStyles?.filter ?? "",
      coverGhostOpacity: coverGhostStyles ? Number.parseFloat(coverGhostStyles.opacity) : 0,
      coverGhostPosition: coverGhostStyles?.position ?? "",
      coverGhostTransform: coverGhostStyles?.transform ?? "",
      coverGhostCount: document.querySelectorAll(".post-title-card .post-cover-img--ghost").length,
      coverTop: cover?.getBoundingClientRect().top ?? 0,
      metaTop: meta?.getBoundingClientRect().top ?? 0,
      titleTop: title?.getBoundingClientRect().top ?? 0,
      dekTop: dek?.getBoundingClientRect().top ?? 0,
      statsTop: stats?.getBoundingClientRect().top ?? 0,
      statsLeft: stats?.getBoundingClientRect().left ?? 0,
      statsRight: stats?.getBoundingClientRect().right ?? 0,
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
      scholarRailPaddingRight: scholarRailStyles ? Number.parseFloat(scholarRailStyles.paddingRight) : 0,
      scholarNoteWidth: scholarNote?.getBoundingClientRect().width ?? 0,
      scholarNoteBodyWidth: scholarNoteBody?.getBoundingClientRect().width ?? 0,
      scholarNoteLeft: scholarNote?.getBoundingClientRect().left ?? 0,
      scholarNoteRight: scholarNote?.getBoundingClientRect().right ?? 0,
      scholarRailRight: scholarRail?.getBoundingClientRect().right ?? 0,
      firstParagraphRight: firstParagraph?.getBoundingClientRect().right ?? 0,
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
  expect(metrics.titleCardRadius).toBe(0);
  expect(metrics.titleCardShadow).toBe("none");
  expect(metrics.titleCardBackgroundImage).toBe("none");
  expect(metrics.firstParagraphWidth).toBeGreaterThan(715);
  expect(metrics.firstParagraphWidth).toBeLessThan(810);
  expect(metrics.paperBandRadius).toBeGreaterThanOrEqual(20);
  expect(metrics.paperBandShadow).not.toBe("none");
  expect(metrics.paperBandBackgroundImage).toContain("gradient");
  expect(metrics.articleRadius).toBe(0);
  expect(metrics.articleShadow).toBe("none");
  expect(metrics.articleBackgroundImage).toBe("none");
  expect(metrics.articleBackgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(metrics.scholarRailPaddingLeft).toBeGreaterThanOrEqual(2);
  expect(metrics.scholarRailPaddingLeft).toBeLessThanOrEqual(6);
  expect(metrics.scholarRailPaddingRight).toBeGreaterThanOrEqual(8);
  expect(metrics.scholarRailPaddingRight).toBeLessThanOrEqual(14);
  expect(metrics.scholarNoteWidth).toBeGreaterThanOrEqual(268);
  expect(metrics.scholarNoteBodyWidth).toBeGreaterThanOrEqual(275);
  expect(metrics.scholarNoteLeft - metrics.firstParagraphRight).toBeLessThanOrEqual(78);
  expect(metrics.scholarRailRight - metrics.scholarNoteRight).toBeGreaterThanOrEqual(6);
  expect(metrics.coverTop).toBeLessThan(metrics.metaTop);
  expect(metrics.coverBorderWidth).toBe(0);
  expect(metrics.coverShadow).toBe("none");
  expect(metrics.metaTop).toBeLessThan(metrics.titleTop);
  expect(metrics.titleTop).toBeLessThan(metrics.dekTop);
  expect(metrics.titleTop).toBeLessThan(metrics.statsTop);
  expect(metrics.statsTop).toBeLessThan(metrics.topicsTop);
  expect(Math.abs(metrics.statsLeft - metrics.firstParagraphRight)).toBeLessThanOrEqual(72);
  expect(metrics.statsRight).toBeLessThanOrEqual(metrics.firstParagraphRight + 240);
  expect(metrics.dekTop).toBeLessThan(metrics.topicsTop);
  expect(metrics.topicsTop).toBeLessThan(metrics.dividerTop);
  expect(metrics.titleFontSize).toBeGreaterThan(metrics.metaFontSize);
  expect(metrics.titleFontSize).toBeGreaterThan(metrics.statsFontSize);
  expect(metrics.dividerWidth).toBeGreaterThan(70);
  expect(metrics.dividerWidth).toBeLessThan(148);
  expect(metrics.firstH2Counter).not.toBe("none");
  expect(metrics.firstH2Counter).toContain("SECTION");
  expect(metrics.firstH2CounterColor).not.toBe("rgb(47, 52, 64)");
  expect(metrics.firstH2CounterFontSize).toBeGreaterThanOrEqual(10.5);
  expect(metrics.firstH2PaddingLeft).toBeLessThanOrEqual(2);
  expect(metrics.firstH3Counter).not.toBe("none");
  expect(metrics.firstH3CounterFontFamily).toContain("Source Serif");
  expect(metrics.firstH3CounterFontSize).toBeGreaterThanOrEqual(14.5);
  expect(metrics.firstH3PaddingLeft).toBeGreaterThanOrEqual(35);
  expect(metrics.titleToBodyGap).toBeGreaterThan(38);
  expect(metrics.coverRadius).toBe(0);
  expect(metrics.coverImageRadius).toBeGreaterThanOrEqual(15);
  expect(metrics.coverImageShadow).not.toBe("none");
  expect(metrics.coverImageBorderWidth).toBeGreaterThanOrEqual(1);
  expect(metrics.coverGhostCount).toBe(1);
  expect(metrics.coverGhostFilter).toContain("blur");
  expect(metrics.coverGhostOpacity).toBeGreaterThan(0.52);
  expect(metrics.coverGhostOpacity).toBeLessThan(0.88);
  expect(metrics.coverGhostPosition).toBe("absolute");
  expect(metrics.coverGhostTransform).not.toBe("none");
  expect(metrics.coverImageFilter).not.toContain("drop-shadow");
  expect(metrics.coverImageOpacity).toBeGreaterThan(0.75);
  expect(metrics.dekFontStyle).toBe("normal");
  expect(metrics.tocOpacity).toBeGreaterThan(0.8);
  expect(metrics.tocOpacity).toBeLessThanOrEqual(1);
});

test("article markdown blocks stay within the same reading measure", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/ant-ai-coding-review");

  const metrics = await page.evaluate(() => {
    const parseColor = (value: string) => {
      const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/);
      if (rgbMatch) {
        return rgbMatch[1]
          .split(",")
          .slice(0, 3)
          .map((part) => Number.parseFloat(part.trim()));
      }

      const srgbMatch = value.match(/^color\(srgb ([^ ]+) ([^ ]+) ([^ )/]+)/);
      if (srgbMatch) {
        return srgbMatch.slice(1, 4).map((part) => Number.parseFloat(part) * 255);
      }

      return [0, 0, 0];
    };

    const body = document.querySelector(".post-body--scholarly") as HTMLElement | null;
    const paragraph = body?.querySelector("p[data-anchor], p") as HTMLElement | null;
    const list = body?.querySelector("ul, ol") as HTMLElement | null;
    const firstListItem = list?.querySelector("li") as HTMLElement | null;
    const readableBlocks = Array.from(body?.children ?? []).filter((node) =>
      node.matches("ul, ol, pre, table, blockquote, figure")
    ) as HTMLElement[];
    const rule = body?.querySelector("hr") as HTMLElement | null;
    const selectionStyles = paragraph ? getComputedStyle(paragraph, "::selection") : null;
    const bodyBackground = getComputedStyle(document.body).backgroundColor;
    const [selectionR, selectionG, selectionB] = parseColor(selectionStyles?.backgroundColor ?? "");
    const [bodyR, bodyG, bodyB] = parseColor(bodyBackground);

    return {
      paragraphWidth: paragraph?.getBoundingClientRect().width ?? 0,
      listWidth: list?.getBoundingClientRect().width ?? 0,
      listTextInset:
        paragraph && firstListItem
          ? firstListItem.getBoundingClientRect().left - paragraph.getBoundingClientRect().left
          : 0,
      widestReadableWidth: readableBlocks.reduce(
        (max, node) => Math.max(max, node.getBoundingClientRect().width),
        0
      ),
      ruleWidth: rule?.getBoundingClientRect().width ?? 0,
      selectionContrastFromBody: Math.hypot(selectionR - bodyR, selectionG - bodyG, selectionB - bodyB)
    };
  });

  expect(metrics.paragraphWidth).toBeGreaterThanOrEqual(720);
  expect(metrics.listWidth).toBeLessThanOrEqual(metrics.paragraphWidth - 120);
  expect(metrics.listTextInset).toBeLessThanOrEqual(32);
  expect(metrics.widestReadableWidth).toBeLessThanOrEqual(metrics.paragraphWidth + 1);
  expect(metrics.ruleWidth).toBeGreaterThanOrEqual(metrics.widestReadableWidth - 12);
  expect(metrics.ruleWidth).toBeLessThanOrEqual(metrics.paragraphWidth + 1);
  expect(metrics.selectionContrastFromBody).toBeGreaterThan(28);
});

test("article layout expands on ultra-wide screens without oversized gutters", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto("/posts/paragraph-anchor-design");

  const metrics = await page.evaluate(() => {
    const shell = document.querySelector(".shell--article-reading") as HTMLElement | null;
    const layout = document.querySelector(".post-reading-layout--tri") as HTMLElement | null;
    const toc = document.querySelector(".post-reading-toc-rail") as HTMLElement | null;
    const main = document.querySelector(".post-reading-main") as HTMLElement | null;
    const rail = document.querySelector(".post-reading-rail") as HTMLElement | null;
    const titleCard = document.querySelector(".post-title-card") as HTMLElement | null;
    const firstParagraph = document.querySelector(".post-body--scholarly > p") as HTMLElement | null;
    const scholarNoteBody = document.querySelector(".post-scholar-footnote-body p") as HTMLElement | null;
    const firstNote = document.querySelector(".post-scholar-item--bubble") as HTMLElement | null;

    return {
      viewportWidth: window.innerWidth,
      shellWidth: shell?.getBoundingClientRect().width ?? 0,
      shellLeft: shell?.getBoundingClientRect().left ?? 0,
      tocLeft: toc?.getBoundingClientRect().left ?? 0,
      tocRight: toc?.getBoundingClientRect().right ?? 0,
      layoutWidth: layout?.getBoundingClientRect().width ?? 0,
      mainWidth: main?.getBoundingClientRect().width ?? 0,
      mainLeft: main?.getBoundingClientRect().left ?? 0,
      railWidth: rail?.getBoundingClientRect().width ?? 0,
      railRight: rail?.getBoundingClientRect().right ?? 0,
      titleWidth: titleCard?.getBoundingClientRect().width ?? 0,
      bodyWidth: firstParagraph?.getBoundingClientRect().width ?? 0,
      scholarNoteBodyWidth: scholarNoteBody?.getBoundingClientRect().width ?? 0,
      titleBottom: titleCard?.getBoundingClientRect().bottom ?? 0,
      firstNoteTop: firstNote?.getBoundingClientRect().top ?? 0
    };
  });

  expect(metrics.shellWidth).toBeGreaterThanOrEqual(2100);
  expect(metrics.shellLeft).toBeLessThanOrEqual(240);
  expect(metrics.layoutWidth).toBeGreaterThanOrEqual(2100);
  expect(metrics.mainWidth).toBeGreaterThanOrEqual(900);
  expect(metrics.railWidth).toBeGreaterThanOrEqual(300);
  expect(metrics.railWidth).toBeLessThanOrEqual(360);
  expect(metrics.titleWidth).toBeGreaterThanOrEqual(1180);
  expect(metrics.titleWidth).toBeGreaterThan(metrics.mainWidth);
  expect(metrics.bodyWidth).toBeGreaterThanOrEqual(790);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(860);
  expect(metrics.scholarNoteBodyWidth).toBeGreaterThanOrEqual(290);
  expect(metrics.firstNoteTop).toBeGreaterThan(metrics.titleBottom);
  expect((metrics.shellLeft + metrics.shellWidth) - metrics.tocRight).toBeGreaterThanOrEqual(180);
  expect((metrics.shellLeft + metrics.shellWidth) - metrics.tocRight).toBeLessThanOrEqual(260);
  expect((metrics.shellLeft + metrics.shellWidth) - metrics.railRight).toBeGreaterThanOrEqual(220);
  expect(metrics.mainLeft).toBeGreaterThanOrEqual(metrics.shellLeft + 170);
});

test("full-screen reading layout keeps the toc close to the body container", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1200 });
  await page.goto("/posts/paragraph-anchor-design");

  const metrics = await page.evaluate(() => {
    const toc = document.querySelector(".post-reading-toc-rail") as HTMLElement | null;
    const rail = document.querySelector(".post-reading-rail") as HTMLElement | null;

    return {
      railToTocGap:
        toc && rail ? toc.getBoundingClientRect().left - rail.getBoundingClientRect().right : 0,
      tocWidth: toc?.getBoundingClientRect().width ?? 0,
      railWidth: rail?.getBoundingClientRect().width ?? 0
    };
  });

  expect(metrics.tocWidth).toBeGreaterThanOrEqual(190);
  expect(metrics.railWidth).toBeGreaterThanOrEqual(300);
  expect(metrics.railToTocGap).toBeGreaterThanOrEqual(24);
  expect(metrics.railToTocGap).toBeLessThanOrEqual(60);
});
