import { expect, test, type Locator } from "@playwright/test";

async function fontSize(locator: Locator) {
  return locator.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
}

async function expectUnclipped(locator: Locator) {
  for (const node of await locator.all()) {
    expect(await node.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
  }
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("theme-preference", "light"));
});

test("topic names, descriptions and counts form readable content groups", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/topics");
  const rows = page.locator("[data-drawing-topic]");
  await expect(rows).toHaveCount(5);
  expect((await rows.first().boundingBox())!.y).toBeLessThanOrEqual(420);

  for (const row of await rows.all()) {
    const title = row.locator(".drawing-topic-row__title");
    const summary = row.locator(".drawing-topic-row__summary");
    const count = row.locator(".drawing-topic-row__count");
    expect(await fontSize(title)).toBeGreaterThanOrEqual(28);
    expect(await fontSize(summary)).toBeGreaterThanOrEqual(17);
    expect(await fontSize(count)).toBeGreaterThanOrEqual(14);
    const titleBox = (await title.boundingBox())!;
    const summaryBox = (await summary.boundingBox())!;
    const countBox = (await count.boundingBox())!;
    expect(Math.abs(titleBox.x - summaryBox.x), "description aligns with its topic name").toBeLessThanOrEqual(2);
    expect(summaryBox.y - titleBox.y - titleBox.height, "description follows its name as one group").toBeGreaterThanOrEqual(0);
    expect(summaryBox.y - titleBox.y - titleBox.height).toBeLessThanOrEqual(16);
    expect(countBox.x - titleBox.x - titleBox.width, "article count stays beside its topic name").toBeLessThanOrEqual(36);
    const rationale = (await row.locator(".drawing-topic-row__rationale").boundingBox())!;
    expect((await row.boundingBox())!.height, "the text entry follows its content, alongside the image plate").toBeLessThanOrEqual(titleBox.height + summaryBox.height + countBox.height + rationale.height + (await row.locator(".drawing-topic-row__number").boundingBox())!.height + (await row.locator(".drawing-topic-row__read").boundingBox())!.height + 64);
    await expectUnclipped(summary);
  }
});

test("topic directory keeps reading order across its wide two-column layout", async ({ page }) => {
  const expectedLinks = [
    "/topics/knowledge-network",
    "/topics/paragraph-review",
    "/topics/exam-review",
    "/topics/agent-engineering",
    "/topics/ai-coding",
  ];

  for (const width of [1099, 1100, 1728]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/topics");
    const rows = page.locator("[data-drawing-topic]");
    await expect(rows).toHaveCount(expectedLinks.length);
    expect(await rows.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")))).toEqual(expectedLinks);
    const boxes = await rows.evaluateAll((nodes) => nodes.map((node) => {
      const { x, y, right, bottom } = node.getBoundingClientRect();
      return { x, y, right, bottom };
    }));

    if (width < 1100) {
      expect(Math.abs(boxes[1].x - boxes[0].x), "narrow directory remains one column").toBeLessThanOrEqual(1);
      expect(boxes[1].y).toBeGreaterThanOrEqual(boxes[0].bottom - 1);
    } else {
      expect(Math.abs(boxes[1].y - boxes[0].y), `${width}px first two topics share a row`).toBeLessThanOrEqual(1);
      expect(boxes[1].x).toBeGreaterThan(boxes[0].right);
      expect(Math.abs(boxes[2].x - boxes[0].x), "third topic starts the next row in reading order").toBeLessThanOrEqual(1);
      expect(boxes[2].y).toBeGreaterThanOrEqual(Math.max(boxes[0].bottom, boxes[1].bottom) - 1);
      expect(Math.abs(boxes[3].y - boxes[2].y), "fourth topic follows the third horizontally").toBeLessThanOrEqual(1);
      expect(Math.abs(boxes[4].x - boxes[0].x), "last topic stays in the first column").toBeLessThanOrEqual(1);
      expect(boxes[4].y).toBeGreaterThanOrEqual(Math.max(boxes[2].bottom, boxes[3].bottom) - 1);
    }
  }
});

test("topic reading cards give titles and summaries enough text space", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/topics/knowledge-network");
  const cards = page.locator("[data-topic-posts] [data-post-card]");
  await expect(cards).toHaveCount(3);
  expect((await cards.first().locator("h3").boundingBox())!.y).toBeLessThanOrEqual(540);
  for (const card of await cards.all()) {
    expect(await fontSize(card.locator(".post-card-title"))).toBeGreaterThanOrEqual(24);
    expect(await fontSize(card.locator(".post-card-summary"))).toBeGreaterThanOrEqual(17);
    expect(await fontSize(card.locator(".post-card-meta-row"))).toBeGreaterThanOrEqual(14);
    const content = (await card.locator(".post-card-body").boundingBox())!;
    const cover = (await card.locator(".post-card-cover-link").boundingBox())!;
    expect(content.width).toBeGreaterThan(cover.width * 1.6);
    await expectUnclipped(card.locator(".post-card-title a, .post-card-summary"));
  }
});

