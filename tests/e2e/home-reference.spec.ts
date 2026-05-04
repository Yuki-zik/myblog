import { expect, test, type Page } from "@playwright/test";

async function waitForThemeSettled(page: Page) {
  await page.waitForFunction(() => !document.documentElement.classList.contains("theme-transitioning"));
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

test("home reference carries the misty dark theme while keeping header controls intact", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("theme-preference", "dark");
  });

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await waitForThemeSettled(page);

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".theme-toggle-label")).toHaveText("深色");

  const metrics = await page.evaluate(() => {
    const title = document.querySelector(".home-reference-hero__title") as HTMLElement | null;
    const card = document.querySelector(".home-reference-card") as HTMLElement | null;
    const grid = document.querySelector(".home-reference__grid") as HTMLElement | null;
    const ambient = document.querySelector(".home-reference__ambient") as HTMLElement | null;
    const orbBlue = document.querySelector(".home-reference__orb--blue") as HTMLElement | null;
    const primaryButton = document.querySelector(".home-reference-hero__button--primary") as HTMLElement | null;
    const secondaryButton = document.querySelector(".home-reference-hero__button--secondary") as HTMLElement | null;
    const footer = document.querySelector("[data-home-reference-footer]") as HTMLElement | null;

    return {
      titleColor: title ? getComputedStyle(title).color : "",
      cardBackground: card ? getComputedStyle(card).backgroundColor : "",
      gridBackground: grid ? getComputedStyle(grid).backgroundImage : "",
      ambientPosition: ambient ? getComputedStyle(ambient).position : "",
      orbBlueWidth: orbBlue?.getBoundingClientRect().width ?? 0,
      primaryButtonBackground: primaryButton ? getComputedStyle(primaryButton).backgroundColor : "",
      secondaryButtonRadius: secondaryButton ? getComputedStyle(secondaryButton).borderRadius : "",
      footerWidth: footer?.getBoundingClientRect().width ?? 0,
      viewportWidth: window.innerWidth,
      footerVisible: Boolean(footer),
      toggleExists: Boolean(document.querySelector(".site-header .theme-toggle"))
    };
  });

  expect(metrics.titleColor).toBe("rgb(248, 250, 252)");
  expect(metrics.cardBackground).toContain("15, 23, 42");
  expect(metrics.gridBackground).toContain("radial-gradient");
  expect(metrics.ambientPosition).toBe("fixed");
  expect(metrics.orbBlueWidth).toBeGreaterThan(metrics.viewportWidth * 0.45);
  expect(metrics.primaryButtonBackground).toBe("rgb(255, 255, 255)");
  expect(metrics.secondaryButtonRadius).toBe("999px");
  expect(metrics.footerWidth).toBe(metrics.viewportWidth);
  expect(metrics.footerVisible).toBe(true);
  expect(metrics.toggleExists).toBe(true);
});

test("home reference follows dark OS when theme stays on system", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    window.localStorage.removeItem("theme-preference");
  });

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await waitForThemeSettled(page);

  await expect(page.locator("html")).toHaveAttribute("data-theme", "system");

  const metrics = await page.evaluate(() => {
    const primaryButton = document.querySelector(".home-reference-hero__button--primary") as HTMLElement | null;
    const featuredTitle = document.querySelector(".home-reference-featured-card__title") as HTMLElement | null;
    const featuredMain = document.querySelector("[data-home-featured-cover] .post-cover-img--main") as HTMLElement | null;
    const featuredGhost = document.querySelector("[data-home-featured-cover] .post-cover-img--ghost") as HTMLElement | null;

    return {
      storedPreference: window.localStorage.getItem("theme-preference"),
      buttonBackground: primaryButton ? getComputedStyle(primaryButton).backgroundColor : "",
      buttonColor: primaryButton ? getComputedStyle(primaryButton).color : "",
      featuredTitleColor: featuredTitle ? getComputedStyle(featuredTitle).color : "",
      featuredBorderColor: featuredMain ? getComputedStyle(featuredMain).borderTopColor : "",
      featuredGhostOpacity: featuredGhost ? Number.parseFloat(getComputedStyle(featuredGhost).opacity) : 0
    };
  });

  expect(metrics.storedPreference).toBeNull();
  expect(metrics.buttonBackground).toBe("rgb(255, 255, 255)");
  expect(metrics.buttonColor).toBe("rgb(15, 23, 42)");
  expect(metrics.featuredTitleColor).toBe("rgb(255, 255, 255)");
  expect(metrics.featuredBorderColor).toBe("rgb(51, 65, 85)");
  expect(metrics.featuredGhostOpacity).toBeGreaterThan(0.35);
});

