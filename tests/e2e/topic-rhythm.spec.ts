import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

const topicLinks = [
  "/topics/knowledge-network", "/topics/paragraph-review", "/topics/exam-review",
  "/topics/agent-engineering", "/topics/ai-coding",
];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
});

test("topic directory uses a stable wide/narrow rhythm and a full-width final record", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/topics");
  await waitForFontsSettled(page);
  const grid = page.locator(".drawing-topic-index");
  const records = grid.locator(":scope > article");
  await expect(records).toHaveCount(5);
  expect(await grid.locator("[data-drawing-topic]").evaluateAll(elements => elements.map(el => el.getAttribute("href")))).toEqual(topicLinks);
  const geometry = await records.evaluateAll(elements => elements.map(el => {
    const { x, y, width, bottom } = el.getBoundingClientRect();
    return { x, y, width, bottom };
  }));
  const gridBox = (await grid.boundingBox())!;
  expect(geometry[0].width).toBeGreaterThan(geometry[1].width * 1.25);
  expect(geometry[3].width).toBeGreaterThan(geometry[2].width * 1.25);
  expect(geometry[1].y - geometry[0].y).toBeCloseTo(24, 0);
  expect(geometry[3].y - geometry[2].y).toBeCloseTo(24, 0);
  expect(geometry[2].y).toBeGreaterThanOrEqual(Math.max(geometry[0].bottom, geometry[1].bottom));
  expect(geometry[4].width).toBeCloseTo(gridBox.width, 0);
  expect(geometry[4].x).toBeCloseTo(gridBox.x, 0);
  await expect(page.locator("a a")).toHaveCount(0);
});

test("topic detail leads with a full reading record before paired supporting notes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/topics/knowledge-network");
  await waitForFontsSettled(page);
  const grid = page.locator("[data-topic-posts] .discover-post-grid");
  const cards = grid.locator("[data-post-card]");
  await expect(cards).toHaveCount(3);
  const box = (await grid.boundingBox())!;
  const records = await cards.evaluateAll(elements => elements.map(el => {
    const { x, y, width, bottom } = el.getBoundingClientRect();
    return { x, y, width, bottom };
  }));
  expect(records[0].width).toBeCloseTo(box.width, 0);
  expect(records[0].x).toBeCloseTo(box.x, 0);
  expect(records[1].y).toBeGreaterThanOrEqual(records[0].bottom);
  expect(records[1].width).toBeGreaterThan(records[2].width * 1.25);
  for (const card of await cards.all()) {
    const text = (await card.locator(".post-card-body").boundingBox())!;
    const cover = (await card.locator(".post-card-cover-link").boundingBox())!;
    expect(text.width).toBeGreaterThan(cover.width * 1.6);
    await expect(card.locator(".post-card-title a")).toHaveAttribute("href", /^\/posts\//);
  }
});

for (const slug of ["ai-coding", "exam-review", "agent-engineering"]) {
  test(`single-note topic ${slug} uses its available reading width`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto(`/topics/${slug}`);
    await waitForFontsSettled(page);
    const grid = page.locator("[data-topic-posts] .discover-post-grid");
    const card = grid.locator("[data-post-card]");
    await expect(card).toHaveCount(1);
    const gridBox = (await grid.boundingBox())!;
    const cardBox = (await card.boundingBox())!;
    expect(cardBox.width).toBeCloseTo(gridBox.width, 0);
    const copy = (await card.locator(".post-card-body").boundingBox())!;
    expect(copy.width).toBeGreaterThanOrEqual(600);
    await expect(card.locator(".post-card-title a")).toHaveAttribute("href", /^\/posts\//);
  });
}

for (const width of [320, 390, 1100]) {
  test(`topic records keep source order and complete text in one column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/topics", "/topics/knowledge-network"]) {
      await page.goto(route);
      await waitForFontsSettled(page);
      const records = page.locator(route === "/topics" ? ".drawing-topic-index > article" : "[data-topic-posts] [data-post-card]");
      const boxes = await records.evaluateAll(elements => elements.map(el => {
        const { x, y, right, bottom } = el.getBoundingClientRect();
        return { x, y, right, bottom };
      }));
      for (let index = 1; index < boxes.length; index++) {
        expect(boxes[index].x).toBeCloseTo(boxes[0].x, 0);
        expect(boxes[index].right).toBeCloseTo(boxes[0].right, 0);
        expect(boxes[index].y).toBeGreaterThanOrEqual(boxes[index - 1].bottom);
      }
      const copy = page.locator(route === "/topics" ? ".drawing-topic-row__summary, .drawing-topic-row__rationale" : ".post-card-title a, .post-card-summary");
      for (const node of await copy.all()) {
        expect(await node.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
        expect(await node.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    }
  });
}