test("paper records expose full authors and readable resources alongside long titles", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/papers");
  const papers = page.locator("[data-paper-card]");
  await expect(papers).toHaveCount(2);
  expect((await papers.first().locator("h3").boundingBox())!.y).toBeLessThanOrEqual(460);
  for (const paper of await papers.all()) {
    expect(await fontSize(paper.locator("h3"))).toBeGreaterThanOrEqual(26);
    expect(await fontSize(paper.locator(".paper-index-row__authors"))).toBeGreaterThanOrEqual(16);
    expect(await fontSize(paper.locator(".paper-index-row__summary"))).toBeGreaterThanOrEqual(17);
    expect(await fontSize(paper.locator(".paper-resource-link").first())).toBeGreaterThanOrEqual(16);
    await expectUnclipped(paper.locator("h3, .paper-index-row__authors, .paper-index-row__summary"));
  }
});

test("archive ledger balances its image plates with readable article copy", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/archives");
  const cards = page.locator("[data-archive-card]");
  await expect(cards).toHaveCount(4);
  expect((await cards.first().locator("h3").boundingBox())!.y).toBeLessThanOrEqual(500);
  for (const card of await cards.all()) {
    expect(await fontSize(card.locator("h3"))).toBeGreaterThanOrEqual(24);
    expect(await fontSize(card.locator(".archive-post-summary"))).toBeGreaterThanOrEqual(17);
    expect(await fontSize(card.locator(".archive-post-meta"))).toBeGreaterThanOrEqual(14);
    const cover = (await card.locator(".archive-post-media").boundingBox())!;
    const content = (await card.locator(".archive-post-content").boundingBox())!;
    expect(cover.width).toBeGreaterThanOrEqual(144);
    expect(cover.width).toBeLessThanOrEqual(240);
    expect(content.width).toBeGreaterThan(cover.width * 2.8);
  }
});

for (const width of [390, 320]) {
  test(`index typography stays readable and complete at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const surfaces = [
      { path: "/topics", title: ".drawing-topic-row__title", copy: ".drawing-topic-row__summary" },
      { path: "/topics/knowledge-network", title: ".post-card-title", copy: ".post-card-summary" },
      { path: "/papers", title: ".paper-index-row__main h3", copy: ".paper-index-row__summary" },
      { path: "/archives", title: ".archive-post-content h3", copy: ".archive-post-summary" },
    ];
    for (const surface of surfaces) {
      await page.goto(surface.path);
      const title = page.locator(surface.title).first();
      const copy = page.locator(surface.copy).first();
      await expect(title).toBeVisible();
      expect(await fontSize(title), `${surface.path} title`).toBeGreaterThanOrEqual(22);
      expect(await fontSize(copy), `${surface.path} copy`).toBeGreaterThanOrEqual(16);
      await expectUnclipped(page.locator(surface.copy));
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), surface.path).toBeLessThanOrEqual(0);
    }
  });
}