test("home domains keep consistent colors across system-dark, light, and dark theme toggles", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    window.localStorage.removeItem("theme-preference");
  });

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await waitForThemeSettled(page);

  const readDomainTheme = () =>
    page.evaluate(() => {
      const card = document.querySelector(".home-reference-domain-card") as HTMLElement | null;
      const title = card?.querySelector("[data-home-domain-title]") as HTMLElement | null;
      const nav = document.querySelector("[data-home-domains-next]") as HTMLElement | null;

      return {
        theme: document.documentElement.dataset.theme,
        colorScheme: document.documentElement.style.colorScheme,
        cardBackground: card ? getComputedStyle(card).backgroundColor : "",
        cardBorder: card ? getComputedStyle(card).borderTopColor : "",
        titleColor: title ? getComputedStyle(title).color : "",
        navBackground: nav ? getComputedStyle(nav).backgroundColor : "",
        navColor: nav ? getComputedStyle(nav).color : ""
      };
    });

  await expect.poll(readDomainTheme).toMatchObject({
    theme: "system",
    colorScheme: "dark",
    cardBackground: "rgba(15, 23, 42, 0.6)",
    cardBorder: "rgb(30, 41, 59)",
    titleColor: "rgb(255, 255, 255)",
    navBackground: "rgba(15, 23, 42, 0.72)",
    navColor: "rgb(203, 213, 225)"
  });

  await page.click("#theme-toggle");
  await waitForThemeSettled(page);
  await expect.poll(readDomainTheme).toMatchObject({
    theme: "light",
    colorScheme: "light",
    cardBackground: "rgba(255, 255, 255, 0.88)",
    cardBorder: "rgb(241, 245, 249)",
    titleColor: "rgb(15, 23, 42)",
    navBackground: "rgba(255, 255, 255, 0.82)",
    navColor: "rgb(51, 65, 85)"
  });

  await page.click("#theme-toggle");
  await waitForThemeSettled(page);
  await expect.poll(readDomainTheme).toMatchObject({
    theme: "dark",
    colorScheme: "dark",
    cardBackground: "rgba(15, 23, 42, 0.6)",
    cardBorder: "rgb(30, 41, 59)",
    titleColor: "rgb(255, 255, 255)",
    navBackground: "rgba(15, 23, 42, 0.72)",
    navColor: "rgb(203, 213, 225)"
  });
});

test("theme switching keeps the home background and cards in the same tonal family", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    window.localStorage.setItem("theme-preference", "dark");
  });

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await waitForThemeSettled(page);

  await page.click("#theme-toggle");

  const readTransitionState = () =>
    page.evaluate(() => {
      const bodyStyles = getComputedStyle(document.body);
      const card = document.querySelector(".home-reference-card") as HTMLElement | null;
      const cardStyles = card ? getComputedStyle(card) : null;
      const bodyMatch = bodyStyles.backgroundColor.match(/\d+/g) ?? [];
      const cardMatch = cardStyles?.backgroundColor.match(/\d+/g) ?? [];

      return {
        theme: document.documentElement.dataset.theme,
        colorScheme: document.documentElement.dataset.colorScheme,
        bodyRed: Number.parseInt(bodyMatch[0] ?? "0", 10),
        cardRed: Number.parseInt(cardMatch[0] ?? "0", 10)
      };
    });

  // Poll until the body background transition has measurably progressed past
  // the dark starting tone. This keeps the assertion deterministic under heavy
  // parallel load while still verifying the cross-theme tonal family.
  await expect.poll(readTransitionState, { timeout: 4000 }).toMatchObject({
    theme: "system",
    colorScheme: "light"
  });
  await expect
    .poll(async () => (await readTransitionState()).bodyRed, { timeout: 4000 })
    .toBeGreaterThan(88);

  const settled = await readTransitionState();
  expect(settled.cardRed).toBeGreaterThan(120);
  expect(Math.abs(settled.cardRed - settled.bodyRed)).toBeLessThan(110);

  await waitForThemeSettled(page);
});

