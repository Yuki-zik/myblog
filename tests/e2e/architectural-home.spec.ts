import { expect, test } from "@playwright/test";

test("architectural home uses a full-width loaded drawing, large author name and lower-left code annotation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const drawing = page.locator("[data-home-architecture-image]");
  await expect(drawing).toBeVisible();
  await expect(drawing).toHaveAttribute("loading", "eager");
  await expect(drawing).toHaveAttribute("fetchpriority", "high");
  await expect.poll(() => drawing.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator(".site-header")).toHaveAttribute("data-header-variant", "drawing");
  await expect(page.locator(".home-reference-hero__title")).toHaveText("A-Znk");
  await expect(page.locator("[data-home-research-signature]")).toHaveAttribute("open", "");
  const metrics = await page.evaluate(() => {
    const hero = document.querySelector(".home-reference-hero")!.getBoundingClientRect();
    const title = document.querySelector(".home-reference-hero__title")!;
    const annotation = document.querySelector(".home-reference-terminal-wrap")!.getBoundingClientRect();
    const image = document.querySelector<HTMLImageElement>("[data-home-architecture-image]")!;
    return {
      heroLeft: hero.left, heroWidth: hero.width, heroHeight: hero.height,
      titleSize: parseFloat(getComputedStyle(title).fontSize), titleBottom: title.getBoundingClientRect().bottom,
      annotationLeft: annotation.left, annotationTop: annotation.top, annotationBottom: annotation.bottom,
      heroBottom: hero.bottom, viewportWidth: innerWidth, overflow: document.documentElement.scrollWidth - innerWidth,
      imageSource: image.currentSrc,
    };
  });
  expect(Math.abs(metrics.heroLeft)).toBeLessThan(2);
  expect(Math.abs(metrics.heroWidth - metrics.viewportWidth)).toBeLessThan(2);
  expect(metrics.heroHeight).toBeGreaterThanOrEqual(650);
  expect(metrics.titleSize).toBeGreaterThanOrEqual(110);
  expect(metrics.annotationLeft).toBeLessThanOrEqual(90);
  expect(metrics.annotationTop).toBeGreaterThan(metrics.titleBottom + 60);
  expect(metrics.annotationBottom).toBeLessThanOrEqual(metrics.heroBottom + 1);
  expect(metrics.imageSource).not.toContain("data:");
  expect(metrics.overflow).toBeLessThanOrEqual(0);
});

test("architectural mobile keeps real topic navigation and the native code disclosure usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const topicLink = page.locator('.site-nav a[href="/topics"]');
  await expect(topicLink).toBeVisible();
  expect((await topicLink.boundingBox())!.y).toBeLessThan(100);
  const disclosure = page.locator("[data-home-research-signature]");
  await expect(disclosure).not.toHaveAttribute("open", "");
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(disclosure.locator(".home-reference-terminal__body")).toContainText('papers: "/papers"');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await disclosure.locator("summary").press("Enter");
  await expect(disclosure).not.toHaveAttribute("open", "");
  await page.locator("[data-home-domains]").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "关注领域", exact: true })).toBeVisible();
});

test("drawing header preserves search focus across homepage and article entries", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  const header = page.locator(".site-header");
  await expect(header).toHaveAttribute("data-header-variant", "drawing");
  const trigger = page.locator("[data-search-trigger]");
  await trigger.click();
  const input = page.locator("#site-search-input");
  await input.fill("设计");
  await expect(page.locator(".header-search-result-link").first()).toBeVisible();
  await input.press("Escape");
  await expect(trigger).toBeFocused();
  await page.goto("/posts/paragraph-anchor-design");
  await expect(page.locator(".site-header")).toHaveAttribute("data-header-variant", "drawing");
  await expect(page.locator("[data-toc-sidebar]")).toBeVisible();
});

for (const width of [768, 900, 1023]) {
  test(`tablet ${width}px research disclosure expands without overlapping the introduction`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const disclosure = page.locator("[data-home-research-signature]");
    await expect(disclosure).not.toHaveAttribute("open", "");
    await disclosure.locator("summary").click();
    await expect(disclosure).toHaveAttribute("open", "");
    const boxes = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const copy = box(".home-reference-hero__copy");
      const annotation = box(".home-reference-terminal-wrap");
      return {
        copyBottom: copy.bottom,
        annotationTop: annotation.top,
        annotationBottom: annotation.bottom,
        heroBottom: box(".home-reference-hero").bottom,
        domainsTop: box("[data-home-domains]").top,
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(boxes.annotationTop).toBeGreaterThanOrEqual(boxes.copyBottom + 16);
    expect(boxes.annotationBottom).toBeLessThanOrEqual(boxes.heroBottom);
    expect(boxes.domainsTop).toBeGreaterThan(boxes.annotationBottom);
    expect(boxes.overflow).toBeLessThanOrEqual(0);
    await expect(page.locator('.home-reference-hero__actions a[href="/topics"]')).toBeVisible();
  });
}
