import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

for (const width of [320, 390, 1024, 1440]) {
  test(`author frontispiece prioritizes portrait, identity, and real work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/author");
    await waitForFontsSettled(page);

    const hero = page.locator("[data-discover-hero]");
    const margin = page.getByRole("complementary", { name: "作者档案" });
    const avatar = hero.locator(".author-avatar");
    // A reserved image box can pass geometry checks while its pixels are still blank.
    await expect.poll(() => avatar.evaluate(el =>
      el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0 && el.naturalHeight > 0
    )).toBe(true);
    await avatar.evaluate(el => (el as HTMLImageElement).decode());
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveCSS("opacity", "1");
    const portrait = await avatar.boundingBox();
    expect(portrait).not.toBeNull();
    // The portrait is an independent photographic surface, not a tiny avatar in an info card.
    expect(portrait!.width).toBeGreaterThanOrEqual(width >= 1024 ? 230 : 175);
    expect(portrait!.width).toBeLessThanOrEqual(310);
    expect(await margin.evaluate(el => getComputedStyle(el).boxShadow)).toBe("none");
    expect(await hero.locator(".author-portrait").evaluate(el => getComputedStyle(el).boxShadow)).not.toBe("none");
    await expect(hero.locator(".author-atlas-idcard__title")).toBeVisible();
    await expect(hero.locator(".author-atlas-idcard__mission")).toBeVisible();
    await expect(margin.locator(".discover-hero__panel-stat")).toHaveCount(4);
    const featured = hero.locator(".author-atlas-featured h3 a");
    await expect(featured).toHaveAttribute("href", /\/papers\/duap-/);
    if (width >= 1024) {
      // A real publication must be available on the first screen, before the long biography.
      await expect(featured).toBeInViewport();
      const name = await hero.locator("h1").boundingBox();
      const copy = await hero.locator(".author-atlas-hero__main").boundingBox();
      expect(name!.width).toBeGreaterThan(copy!.width);
    }

    const tracks = page.locator(".author-atlas-research .discover-entity-card");
    await expect(tracks).toHaveCount(3);
    await expect(tracks.locator(".pill-list li")).toHaveCount(9);
    const rows = await tracks.evaluateAll(elements => elements.map(el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, bottom: rect.bottom, width: rect.width };
    }));
    if (width > 1100) {
      const secondHeading = await tracks.nth(1).locator("h3").boundingBox();
      const thirdHeading = await tracks.nth(2).locator("h3").boundingBox();
      expect(secondHeading!.y).toBeLessThan(thirdHeading!.y);
      // A wide opening track and a pair of offset notes replace the repeated full-width table.
      expect(rows[0].width).toBeGreaterThan(rows[1].width * 1.6);
      expect(rows[2].x).toBeGreaterThan(rows[1].x + rows[1].width);
      expect(rows[2].y).toBeGreaterThan(rows[1].y + 20);
      const summaryWidth = await tracks.first().locator(".author-atlas-track__copy > p").evaluate(el => el.getBoundingClientRect().width);
      expect(summaryWidth).toBeGreaterThan(300);
    } else {
      expect(rows[1].y).toBeGreaterThanOrEqual(rows[0].bottom - 1);
      expect(rows[2].y).toBeGreaterThanOrEqual(rows[1].bottom - 1);
      for (const row of rows) expect(Math.abs(row.width - rows[0].width)).toBeLessThan(2);
    }
    const sectionHead = (await page.locator(".author-atlas-research > .discover-section-head").boundingBox())!;
    expect(Math.abs(sectionHead.x - rows[0].x)).toBeLessThan(2);
    expect(Math.abs(sectionHead.width - rows[0].width)).toBeLessThan(2);
    expect(sectionHead.y + sectionHead.height).toBeLessThan(rows[0].y);

    const firstPaper = page.locator(".author-atlas-publication__content h3 a").first();
    await expect(firstPaper).toHaveAttribute("href", /\/papers\/duap-/);
    expect(await firstPaper.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.right <= document.documentElement.clientWidth;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
