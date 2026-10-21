import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

for (const width of [1440, 390, 320]) {
  test(`archive posters keep their intrinsic artwork and horizontal year order at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width > 600 ? 960 : 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/archives");
    await waitForFontsSettled(page);

    const records = page.locator("[data-archive-card]");
    await expect(records).toHaveCount(4);
    expect((await records.first().locator("h3").boundingBox())!.y).toBeLessThanOrEqual(width > 600 ? 500 : 620);
    const dates = await records.locator("[data-archive-date]").allTextContents();
    expect(dates).toEqual([...dates].sort().reverse());
    const months = await page.locator("[data-archive-month]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-archive-month")));
    expect(months).toEqual([...months].sort().reverse());

    for (const year of await page.locator("[data-archive-year]").all()) {
      const geometry = await year.evaluate(el => {
        const section = el.getBoundingClientRect();
        const header = el.querySelector(".archive-year-tile")!.getBoundingClientRect();
        const content = el.querySelector(".archive-year-content")!.getBoundingClientRect();
        return {
          yearColumns: getComputedStyle(el).gridTemplateColumns.split(" ").length,
          leftGap: content.left - section.left,
          headerBottom: header.bottom,
          contentTop: content.top,
          headerWidth: header.width,
          contentWidth: content.width,
        };
      });
      expect(geometry.yearColumns).toBe(1);
      expect(Math.abs(geometry.leftGap)).toBeLessThanOrEqual(1);
      expect(geometry.headerBottom).toBeLessThanOrEqual(geometry.contentTop);
      expect(Math.abs(geometry.headerWidth - geometry.contentWidth)).toBeLessThanOrEqual(1);
      const count = await year.locator("[data-archive-card]").count();
      await expect(year.locator("[data-archive-year-count]")).toHaveText(`${String(count).padStart(2, "0")} 篇文章`);
    }

    for (const record of await records.all()) {
      const poster = record.locator('[data-post-cover="poster"]');
      const image = poster.locator(".post-cover-img--main");
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
      const metrics = await poster.evaluate(el => {
        const image = el.querySelector<HTMLImageElement>(".post-cover-img--main")!;
        const posterBox = el.getBoundingClientRect();
        const imageBox = image.getBoundingClientRect();
        const styles = [getComputedStyle(el), getComputedStyle(image)];
        return {
          intrinsicRatio: image.naturalWidth / image.naturalHeight,
          attributeRatio: Number(image.getAttribute("width")) / Number(image.getAttribute("height")),
          width: imageBox.width,
          height: imageBox.height,
          frameWidth: posterBox.width - imageBox.width,
          frameHeight: posterBox.height - imageBox.height,
          aspectRatio: getComputedStyle(el).aspectRatio,
          hasFrame: styles.some(style => Number.parseFloat(style.borderTopWidth) > 0 || Number.parseFloat(style.paddingTop) > 0),
          backgrounds: styles.map(style => style.backgroundColor),
        };
      });
      expect(metrics.width).toBeGreaterThan(200);
      expect(Math.abs(metrics.width / metrics.height - metrics.intrinsicRatio)).toBeLessThan(0.01);
      expect(Math.abs(metrics.attributeRatio - metrics.intrinsicRatio)).toBeLessThan(0.01);
      expect(Math.abs(metrics.frameWidth)).toBeLessThanOrEqual(1);
      expect(Math.abs(metrics.frameHeight)).toBeLessThanOrEqual(1);
      expect(metrics.aspectRatio).toBe("auto");
      expect(metrics.hasFrame).toBe(false);
      expect(metrics.backgrounds).toEqual(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"]);
      await expect(poster.locator(".post-cover-img--ghost")).toHaveCount(1);
      await expect(record.locator(".archive-post-media")).toHaveAttribute("href", (await record.locator("h3 a").getAttribute("href"))!);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}

test("intrinsic archive posters keep native keyboard reading links and reduced-motion support", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/archives");
  const record = page.locator("[data-archive-card]").first();
  const coverLink = record.locator(".archive-post-media");
  const href = await coverLink.getAttribute("href");
  const restingShadow = await coverLink.evaluate(el => getComputedStyle(el).boxShadow);
  await coverLink.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(coverLink).toBeFocused();
  const focus = await coverLink.evaluate(el => ({ visible: el.matches(":focus-visible"), outline: getComputedStyle(el).outlineStyle, shadow: getComputedStyle(el).boxShadow }));
  expect(focus.visible).toBe(true);
  // The shared site indicator is a ring shadow for this link, not an outline.
  expect(focus.outline !== "none" || (focus.shadow !== "none" && focus.shadow !== restingShadow)).toBe(true);
  await coverLink.hover();
  expect(await record.locator(".post-cover-img--main").evaluate(el => getComputedStyle(el).transform)).toBe("none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(href!);
});
