import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

for (const width of [320, 390, 1024, 1440]) {
  test(`author dossier keeps portrait, identity, and research readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/author");
    await waitForFontsSettled(page);

    const dossier = page.getByRole("complementary", { name: "作者档案" });
    const avatar = dossier.locator(".author-avatar");
    const portrait = await avatar.boundingBox();
    const paper = await dossier.boundingBox();
    expect(portrait).not.toBeNull();
    expect(paper).not.toBeNull();
    // A portrait supports identity; a large empty drawing frame must not dominate it.
    expect(portrait!.width).toBeGreaterThanOrEqual(88);
    expect(portrait!.width).toBeLessThanOrEqual(160);
    expect(paper!.height).toBeLessThan(570);
    await expect(dossier.locator(".author-atlas-idcard__title")).toBeVisible();
    await expect(dossier.locator(".author-atlas-idcard__mission")).toBeVisible();
    await expect(dossier.locator(".discover-hero__panel-stat")).toHaveCount(4);
    expect(await dossier.evaluate(el => getComputedStyle(el).boxShadow)).not.toBe("none");

    const tracks = page.locator(".author-atlas-research .discover-entity-card");
    await expect(tracks).toHaveCount(3);
    await expect(tracks.locator(".pill-list li")).toHaveCount(9);
    const rows = await tracks.evaluateAll(elements => elements.map(el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, bottom: rect.bottom, width: rect.width };
    }));
    // Full-width numbered entries keep the summaries readable instead of three narrow columns.
    expect(rows[1].y).toBeGreaterThanOrEqual(rows[0].bottom - 1);
    expect(rows[2].y).toBeGreaterThanOrEqual(rows[1].bottom - 1);
    expect(Math.abs(rows[0].x - rows[2].x)).toBeLessThan(1);
    if (width >= 1024) {
      const summaryWidth = await tracks.first().locator("p").evaluate(el => el.getBoundingClientRect().width);
      expect(summaryWidth).toBeGreaterThan(300);
    }

    const firstPaper = page.locator(".author-atlas-publication__content h3 a").first();
    await expect(firstPaper).toHaveAttribute("href", /\/papers\/duap-/);
    expect(await firstPaper.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.right <= document.documentElement.clientWidth;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
