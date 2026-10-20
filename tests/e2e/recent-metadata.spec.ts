import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`recent notes keep date and topic aligned at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForFontsSettled(page);
    const rows = page.locator("[data-home-recent-item]");
    await expect(rows).toHaveCount(3);
    await rows.first().scrollIntoViewIfNeeded();
    const geometry = await rows.evaluateAll(elements => elements.map(el => {
      const rect = (selector: string) => {
        const r = el.querySelector(selector)!.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };
      return {
        date: rect(".home-reference-recent-item__date"),
        tag: rect(".home-reference-recent-item__tag"),
        title: rect("h3"),
      };
    }));
    for (const row of geometry) {
      expect(Math.abs(row.tag.x - geometry[0].tag.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(row.title.x - geometry[0].title.x)).toBeLessThanOrEqual(1);
      expect(Math.abs((row.date.y + row.date.height / 2) - (row.tag.y + row.tag.height / 2))).toBeLessThanOrEqual(1);
      expect(row.tag.x).toBeGreaterThanOrEqual(row.date.x + row.date.width + 8);
      if (width > 760) expect(row.title.x).toBeGreaterThanOrEqual(row.tag.x + row.tag.width + 16);
      else expect(row.title.y).toBeGreaterThanOrEqual(row.tag.y + row.tag.height + 6);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await rows.last().click();
    await expect(page).toHaveURL(/\/posts\//);
  });
}
