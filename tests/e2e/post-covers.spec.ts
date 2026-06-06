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
  await expect(topicPosts.locator(".post-card-topics").first()).toContainText("#主题化知识网络");
  await expect(topicPosts.locator(".post-card-topics").first()).not.toContainText("#knowledge-network");
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
  await expect(conceptPosts.locator(".post-card-topics").first()).toContainText("#段落级短评");
  await expect(conceptPosts.locator(".post-card-topics").first()).not.toContainText("#paragraph-review");
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

test("header search supports keyboard selection and enter navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.keyboard.press("/");
  const input = page.locator("[data-search-input]");
  await expect(input).toBeFocused();
  await input.fill("设计说明书");

  const results = page.locator("[data-search-results]");
  await expect(results.locator("a")).toContainText(["MyBlog 的设计说明书"]);
  await expect(input).toHaveAttribute("role", "combobox");
  await expect(results).toHaveAttribute("role", "listbox");
  await expect(results.locator("[role='option']")).toHaveCount(1);

  const panelMetrics = await page.evaluate(() => {
    const headerInner = document.querySelector(".site-header-inner") as HTMLElement | null;
    const panel = document.querySelector("[data-search-panel]") as HTMLElement | null;
    const headerRect = headerInner?.getBoundingClientRect();
    const panelRect = panel?.getBoundingClientRect();
    return {
      headerOverflow: headerInner ? getComputedStyle(headerInner).overflow : "",
      viewportHeight: window.innerHeight,
      headerBottom: headerRect?.bottom ?? 0,
      panelTop: panelRect?.top ?? 0,
      panelBottom: panelRect?.bottom ?? 0,
      panelHeight: panelRect?.height ?? 0,
      visibleInsideHeader:
        headerRect && panelRect
          ? Math.max(0, Math.min(headerRect.bottom, panelRect.bottom) - Math.max(headerRect.top, panelRect.top))
          : 0
    };
  });

  expect(panelMetrics.headerOverflow).toBe("visible");
  expect(panelMetrics.panelHeight).toBeGreaterThan(120);
  expect(panelMetrics.panelTop).toBeGreaterThanOrEqual(panelMetrics.headerBottom - 8);
  expect(panelMetrics.panelBottom).toBeLessThanOrEqual(panelMetrics.viewportHeight);

  await page.keyboard.press("ArrowDown");
  const activeId = await input.getAttribute("aria-activedescendant");
  expect(activeId).toBeTruthy();
  await expect(results.locator(`#${activeId}`)).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/posts\/myblog-design-manual$/);
});

test("header search controls expose visible keyboard focus states", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const triggerFocus = await page.locator("[data-search-trigger]").evaluate((node) => {
    const styles = getComputedStyle(node);
    return {
      boxShadow: styles.boxShadow,
      outlineStyle: styles.outlineStyle
    };
  });

  expect(triggerFocus.boxShadow === "none" && triggerFocus.outlineStyle === "none").toBe(false);

  await page.keyboard.press("/");
  const inputFocus = await page.locator("[data-search-input]").evaluate((node) => {
    const field = node.closest("[data-search-field]");
    const nodeStyles = getComputedStyle(node);
    const fieldStyles = field ? getComputedStyle(field) : null;
    return {
      inputBoxShadow: nodeStyles.boxShadow,
      fieldBoxShadow: fieldStyles?.boxShadow ?? "none"
    };
  });

  expect(inputFocus.inputBoxShadow === "none" && inputFocus.fieldBoxShadow === "none").toBe(false);
});

test("header search expands within the viewport on short tablet aspect ratios", async ({ page }) => {
  await page.setViewportSize({ width: 824, height: 227 });
  await page.goto("/author");

  const trigger = page.locator("[data-search-trigger]");
  await expect(trigger).toBeVisible();

  const collapsed = await trigger.boundingBox();
  expect(collapsed).not.toBeNull();
  expect(collapsed!.x + collapsed!.width).toBeLessThanOrEqual(824);

  await trigger.click();
  await expect(page.locator("[data-search-input]")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const field = document.querySelector("[data-search-field]") as HTMLElement | null;
    const input = document.querySelector("[data-search-input]") as HTMLElement | null;
    const nav = document.querySelector(".site-nav") as HTMLElement | null;
    const theme = document.querySelector("#theme-toggle") as HTMLElement | null;
    const fieldRect = field?.getBoundingClientRect();
    const inputRect = input?.getBoundingClientRect();
    const navRect = nav?.getBoundingClientRect();
    const themeRect = theme?.getBoundingClientRect();

    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      fieldLeft: fieldRect?.left ?? -1,
      fieldRight: fieldRect?.right ?? -1,
      inputWidth: inputRect?.width ?? 0,
      navRight: navRect?.right ?? -1,
      themeRight: themeRect?.right ?? -1
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.fieldLeft).toBeGreaterThanOrEqual(0);
  expect(metrics.fieldRight).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.inputWidth).toBeGreaterThan(180);
  expect(metrics.navRight).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.themeRight).toBeLessThanOrEqual(metrics.viewportWidth);
});

test("reading progress bar updates aria value and visible fill on scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  const progressBar = page.locator("#reading-progress-bar");

  await expect(progressBar).toBeVisible();
  await expect(progressBar).toHaveAttribute("aria-label", "正文阅读进度");

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

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight * 0.72);
  });
  await page.waitForTimeout(300);

  await expect(page.locator(".site-header")).toHaveClass(/is-scrolled/);
  await expect(page.locator(".site-header")).toHaveAttribute("data-header-state", /compact|hidden/);

  const nextValue = Number(await progressBar.getAttribute("aria-valuenow"));
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

  expect(nextValue).toBeGreaterThan(initialValue);
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
