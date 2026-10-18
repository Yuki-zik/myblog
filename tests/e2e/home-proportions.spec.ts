import { expect, test } from "@playwright/test";

for (const width of [1024, 1440]) {
  test(`home at ${width}px gives its introduction and research signature readable space`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("[data-home-research-signature]")).toHaveAttribute("open", "");
    await page.evaluate(() => document.fonts.ready);

    const metrics = await page.evaluate(() => {
      const element = (selector: string) => document.querySelector<HTMLElement>(selector)!;
      const size = (selector: string) => Number.parseFloat(getComputedStyle(element(selector)).fontSize);
      const box = (selector: string) => element(selector).getBoundingClientRect();
      const copy = box(".home-reference-hero__copy");
      const terminal = box(".home-reference-terminal-wrap");
      const hero = box(".home-reference-hero");
      const drawing = element("[data-home-architecture-image]") as HTMLImageElement;
      const art = drawing.getBoundingClientRect();
      return {
        topicsSize: size(".home-reference-hero__topics"),
        descriptionSize: size(".home-reference-hero__description"),
        actionSize: size(".home-reference-hero__button"),
        codeSize: size(".home-reference-terminal__body"),
        titleSize: size(".home-reference-hero__title"),
        copyTop: copy.top,
        copyBottom: copy.bottom,
        copyLeft: copy.left,
        annotationTop: terminal.top,
        annotationBottom: terminal.bottom,
        annotationLeft: terminal.left,
        annotationWidth: terminal.width,
        leftColumnRight: Math.max(copy.right, terminal.right),
        heroBottom: hero.bottom,
        heroWidth: hero.width,
        artWidth: art.width,
        artHeight: art.height,
        imageLoaded: drawing.complete && drawing.naturalWidth > 0,
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });

    // Supporting copy is a readable second level beneath the existing large name.
    expect(metrics.topicsSize).toBeGreaterThanOrEqual(20);
    expect(metrics.descriptionSize).toBeGreaterThanOrEqual(17);
    expect(metrics.actionSize).toBeGreaterThanOrEqual(16);
    expect(metrics.codeSize).toBeGreaterThanOrEqual(15);
    expect(metrics.titleSize).toBeGreaterThanOrEqual(width === 1440 ? 110 : 100);
    expect(metrics.annotationWidth).toBeGreaterThanOrEqual(380);
    expect(metrics.annotationWidth).toBeLessThanOrEqual(420);

    // Real boxes, not positioning modes: an expanded signature cannot cover its introduction.
    expect(metrics.annotationTop).toBeGreaterThanOrEqual(metrics.copyBottom + 20);
    expect(Math.abs(metrics.annotationLeft - metrics.copyLeft)).toBeLessThan(2);
    expect(metrics.copyBottom).toBeLessThan(900 * 0.62);
    expect(metrics.annotationBottom).toBeLessThanOrEqual(948);
    expect(metrics.annotationBottom).toBeLessThan(metrics.heroBottom);

    // Retain the full-canvas drawing and a broad unobstructed right-hand field.
    expect(metrics.leftColumnRight).toBeLessThanOrEqual(width * 0.62);
    expect(metrics.heroWidth).toBe(width);
    expect(metrics.artWidth).toBe(width);
    expect(metrics.artHeight).toBeGreaterThanOrEqual(650);
    expect(metrics.imageLoaded).toBe(true);
    expect(metrics.overflow).toBeLessThanOrEqual(0);
  });
}

test("home reading indexes use editorial headings and readable summaries", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const sizes = await page.evaluate(() => {
    const size = (selector: string) => Number.parseFloat(getComputedStyle(document.querySelector(selector)!).fontSize);
    return {
      section: size(".home-reference-section-head h2"),
      topic: size("[data-home-domain-title]"),
      summary: size("[data-home-domain-summary]"),
      featured: size(".home-reference-featured-card__title"),
      featuredSummary: size(".home-reference-featured-card__summary"),
      recent: size(".home-reference-recent-item__title"),
    };
  });

  expect(sizes.section).toBeGreaterThanOrEqual(28);
  expect(sizes.topic).toBeGreaterThanOrEqual(21);
  expect(sizes.summary).toBeGreaterThanOrEqual(16);
  expect(sizes.featured).toBeGreaterThanOrEqual(32);
  expect(sizes.featuredSummary).toBeGreaterThanOrEqual(17);
  expect(sizes.recent).toBeGreaterThanOrEqual(20);
});

for (const width of [320, 390]) {
  test(`home at ${width}px keeps readable copy, exposed artwork and the complete disclosure`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const signature = page.locator("details[data-home-research-signature]");
    await expect(signature).toHaveCount(1);
    await expect(signature).not.toHaveAttribute("open", "");
    await signature.locator("summary").click();
    await expect(signature).toHaveAttribute("open", "");
    await expect(signature.locator(".home-reference-terminal__line")).toHaveCount(10);
    await expect(signature).toContainText('papers: "/papers"');

    const metrics = await page.evaluate(() => {
      const element = (selector: string) => document.querySelector<HTMLElement>(selector)!;
      const size = (selector: string) => Number.parseFloat(getComputedStyle(element(selector)).fontSize);
      const box = (selector: string) => element(selector).getBoundingClientRect();
      const copy = box(".home-reference-hero__copy");
      const terminal = box(".home-reference-terminal-wrap");
      const body = element(".home-reference-terminal__body");
      return {
        topicsSize: size(".home-reference-hero__topics"),
        descriptionSize: size(".home-reference-hero__description"),
        codeSize: size(".home-reference-terminal__body"),
        firstActionBottom: box(".home-reference-hero__button").bottom + scrollY,
        artworkBand: terminal.top - copy.bottom,
        terminalRight: terminal.right,
        terminalBottom: terminal.bottom,
        heroBottom: box(".home-reference-hero").bottom,
        domainsTop: box("[data-home-domains]").top,
        codeOverflow: body.scrollWidth - body.clientWidth,
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });

    expect(metrics.topicsSize).toBeGreaterThanOrEqual(17);
    expect(metrics.descriptionSize).toBeGreaterThanOrEqual(16);
    expect(metrics.codeSize).toBeGreaterThanOrEqual(14);
    expect(metrics.firstActionBottom).toBeLessThanOrEqual(844);
    expect(metrics.artworkBand).toBeGreaterThanOrEqual(160);
    expect(metrics.terminalRight).toBeLessThanOrEqual(width - 16);
    expect(metrics.terminalBottom).toBeLessThan(metrics.heroBottom);
    expect(metrics.domainsTop).toBeGreaterThan(metrics.terminalBottom);
    expect(metrics.codeOverflow).toBeLessThanOrEqual(0);
    expect(metrics.overflow).toBeLessThanOrEqual(0);
  });
}
