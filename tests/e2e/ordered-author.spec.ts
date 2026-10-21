import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

test("practice uses its full width with a horizontal chapter head and a bounded asymmetric rhythm", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/author");
  await waitForFontsSettled(page);
  const section = page.locator(".author-atlas-practice");
  const cards = section.locator("[data-practice-dossier]");
  await expect(cards).toHaveCount(4);
  const geometry = await section.evaluate(el => {
    const rect = (node: Element) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    return {
      section: rect(el),
      heading: rect(el.querySelector(".discover-section-head")!),
      group: rect(el.querySelector(".discover-stream-list")!),
      cards: [...el.querySelectorAll("[data-practice-dossier]")].map(rect),
      orders: [...el.querySelectorAll("[data-practice-dossier]")].map(node => getComputedStyle(node).order),
    };
  });
  expect(Math.abs(geometry.heading.width - geometry.section.width)).toBeLessThan(2);
  expect(Math.abs(geometry.group.x - geometry.section.x)).toBeLessThan(2);
  expect(geometry.group.y).toBeGreaterThan(geometry.heading.y + geometry.heading.height);
  expect(geometry.group.y - geometry.heading.y - geometry.heading.height).toBeLessThanOrEqual(48);
  const [a, b, c, d] = geometry.cards;
  expect(a.width / b.width).toBeGreaterThan(1.2);
  expect(a.width / b.width).toBeLessThan(1.8);
  expect(d.width / c.width).toBeGreaterThan(1.2);
  expect(b.y - a.y).toBeGreaterThanOrEqual(16);
  expect(b.y - a.y).toBeLessThanOrEqual(48);
  expect(c.y).toBeGreaterThan(Math.max(a.y + a.height, b.y + b.height));
  expect(geometry.orders).toEqual(["0", "0", "0", "0"]);
});

for (const width of [320, 390, 850]) {
  test(`asymmetric practice remains an ordered readable column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: width === 390 ? "dark" : "light" });
    await page.goto("/author");
    await waitForFontsSettled(page);
    const cards = page.locator("[data-practice-dossier]");
    const boxes = await cards.evaluateAll(nodes => nodes.map(el => {
      const r = el.getBoundingClientRect();
      const title = el.querySelector("h3")!;
      return { x: r.x, y: r.y, bottom: r.bottom, width: r.width, titleSize: parseFloat(getComputedStyle(title).fontSize), overflow: el.scrollWidth - el.clientWidth };
    }));
    for (const [index, box] of boxes.entries()) {
      expect(box.titleSize).toBeGreaterThanOrEqual(24);
      expect(box.overflow).toBeLessThanOrEqual(1);
      expect(Math.abs(box.x - boxes[0].x)).toBeLessThanOrEqual(1);
      if (index) expect(box.y).toBeGreaterThan(boxes[index - 1].bottom);
    }
    const last = cards.last();
    await last.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(last.getByRole("link", { name: "Agent 工程主题" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
