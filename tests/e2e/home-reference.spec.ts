import { expect, test, type Locator, type Page } from "@playwright/test";
import { waitForEntranceAnimations } from "./helpers/page-state";

async function waitForThemeSettled(page: Page) {
  await page.waitForFunction(() => !document.documentElement.classList.contains("theme-transitioning"));
}

async function readTextContrast(locator: Locator) {
  return locator.evaluate((node) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    const rgba = (color: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data);
    };
    const blend = (front: number[], back: number[]) => front.slice(0, 3).map((v, i) => v * front[3] / 255 + back[i] * (1 - front[3] / 255));
    const luminance = (rgb: number[]) => rgb.map((v) => {
      const n = v / 255;
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ancestors: Element[] = [];
    for (let el: Element | null = node; el; el = el.parentElement) ancestors.unshift(el);
    let background: number[] | null = null;
    for (const el of ancestors) {
      const paint = rgba(getComputedStyle(el).backgroundColor);
      if (paint[3] === 255) background = paint.slice(0, 3);
      else if (background) background = blend(paint, background);
    }
    if (!background) throw new Error("Contrast sampling requires an opaque painted ancestor");
    const backgroundLuminance = luminance(background);
    const foregroundLuminance = luminance(blend(rgba(getComputedStyle(node).color), background));
    return {
      background,
      backgroundLuminance,
      foregroundLuminance,
      ratio: (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) / (Math.min(backgroundLuminance, foregroundLuminance) + 0.05),
    };
  });
}

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
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
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
        body: JSON.stringify({ source, key, failed: false, count: 6 })
      });
    }

    if (source === "github" && key === "yuki-zik") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ source, key, failed: false, count: 0 })
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ source, key, failed: true })
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await mockSubstats(page);
});

test("home keeps its architectural paper legible in dark mode with header controls intact", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("theme-preference", "dark"));
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await waitForThemeSettled(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".theme-toggle-label")).toHaveText("深色");
  const metrics = await page.evaluate(() => {
    const footer = document.querySelector("[data-home-reference-footer]")!;
    return {
      footerWidth: footer.getBoundingClientRect().width,
      viewportWidth: window.innerWidth,
      pageWidth: document.documentElement.scrollWidth
    };
  });
  for (const selector of [".home-reference-hero__title", "[data-home-domain-title]"]) {
    const paint = await readTextContrast(page.locator(selector).first());
    expect(paint.backgroundLuminance).toBeLessThan(0.12);
    expect(paint.foregroundLuminance).toBeGreaterThan(0.65);
    expect(paint.ratio).toBeGreaterThanOrEqual(4.5);
  }
  expect(metrics.footerWidth).toBe(metrics.viewportWidth);
  expect(metrics.pageWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  await expect(page.locator(".site-header .theme-toggle")).toBeVisible();
  await expect(page.locator("[data-home-architecture-image]")).toBeVisible();
});

test("home preserves the research.ts introduction and live knowledge counts", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  const terminal = page.locator("details[data-home-research-signature]");
  await expect(terminal).toHaveCount(1);
  await expect(terminal).toHaveAttribute("open", "");
  await expect(terminal.locator("summary")).toHaveText("研究签名 · research.ts");
  await expect(terminal.locator(".home-reference-terminal__line")).toHaveText([
    "const research = {",
    "// 当前主研究轨道",
    "focus: [",
    '"LLM / MLLM 系统",',
    '"模型安全",',
    '"Agent 工程",',
    "],",
    'notes: "/topics",',
    'papers: "/papers"',
    "}"
  ]);
  await expect(terminal.getByRole("heading")).toHaveCount(0);
  await expect(terminal.locator(".home-reference-terminal__prompt")).toHaveText("$");
  const index = await (await page.request.get("/search-index.json")).json();
  for (const [kind, collection, suffix] of [
    ["post", "posts", "posts indexed"],
    ["topic", "topics", "topics mapped"],
    ["concept", "concepts", "concepts linked"]
  ] as const) {
    const count = index.filter((entry: { type: string }) => entry.type === kind).length;
    await expect(terminal.locator(`[data-research-count=${collection}]`)).toHaveText(`${count} ${suffix}`);
  }
});

