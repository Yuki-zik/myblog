import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

for (const width of [1440, 390, 320]) {
  test(`archive dossiers preserve chronology and give each article a readable publication plate at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width > 600 ? 960 : 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/archives");
    await waitForFontsSettled(page);

    const records = page.locator("[data-archive-card]");
    await expect(records).toHaveCount(4);
    const dates = await records.locator("[data-archive-date]").allTextContents();
    expect(dates).toEqual([...dates].sort().reverse());
    expect((await records.first().locator("h3").boundingBox())!.y).toBeLessThan(width > 600 ? 500 : 620);

    for (const record of await records.all()) {
      const cover = record.locator(".archive-post-media");
      const copy = record.locator(".archive-post-content");
      const title = copy.locator("h3 a");
      const href = await title.getAttribute("href");
      await expect(cover).toHaveAttribute("href", href!);
      await expect(record.locator(".archive-post-kicker")).toHaveAttribute("href", href!);
      await expect(record.locator("[data-archive-author]")).toContainText("By");
      // Covers retain the original paired artwork instead of invented decoration.
      const main = cover.locator(".post-cover-img--main");
      const ghost = cover.locator(".post-cover-img--ghost");
      expect(await main.getAttribute("src")).toBe(await ghost.getAttribute("src"));
      expect(await main.evaluate(el => getComputedStyle(el).objectFit)).toBe("contain");
      const dimensions = await record.evaluate((el) => {
        const box = (selector: string) => {
          const rect = el.querySelector(selector)!.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        };
        const main = box(".content-dossier__main");
        const media = box(".archive-post-media");
        const copy = box(".archive-post-content");
        return { main, media, copy, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
      });
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
      if (width > 600) {
        expect(dimensions.media.width / dimensions.main.width).toBeGreaterThan(0.18);
        expect(dimensions.copy.x).toBeGreaterThan(dimensions.media.x + dimensions.media.width);
      } else {
        // The title leads on a phone; a large cover must not hide its identity.
        expect(dimensions.copy.y + dimensions.copy.height).toBeLessThan(dimensions.media.y);
        expect(dimensions.copy.width).toBeGreaterThan(210);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}

test("archive reading actions remain separate keyboard links on a paper record", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/archives");
  const record = page.locator("[data-archive-card]").first();
  const title = record.locator("h3 a");
  const href = await title.getAttribute("href");
  expect(await record.evaluate(el => el.closest("a") === null)).toBe(true);
  await expect(record.locator("a a")).toHaveCount(0);
  await title.focus();
  await expect(title).toBeFocused();
  expect(await title.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(href!);
});
