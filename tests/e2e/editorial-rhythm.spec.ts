import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

for (const width of [1440, 1920]) {
  test(`author chapters use the full content measure without a heading-only side column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/author");
    await waitForFontsSettled(page);

    for (const [id, group] of [["research", ".discover-entity-grid"], ["writing", ".discover-post-grid"]]) {
      const geometry = await page.locator(`#${id}`).evaluate((el, selector) => {
        const box = (node: Element) => {
          const r = node.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, bottom: r.bottom };
        };
        return { section: box(el), head: box(el.querySelector(".discover-section-head")!), content: box(el.querySelector(selector)!) };
      }, group);
      expect(Math.abs(geometry.head.width - geometry.section.width)).toBeLessThan(2);
      expect(Math.abs(geometry.content.x - geometry.section.x)).toBeLessThan(2);
      expect(Math.abs(geometry.content.width - geometry.section.width)).toBeLessThan(2);
      expect(geometry.content.y).toBeGreaterThan(geometry.head.bottom);
      expect(geometry.content.y - geometry.head.bottom).toBeLessThanOrEqual(52);
    }

    const writing = await page.locator("#writing .post-card").evaluateAll(nodes => nodes.map(node => {
      const r = node.getBoundingClientRect();
      return { width: r.width, top: r.top, bottom: r.bottom };
    }));
    expect(writing[0].width / writing[1].width).toBeGreaterThan(1.2);
    expect(writing[0].width / writing[1].width).toBeLessThan(1.8);
    expect(writing[1].top - writing[0].top).toBeGreaterThanOrEqual(16);
    expect(writing[1].top - writing[0].top).toBeLessThanOrEqual(40);
    expect(writing[2].top).toBeGreaterThan(Math.max(writing[0].bottom, writing[1].bottom));
  });
}

test("research and writing return to uninterrupted source order on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/author");
  await waitForFontsSettled(page);
  for (const selector of ["#research .discover-entity-card", "#writing .post-card"]) {
    const boxes = await page.locator(selector).evaluateAll(nodes => nodes.map(node => {
      const r = node.getBoundingClientRect();
      return { x: r.x, top: r.top, bottom: r.bottom, width: r.width, overflow: node.scrollWidth - node.clientWidth };
    }));
    for (const [index, box] of boxes.entries()) {
      expect(box.width).toBeGreaterThan(330);
      expect(box.overflow).toBeLessThanOrEqual(1);
      if (index) {
        expect(Math.abs(box.x - boxes[0].x)).toBeLessThan(2);
        expect(box.top).toBeGreaterThan(boxes[index - 1].bottom);
      }
    }
  }
  await expect(page.locator("#research .editorial-figure")).toHaveCount(3);
  await expect(page.locator("#writing .post-card")).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