for (const scheme of ["light", "dark"] as const) {
  test(`home architectural drawing loads and leaves navigation usable in system ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("theme-preference", "system"));
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
    await waitForThemeSettled(page);
    const drawing = page.locator("[data-home-architecture-image]");
    await expect(drawing).toBeVisible();
    await expect.poll(() => drawing.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const paint = await drawing.evaluate((node) => {
      const style = getComputedStyle(node);
      return { filter: style.filter, blendMode: style.mixBlendMode, naturalHeight: (node as HTMLImageElement).naturalHeight };
    });
    expect(paint.naturalHeight).toBeGreaterThan(0);
    if (scheme === "dark") {
      expect(paint.filter).toContain("invert(1)");
      expect(paint.blendMode).toBe("screen");
    } else {
      expect(paint.filter).not.toContain("invert(1)");
      expect(paint.blendMode).toBe("multiply");
    }
    const paper = await readTextContrast(page.locator(".home-reference-hero__title"));
    if (scheme === "light") expect(paper.backgroundLuminance).toBeGreaterThan(0.75);
    else expect(paper.backgroundLuminance).toBeLessThan(0.12);
    expect(paper.ratio).toBeGreaterThanOrEqual(4.5);
    await page.getByRole("link", { name: "按主题探索", exact: true }).click();
    await expect(page).toHaveURL(/\/topics$/);
  });
}

test("home follows dark OS and keeps the same surface palette through theme toggles", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => window.localStorage.removeItem("theme-preference"));
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await waitForThemeSettled(page);
  const readDomainTheme = () => page.evaluate(() => {
    const paper = document.querySelector(".home-reference")!;
    const card = document.querySelector(".home-reference-domain-card")!;
    const title = card.querySelector("[data-home-domain-title]")!;
    const nav = document.querySelector("[data-home-domains-next]")!;
    const featuredTitle = document.querySelector(".home-reference-featured-card__title")!;
    const featuredMain = document.querySelector("[data-home-featured-cover] .post-cover-img--main")!;
    const featuredGhost = document.querySelector("[data-home-featured-cover] .post-cover-img--ghost")!;
    return {
      theme: document.documentElement.dataset.theme,
      colorScheme: document.documentElement.dataset.colorScheme,
      paperBackground: getComputedStyle(paper).backgroundColor,
      cardBorder: getComputedStyle(card).borderBottomColor,
      cardBorderWidth: Number.parseFloat(getComputedStyle(card).borderBottomWidth),
      cardBorderStyle: getComputedStyle(card).borderBottomStyle,
      titleColor: getComputedStyle(title).color,
      navBorder: getComputedStyle(nav).borderBottomColor,
      navBorderWidth: Number.parseFloat(getComputedStyle(nav).borderBottomWidth),
      navBorderStyle: getComputedStyle(nav).borderBottomStyle,
      navColor: getComputedStyle(nav).color,
      featuredTitleColor: getComputedStyle(featuredTitle).color,
      featuredBorderColor: getComputedStyle(featuredMain).borderTopColor,
      featuredBorderWidth: Number.parseFloat(getComputedStyle(featuredMain).borderTopWidth),
      featuredBorderStyle: getComputedStyle(featuredMain).borderTopStyle,
      featuredGhostOpacity: Number.parseFloat(getComputedStyle(featuredGhost).opacity)
    };
  });
  await expect.poll(readDomainTheme).toMatchObject({
    theme: "system", colorScheme: "dark"
  });
  const systemDark = await readDomainTheme();
  expect(systemDark.paperBackground).toMatch(/^rgb\(/);
  expect(systemDark.cardBorderWidth).toBeGreaterThan(0);
  expect(systemDark.cardBorderStyle).toBe("solid");
  expect(systemDark.navBorderWidth).toBeGreaterThan(0);
  expect(systemDark.navBorderStyle).toBe("solid");
  const darkPaint = await readTextContrast(page.locator("[data-home-domain-title]").first());
  expect(darkPaint.backgroundLuminance).toBeLessThan(0.12);
  expect(darkPaint.ratio).toBeGreaterThanOrEqual(4.5);
  expect(systemDark.featuredTitleColor).toBe(systemDark.titleColor);
  expect(systemDark.featuredBorderWidth).toBeGreaterThan(0);
  expect(systemDark.featuredBorderStyle).toBe("solid");
  expect(systemDark.featuredBorderColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(systemDark.featuredGhostOpacity).toBeGreaterThan(0.35);
  await page.click("#theme-toggle");
  await waitForThemeSettled(page);
  await expect.poll(readDomainTheme).toMatchObject({
    theme: "light", colorScheme: "light"
  });
  const light = await readDomainTheme();
  const lightPaint = await readTextContrast(page.locator("[data-home-domain-title]").first());
  expect(lightPaint.backgroundLuminance).toBeGreaterThan(0.75);
  expect(lightPaint.ratio).toBeGreaterThanOrEqual(4.5);
  expect(light.paperBackground).toMatch(/^rgb\(/);
  expect(light.paperBackground).not.toBe(systemDark.paperBackground);
  expect(light.cardBorder).not.toBe(systemDark.cardBorder);
  expect(light.cardBorderWidth).toBeGreaterThan(0);
  expect(light.cardBorderStyle).toBe("solid");
  expect(light.navBorder).not.toBe(systemDark.navBorder);
  expect(light.navBorderWidth).toBeGreaterThan(0);
  expect(light.navBorderStyle).toBe("solid");
  expect(light.navColor).not.toBe(systemDark.navColor);
  expect(light.featuredTitleColor).toBe(light.titleColor);
  expect(light.featuredTitleColor).not.toBe(systemDark.featuredTitleColor);
  expect(light.featuredBorderColor).not.toBe(systemDark.featuredBorderColor);
  expect(light.featuredBorderColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(light.featuredBorderWidth).toBeGreaterThan(0);
  expect(light.featuredBorderStyle).toBe("solid");
  expect(light.featuredGhostOpacity).toBeGreaterThan(0.35);
  await page.click("#theme-toggle");
  await waitForThemeSettled(page);
  await expect.poll(readDomainTheme).toEqual({ ...systemDark, theme: "dark" });
});

test("theme switching keeps transparent topic cards on the same painted paper", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    window.localStorage.setItem("theme-preference", "dark");
  });

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await waitForThemeSettled(page);

  await page.click("#theme-toggle");

  const readPaint = () => Promise.all([
    readTextContrast(page.locator(".home-reference")),
    readTextContrast(page.locator("[data-home-domain-title]").first()),
  ]);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
  await expect(page.locator("html")).toHaveAttribute("data-color-scheme", "light");
  // Composite each transparent card onto its actual opaque paper ancestor.
  // The original transition brightness and tonal-distance limits still apply.
  await expect.poll(async () => {
    const [paper, card] = await readPaint();
    return paper.background[0] > 88 && card.background[0] > 120;
  }, { timeout: 4000 }).toBe(true);
  const [paper, card] = await readPaint();
  expect(Math.abs(card.background[0] - paper.background[0])).toBeLessThan(110);
  await waitForThemeSettled(page);
  const [settledPaper, settledCard] = await readPaint();
  expect(settledPaper.backgroundLuminance).toBeGreaterThan(0.75);
  expect(settledCard.backgroundLuminance).toBeGreaterThan(0.75);
  expect(settledCard.ratio).toBeGreaterThanOrEqual(4.5);
});

for (const scheme of ["light", "dark"] as const) {
  test(`home text CTA stays legible and supports pointer and keyboard navigation in ${scheme}`, async ({ page }) => {
    await page.addInitScript((theme) => window.localStorage.setItem("theme-preference", theme), scheme);
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/");
    await waitForThemeSettled(page);
    await waitForEntranceAnimations(page);
    const button = page.locator(".home-reference-hero__button--primary");
    await expect(button).toHaveAttribute("href", "/topics");
    expect((await readTextContrast(button)).ratio).toBeGreaterThanOrEqual(4.5);
    await button.hover();
    await expect.poll(() => button.evaluate((node) => node.matches(":hover"))).toBe(true);
    expect((await readTextContrast(button)).ratio).toBeGreaterThanOrEqual(4.5);
    const restShadow = await button.evaluate((node) => getComputedStyle(node).boxShadow);
    await page.keyboard.press("Tab");
    await button.focus();
    await expect(button).toBeFocused();
    const focus = await button.evaluate((node) => {
      const style = getComputedStyle(node);
      return { outline: style.outlineStyle, width: Number.parseFloat(style.outlineWidth), shadow: style.boxShadow };
    });
    expect((focus.outline !== "none" && focus.width > 0) || (focus.shadow !== "none" && focus.shadow !== restShadow)).toBe(true);
    await button.press("Enter");
    await expect(page).toHaveURL(/\/topics$/);
    await page.goBack();
    await page.locator(".home-reference-hero__button--secondary").click();
    await expect(page).toHaveURL(/\/papers$/);
  });
}

test("home reference collapses into a single-column editorial stack on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".home-reference-hero__title")).toBeVisible();
  await expect(page.locator("[data-home-reference-terminal]")).toBeVisible();
  await expect(page.locator("details[data-home-research-signature]")).not.toHaveAttribute("open", "");
  await expect(page.locator(".home-reference-terminal__body")).not.toBeVisible();
  expect(await page.locator("[data-home-domains] [data-home-domain-card]").count()).toBeGreaterThanOrEqual(5);

  const metrics = await page.evaluate(() => {
    const heroCopy = document.querySelector(".home-reference-hero__copy") as HTMLElement | null;
    const terminal = document.querySelector(".home-reference-terminal-wrap") as HTMLElement | null;
    const terminalCard = document.querySelector("[data-home-reference-terminal]") as HTMLElement | null;
    const domainCards = Array.from(document.querySelectorAll("[data-home-domain-card]")) as HTMLElement[];
    const recentItem = document.querySelector("[data-home-recent-item]") as HTMLElement | null;

    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      heroCopyBottom: heroCopy?.getBoundingClientRect().bottom ?? 0,
      terminalTop: terminal?.getBoundingClientRect().top ?? 0,
      terminalRight: terminalCard?.getBoundingClientRect().right ?? 0,
      firstDomainLeft: domainCards[0]?.getBoundingClientRect().left ?? 0,
      secondDomainLeft: domainCards[1]?.getBoundingClientRect().left ?? 0,
      firstDomainTop: domainCards[0]?.getBoundingClientRect().top ?? 0,
      secondDomainTop: domainCards[1]?.getBoundingClientRect().top ?? 0,
      recentFlexDirection: recentItem ? getComputedStyle(recentItem).flexDirection : ""
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.terminalTop).toBeGreaterThan(metrics.heroCopyBottom - 4);
  expect(metrics.terminalRight).toBeLessThanOrEqual(metrics.viewportWidth - 16);
  expect(Math.abs(metrics.firstDomainLeft - metrics.secondDomainLeft)).toBeLessThan(4);
  expect(metrics.secondDomainTop).toBeGreaterThan(metrics.firstDomainTop + 20);
  expect(metrics.recentFlexDirection).toBe("column");
});

test("home domains keep a fixed 4-card desktop window and loop elegantly through the topic set", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const viewport = page.locator("[data-home-domains-viewport]");
  const nextButton = page.locator("[data-home-domains-next]");
  const previousButton = page.locator("[data-home-domains-prev]");
  await expect(viewport).toBeVisible();
  await expect(nextButton).toBeVisible();
  await expect(previousButton).toBeVisible();

  const cardCount = await page.locator("[data-home-domain-card]").count();
  expect(cardCount).toBeGreaterThanOrEqual(5);

  const readMetrics = () =>
    page.evaluate(() => {
      const viewport = document.querySelector("[data-home-domains-viewport]") as HTMLElement | null;
      const cards = Array.from(document.querySelectorAll("[data-home-domain-card]")) as HTMLElement[];
      const viewportRect = viewport?.getBoundingClientRect();

      const fullyVisibleTitles = cards
        .filter((card) => {
          if (!viewportRect) {
            return false;
          }

          const rect = card.getBoundingClientRect();
          return rect.left >= viewportRect.left - 1 && rect.right <= viewportRect.right + 1;
        })
        .map((card) => card.querySelector("[data-home-domain-title]")?.textContent?.trim() ?? "");

      const fullyVisibleHeights = cards
        .filter((card) => {
          if (!viewportRect) {
            return false;
          }

          const rect = card.getBoundingClientRect();
          return rect.left >= viewportRect.left - 1 && rect.right <= viewportRect.right + 1;
        })
        .map((card) => card.getBoundingClientRect().height);

      return {
        allTitles: cards.map((card) => card.querySelector("[data-home-domain-title]")?.textContent?.trim() ?? ""),
        fullyVisibleTitles,
        fullyVisibleHeights,
        loopState: viewport?.dataset.loop ?? "",
        animating: viewport?.dataset.animating ?? "false",
        previousDisabled: (document.querySelector("[data-home-domains-prev]") as HTMLButtonElement | null)?.disabled ?? true,
        nextDisabled: (document.querySelector("[data-home-domains-next]") as HTMLButtonElement | null)?.disabled ?? true
      };
    });

  const before = await readMetrics();
  expect(before.fullyVisibleTitles).toHaveLength(4);
  expect(before.loopState).toBe("true");
  expect(before.previousDisabled).toBe(false);
  expect(before.nextDisabled).toBe(false);
  expect(Math.max(...before.fullyVisibleHeights) - Math.min(...before.fullyVisibleHeights)).toBeLessThan(2);

  await previousButton.click();
  await expect
    .poll(readMetrics, {
      timeout: 2000
    })
    .toMatchObject({
      fullyVisibleTitles: [
        before.allTitles.at(-1),
        before.fullyVisibleTitles[0],
        before.fullyVisibleTitles[1],
        before.fullyVisibleTitles[2]
      ],
      animating: "false"
    });

  const afterPrevious = await readMetrics();
  expect(Math.max(...afterPrevious.fullyVisibleHeights) - Math.min(...afterPrevious.fullyVisibleHeights)).toBeLessThan(2);

  await nextButton.click();
  await expect
    .poll(readMetrics, {
      timeout: 2000
    })
    .toEqual(
      expect.objectContaining({
        fullyVisibleTitles: before.fullyVisibleTitles,
        animating: "false",
        previousDisabled: false,
        nextDisabled: false
      })
    );

  const settledLoop = await readMetrics();
  expect(settledLoop.fullyVisibleTitles).toEqual(before.fullyVisibleTitles);
  expect(settledLoop.previousDisabled).toBe(false);
  expect(settledLoop.nextDisabled).toBe(false);

  await nextButton.click();
  await expect
    .poll(readMetrics, {
      timeout: 2000
    })
    .toMatchObject({
      fullyVisibleTitles: [
        before.fullyVisibleTitles[1],
        before.fullyVisibleTitles[2],
        before.fullyVisibleTitles[3],
        expect.any(String)
      ],
      animating: "false"
    });
});

test("home domains horizontal wheel input moves the same loop as next and previous controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const viewport = page.locator("[data-home-domains-viewport]");
  await expect(viewport).toBeVisible();

  const readMetrics = () =>
    page.evaluate(() => {
      const viewport = document.querySelector("[data-home-domains-viewport]") as HTMLElement | null;
      const cards = Array.from(document.querySelectorAll("[data-home-domain-card]")) as HTMLElement[];
      const viewportRect = viewport?.getBoundingClientRect();

      const fullyVisibleTitles = cards
        .filter((card) => {
          if (!viewportRect) return false;
          const rect = card.getBoundingClientRect();
          return rect.left >= viewportRect.left - 1 && rect.right <= viewportRect.right + 1;
        })
        .map((card) => card.querySelector("[data-home-domain-title]")?.textContent?.trim() ?? "");

      return {
        allTitles: cards.map((card) => card.querySelector("[data-home-domain-title]")?.textContent?.trim() ?? ""),
        fullyVisibleTitles,
        animating: viewport?.dataset.animating ?? "false"
      };
    });

  const before = await readMetrics();
  const expectedAfterWheel = Array.from({ length: 4 }, (_, index) => before.allTitles[(index + 1) % before.allTitles.length]);

  await viewport.hover();
  await page.mouse.wheel(180, 0);

  await expect
    .poll(readMetrics, { timeout: 2500 })
    .toEqual(
      expect.objectContaining({
        fullyVisibleTitles: expectedAfterWheel,
        animating: "false"
      })
    );
});

test("home domains vertical wheel input keeps normal page scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const viewport = page.locator("[data-home-domains-viewport]");
  await expect(viewport).toBeVisible();
  await viewport.scrollIntoViewIfNeeded();

  const before = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("[data-home-domain-card]")) as HTMLElement[];
    return {
      scrollY: window.scrollY,
      firstTitle: cards[0]?.querySelector("[data-home-domain-title]")?.textContent?.trim() ?? ""
    };
  });

  await viewport.hover();
  await page.mouse.wheel(0, 240);
  await page.waitForTimeout(250);

  const after = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("[data-home-domain-card]")) as HTMLElement[];
    return {
      scrollY: window.scrollY,
      firstTitle: cards[0]?.querySelector("[data-home-domain-title]")?.textContent?.trim() ?? ""
    };
  });

  expect(after.scrollY).toBeGreaterThan(before.scrollY + 40);
  expect(after.firstTitle).toBe(before.firstTitle);
});

test("home domains accept rapid consecutive clicks without dropping queued steps", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const nextButton = page.locator("[data-home-domains-next]");
  await expect(nextButton).toBeVisible();

  const readMetrics = () =>
    page.evaluate(() => {
      const viewport = document.querySelector("[data-home-domains-viewport]") as HTMLElement | null;
      const cards = Array.from(document.querySelectorAll("[data-home-domain-card]")) as HTMLElement[];
      const viewportRect = viewport?.getBoundingClientRect();

      const fullyVisibleTitles = cards
        .filter((card) => {
          if (!viewportRect) {
            return false;
          }

          const rect = card.getBoundingClientRect();
          return rect.left >= viewportRect.left - 1 && rect.right <= viewportRect.right + 1;
        })
        .map((card) => card.querySelector("[data-home-domain-title]")?.textContent?.trim() ?? "");

      return {
        allTitles: cards.map((card) => card.querySelector("[data-home-domain-title]")?.textContent?.trim() ?? ""),
        fullyVisibleTitles,
        animating: viewport?.dataset.animating ?? "false"
      };
    });

  const before = await readMetrics();
  const expectedAfterTwoSteps = Array.from({ length: 4 }, (_, index) => {
    return before.allTitles[(index + 2) % before.allTitles.length];
  });

  await nextButton.click();
  await page.waitForTimeout(80);
  await nextButton.click();

  await expect
    .poll(readMetrics, {
      timeout: 2500
    })
    .toEqual(
      expect.objectContaining({
        fullyVisibleTitles: expectedAfterTwoSteps,
        animating: "false"
      })
    );
});

test("home domains catch up to rapid multi-click input instead of replaying every step serially", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const nextButton = page.locator("[data-home-domains-next]");
  await expect(nextButton).toBeVisible();

  const readMetrics = () =>
    page.evaluate(() => {
      const viewport = document.querySelector("[data-home-domains-viewport]") as HTMLElement | null;
      const cards = Array.from(document.querySelectorAll("[data-home-domain-card]")) as HTMLElement[];
      const viewportRect = viewport?.getBoundingClientRect();

      const fullyVisibleTitles = cards
        .filter((card) => {
          if (!viewportRect) {
            return false;
          }

          const rect = card.getBoundingClientRect();
          return rect.left >= viewportRect.left - 1 && rect.right <= viewportRect.right + 1;
        })
        .map((card) => card.querySelector("[data-home-domain-title]")?.textContent?.trim() ?? "");

      return {
        allTitles: cards.map((card) => card.querySelector("[data-home-domain-title]")?.textContent?.trim() ?? ""),
        fullyVisibleTitles,
        animating: viewport?.dataset.animating ?? "false"
      };
    });

  const before = await readMetrics();
  const clickCount = 6;
  // The in-page timing below spends one baseline click before the burst, so the
  // window ends up advanced by that step plus the whole burst.
  const totalSteps = clickCount + 1;
  const expectedAfterRapidBurst = Array.from({ length: 4 }, (_, index) => {
    return before.allTitles[(index + totalSteps) % before.allTitles.length];
  });

  /*
   * This test's claim is relative — a burst must not replay every step
   * serially — so it is measured relative to a single step on the same machine.
   *
   * A wall-clock budget measured from the Node side was the wrong instrument:
   * most of it was CDP round-trips, the deliberate 60ms click spacing and the
   * 50ms waitForFunction polling granularity, so it tipped over on a loaded
   * runner while the carousel itself was fine. Timing both runs in-page and
   * comparing them cancels the machine out.
   */
  const timings = await page.evaluate(async ({ count }) => {
    const button = document.querySelector("[data-home-domains-next]");
    const viewport = document.querySelector("[data-home-domains-viewport]") as HTMLElement | null;
    if (!(button instanceof HTMLButtonElement) || !viewport) {
      throw new Error("home domains carousel missing");
    }

    const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
    /*
     * `animating` is only written once the controller has run at least one
     * animation, so before the first interaction the attribute is absent.
     * Treat "not true" as idle rather than waiting for a literal "false" that
     * never arrives on a pristine page.
     */
    const isIdle = () => viewport.dataset.animating !== "true";
    const settled = async () => {
      for (let frame = 0; frame < 600; frame += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (isIdle()) {
          return true;
        }
      }
      return false;
    };

    // Baseline: one step, start to settle.
    if (!isIdle()) {
      await settled();
    }
    const singleStart = performance.now();
    button.click();
    const singleSettled = await settled();
    const singleMs = performance.now() - singleStart;

    // Burst: the same number of steps requested back to back.
    const burstStart = performance.now();
    for (let index = 0; index < count; index += 1) {
      button.click();
      if (index < count - 1) {
        await wait(60);
      }
    }
    const burstSettled = await settled();
    const burstMs = performance.now() - burstStart;

    return { singleMs, burstMs, singleSettled, burstSettled };
  }, { count: clickCount });

  expect(timings.singleSettled).toBe(true);
  expect(timings.burstSettled).toBe(true);

  await page.waitForFunction(
    ({ expectedTitles }) => {
      const viewport = document.querySelector("[data-home-domains-viewport]") as HTMLElement | null;
      const cards = Array.from(document.querySelectorAll("[data-home-domain-card]")) as HTMLElement[];
      const viewportRect = viewport?.getBoundingClientRect();

      const fullyVisibleTitles = cards
        .filter((card) => {
          if (!viewportRect) {
            return false;
          }

          const rect = card.getBoundingClientRect();
          return rect.left >= viewportRect.left - 1 && rect.right <= viewportRect.right + 1;
        })
        .map((card) => card.querySelector("[data-home-domain-title]")?.textContent?.trim() ?? "");

      return viewport?.dataset.animating === "false" && JSON.stringify(fullyVisibleTitles) === JSON.stringify(expectedTitles);
    },
    { expectedTitles: expectedAfterRapidBurst },
    {
      timeout: 5000,
      polling: 50
    }
  );

  /*
   * 6 steps replayed serially would cost 6 single-step animations plus the
   * 300ms of click spacing. Requiring the burst to land under half of that
   * proves the queue is collapsed into a multi-step move rather than played
   * back one step at a time.
   */
  const serialEquivalentMs = timings.singleMs * clickCount + 60 * (clickCount - 1);
  expect(timings.burstMs).toBeLessThan(serialEquivalentMs * 0.5);
});

test("home domain cards still lift vertically on hover after the carousel animation refactor", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const firstDomainItem = page.locator("[data-home-domain-card]").first();
  const firstDomainSurface = firstDomainItem.locator(".home-reference-domain-card");
  await expect(firstDomainSurface).toBeVisible();

  const readTop = async () =>
    firstDomainSurface.evaluate((node) => node.getBoundingClientRect().top);

  const topBeforeHover = await readTop();
  await firstDomainItem.hover();

  await expect
    .poll(async () => topBeforeHover - await readTop(), {
      timeout: 2000
    })
    .toBeGreaterThan(2);
});

test("home domain cards keep a restrained desktop proportion instead of stretching too tall", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const metrics = await page.evaluate(() => {
    const viewport = document.querySelector("[data-home-domains-viewport]") as HTMLElement | null;
    const viewportRect = viewport?.getBoundingClientRect();
    const cards = Array.from(document.querySelectorAll("[data-home-domain-card]")) as HTMLElement[];

    return cards
      .filter((card) => {
        if (!viewportRect) {
          return false;
        }

        const rect = card.getBoundingClientRect();
        return rect.left >= viewportRect.left - 1 && rect.right <= viewportRect.right + 1;
      })
      .map((card) => {
        const surface = card.querySelector(".home-reference-domain-card");
        const summary = card.querySelector("[data-home-domain-summary]");
        const meta = card.querySelector("[data-home-domain-meta]");

        if (!(surface instanceof HTMLElement) || !(summary instanceof HTMLElement) || !(meta instanceof HTMLElement)) {
          return null;
        }

        const rect = surface.getBoundingClientRect();
        const summaryRect = summary.getBoundingClientRect();
        const metaRect = meta.getBoundingClientRect();

        return {
          height: rect.height,
          width: rect.width,
          ratio: rect.height / rect.width,
          summaryToMetaGap: metaRect.top - summaryRect.bottom
        };
      })
      .filter((entry): entry is { height: number; width: number; ratio: number; summaryToMetaGap: number } => entry !== null);
  });

  expect(metrics).toHaveLength(4);
  expect(Math.max(...metrics.map((entry) => entry.ratio))).toBeLessThan(1);
  expect(Math.max(...metrics.map((entry) => entry.summaryToMetaGap))).toBeLessThan(48);
});

test("article pages keep the shared footer and do not render the home-only footer variant", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  await expect(page.locator(".home-reference-footer--reading")).toBeVisible();
  await expect(page.locator("[data-home-reference-footer]")).toHaveCount(0);
  await expect(page.locator(".post-reading-toc-rail")).toBeVisible();
  await expect(page.locator(".waline-comments")).toBeVisible();
});
