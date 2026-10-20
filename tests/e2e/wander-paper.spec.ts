import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

test("the relationship map is the desktop first-screen subject, with reading trails after it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/map");
  await page.locator('[data-explore-ready="true"]').waitFor();
  await waitForFontsSettled(page);
  const composition = await page.evaluate(() => {
    const workspace = document.querySelector(".explore-workspace")!.getBoundingClientRect();
    const map = document.querySelector(".explore-map")!.getBoundingClientRect();
    const trails = document.querySelector(".explore-trails")!.getBoundingClientRect();
    const visibleNodes = Array.from(document.querySelectorAll(".explore-map__node")).filter((node) => {
      const box = node.getBoundingClientRect();
      return box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
    }).length;
    return { mapTop: map.top, mapWidth: map.width, workspaceWidth: workspace.width,
      workspaceBottom: workspace.bottom, trailsTop: trails.top, visibleNodes };
  });
  expect(composition.mapTop).toBeLessThan(400);
  expect(composition.mapWidth / composition.workspaceWidth).toBeGreaterThan(.65);
  expect(composition.visibleNodes).toBeGreaterThanOrEqual(3);
  expect(composition.trailsTop).toBeGreaterThanOrEqual(composition.workspaceBottom);
  await expect(page.locator(".explore-inspector h3")).toBeInViewport();
  await expect(page.locator("[data-reading-trail] ol a")).toHaveCount(9);
  const labelClearances = await page.locator(".explore-map__node").evaluateAll((nodes) => nodes.map((node) => {
    const paper = node.querySelector<SVGRectElement>(".explore-map__node-paper")!.getBBox();
    const label = node.querySelector<SVGTextElement>(".explore-map__node-title")!.getBBox();
    return { left: label.x - paper.x, right: paper.x + paper.width - label.x - label.width };
  }));
  for (const clearance of labelClearances) {
    expect(clearance.left).toBeGreaterThanOrEqual(26);
    expect(clearance.right).toBeGreaterThanOrEqual(8);
  }
});

test("reading paths remain a compact secondary directory with accessible descriptions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/map");
  await waitForFontsSettled(page);
  const rows = await page.locator("[data-reading-trail]").evaluateAll((elements) => elements.map((element) => ({
    height: element.getBoundingClientRect().height,
    overflow: element.scrollWidth - element.clientWidth,
    minimumStopFont: Math.min(...Array.from(element.querySelectorAll("ol a"), (link) => parseFloat(getComputedStyle(link).fontSize)))
  })));
  expect(rows).toHaveLength(3);
  for (const row of rows) {
    expect(row.height).toBeLessThanOrEqual(160);
    expect(row.minimumStopFont).toBeGreaterThanOrEqual(14);
    expect(row.overflow).toBeLessThanOrEqual(1);
  }
  const description = page.locator("[data-reading-trail] details").first();
  await description.locator("summary").click();
  await expect(description.locator("p")).toBeVisible();
  await expect(description.locator("p")).toContainText("一次限时开发复盘");
});

for (const scheme of ["light", "dark"] as const) {
  test(`paper route titles and stops remain readable in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto("/map");
    await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
    const contrastRatios = await page.locator("[data-reading-trail] :is(h3 a, ol a)").evaluateAll((links) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      const luminance = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3)
          .map((v) => v / 255)
          .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
          .reduce((total, v, i) => total + v * [0.2126, 0.7152, 0.0722][i], 0);
      };
      return links.map((link) => {
        let ancestor: Element | null = link;
        let background = "rgb(255, 255, 255)";
        while (ancestor) {
          const value = getComputedStyle(ancestor).backgroundColor;
          if (value !== "rgba(0, 0, 0, 0)" && value !== "transparent") {
            background = value;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        const foreground = luminance(getComputedStyle(link).color);
        const backdrop = luminance(background);
        return (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05);
      });
    });
    expect(contrastRatios).toHaveLength(12);
    for (const ratio of contrastRatios) expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
}

test("mobile starts with readable content immediately after the compact heading", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/map");
  await page.locator('[data-explore-ready="true"]').waitFor();
  await waitForFontsSettled(page);
  await expect(page.locator(".explore-node-list")).toBeVisible();
  const firstItem = await page.locator(".explore-node-list > button").first().boundingBox();
  expect(firstItem!.y).toBeLessThan(600);
  await expect(page.locator(".explore-node-list > button").first()).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  const stops = page.locator("[data-reading-trail] ol a");
  for (const stop of await stops.all()) {
    const size = await stop.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      fontSize: parseFloat(getComputedStyle(element).fontSize),
      overflow: element.scrollWidth - element.clientWidth
    }));
    expect(size.height).toBeGreaterThanOrEqual(44);
    expect(size.fontSize).toBeGreaterThanOrEqual(15);
    expect(size.overflow).toBeLessThanOrEqual(1);
  }
  await page.getByRole("searchbox", { name: "搜索漫游内容" }).fill("蚂蚁");
  await page.locator(".explore-node-list > button").click();
  await expect(page.locator(".explore-inspector h3")).toHaveText("蚂蚁 AI Coding 笔试复盘");
  await expect(page.locator(".explore-inspector__read")).toHaveAttribute("href", "/posts/ant-ai-coding-review");
  const note = await page.locator(".explore-inspector").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, overflow: element.scrollWidth - element.clientWidth };
  });
  expect(note.left).toBeGreaterThanOrEqual(8);
  expect(note.right).toBeLessThanOrEqual(312);
  expect(note.overflow).toBeLessThanOrEqual(1);
});