test("home reference primary CTA matches the reference button colors in light theme", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await waitForThemeSettled(page);
  await page.waitForTimeout(650);

  const primaryButton = page.locator(".home-reference-hero__button--primary");
  await expect(primaryButton).toBeVisible();

  const readButtonColors = () =>
    primaryButton.evaluate((node) => {
      const styles = getComputedStyle(node);
      return {
        hover: node.matches(":hover"),
        background: styles.backgroundColor,
        color: styles.color
      };
    });

  const lightRest = await readButtonColors();
  expect(lightRest.hover).toBe(false);
  expect(lightRest.background).toBe("rgb(15, 23, 42)");
  expect(lightRest.color).toBe("rgb(255, 255, 255)");

  await primaryButton.hover();
  await expect
    .poll(readButtonColors, {
      timeout: 2000
    })
    .toMatchObject({
      hover: true,
      background: "rgb(37, 99, 235)",
      color: "rgb(255, 255, 255)"
    });

  const lightHover = await readButtonColors();
  expect(lightHover.background).toBe("rgb(37, 99, 235)");
  expect(lightHover.color).toBe("rgb(255, 255, 255)");
});

test("home reference primary CTA matches the reference button colors in dark theme", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("theme-preference", "dark");
  });

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await waitForThemeSettled(page);
  await page.waitForTimeout(650);

  const primaryButton = page.locator(".home-reference-hero__button--primary");
  await expect(primaryButton).toBeVisible();

  const readButtonColors = () =>
    primaryButton.evaluate((node) => {
      const styles = getComputedStyle(node);
      return {
        hover: node.matches(":hover"),
        background: styles.backgroundColor,
        color: styles.color
      };
    });

  const darkRest = await readButtonColors();
  expect(darkRest.hover).toBe(false);
  expect(darkRest.background).toBe("rgb(255, 255, 255)");
  expect(darkRest.color).toBe("rgb(15, 23, 42)");

  await primaryButton.hover();
  await expect
    .poll(readButtonColors, {
      timeout: 2000
    })
    .toMatchObject({
      hover: true,
      background: "rgb(59, 130, 246)",
      color: "rgb(255, 255, 255)"
    });

  const darkHover = await readButtonColors();
  expect(darkHover.background).toBe("rgb(59, 130, 246)");
  expect(darkHover.color).toBe("rgb(255, 255, 255)");
});

test("home reference collapses into a single-column editorial stack on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".home-reference-hero__title")).toBeVisible();
  await expect(page.locator("[data-home-reference-terminal]")).toBeVisible();
  expect(await page.locator("[data-home-domains] [data-home-domain-card]").count()).toBeGreaterThanOrEqual(5);

  const metrics = await page.evaluate(() => {
    const heroCopy = document.querySelector(".home-reference-hero__copy") as HTMLElement | null;
    const terminal = document.querySelector(".home-reference-terminal-wrap") as HTMLElement | null;
    const domainCards = Array.from(document.querySelectorAll("[data-home-domain-card]")) as HTMLElement[];
    const recentItem = document.querySelector("[data-home-recent-item]") as HTMLElement | null;

    return {
      terminalPosition: terminal ? getComputedStyle(terminal).position : "",
      heroCopyBottom: heroCopy?.getBoundingClientRect().bottom ?? 0,
      terminalTop: terminal?.getBoundingClientRect().top ?? 0,
      firstDomainLeft: domainCards[0]?.getBoundingClientRect().left ?? 0,
      secondDomainLeft: domainCards[1]?.getBoundingClientRect().left ?? 0,
      firstDomainTop: domainCards[0]?.getBoundingClientRect().top ?? 0,
      secondDomainTop: domainCards[1]?.getBoundingClientRect().top ?? 0,
      recentFlexDirection: recentItem ? getComputedStyle(recentItem).flexDirection : ""
    };
  });

  expect(metrics.terminalPosition).toBe("relative");
  expect(metrics.terminalTop).toBeGreaterThan(metrics.heroCopyBottom - 4);
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
  const expectedAfterRapidBurst = Array.from({ length: 4 }, (_, index) => {
    return before.allTitles[(index + clickCount) % before.allTitles.length];
  });

  const startedAt = Date.now();
  await page.evaluate(async ({ count }) => {
    const button = document.querySelector("[data-home-domains-next]");
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("home domains next button missing");
    }

    const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

    for (let index = 0; index < count; index += 1) {
      button.click();
      if (index < count - 1) {
        await wait(60);
      }
    }
  }, { count: clickCount });

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
      timeout: 1800,
      polling: 50
    }
  );

  expect(Date.now() - startedAt).toBeLessThan(1800);
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
  expect(Math.max(...metrics.map((entry) => entry.summaryToMetaGap))).toBeLessThan(92);
});

test("article pages keep the shared footer and do not render the home-only footer variant", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/paragraph-anchor-design");

  await expect(page.locator(".home-reference-footer--reading")).toBeVisible();
  await expect(page.locator("[data-home-reference-footer]")).toHaveCount(0);
  await expect(page.locator(".post-reading-toc-rail")).toBeVisible();
  await expect(page.locator(".waline-comments")).toBeVisible();
});
