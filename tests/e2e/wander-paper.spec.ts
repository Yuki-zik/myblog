import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

test("reading routes scan as aligned rows with their complete ordered stops", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/map");
  await waitForFontsSettled(page);
  const rows = await page.locator("[data-reading-trail]").evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const heading = element.querySelector("h3")!.getBoundingClientRect();
      const stops = element.querySelector("ol")!.getBoundingClientRect();
      return {
        x: rect.x, top: rect.top, bottom: rect.bottom, width: rect.width,
        headingRight: heading.right, stopsLeft: stops.left,
        stops: element.querySelectorAll("ol a").length,
        minimumStopFont: Math.min(...Array.from(element.querySelectorAll("ol a"), (link) => parseFloat(getComputedStyle(link).fontSize))),
        overflow: element.scrollWidth - element.clientWidth
      };
    })
  );
  expect(rows).toHaveLength(3);
  for (const [index, row] of rows.entries()) {
    expect(row.stops).toBe(3);
    expect(row.minimumStopFont).toBeGreaterThanOrEqual(14);
    expect(row.overflow).toBeLessThanOrEqual(1);
    expect(row.stopsLeft).toBeGreaterThan(row.headingRight + 20);
    if (index) {
      expect(row.top).toBeGreaterThanOrEqual(rows[index - 1].bottom);
      expect(Math.abs(row.x - rows[0].x)).toBeLessThanOrEqual(1);
      expect(Math.abs(row.width - rows[0].width)).toBeLessThanOrEqual(1);
    }
  }
});

test("mobile route numbers and stop counts form a readable horizontal caption above each title", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/map");
  await waitForFontsSettled(page);
  const captions = await page.locator("[data-reading-trail]").evaluateAll((rows) => rows.map((row) => {
    const caption = row.querySelector(".explore-trail__top")!;
    const number = caption.firstElementChild!.getBoundingClientRect();
    const countElement = caption.lastElementChild!;
    const count = countElement.getBoundingClientRect();
    const countStyle = getComputedStyle(countElement);
    const heading = row.querySelector("h3")!.getBoundingClientRect();
    return {
      writingMode: countStyle.writingMode,
      countFontSize: parseFloat(countStyle.fontSize),
      onSameLine: number.top < count.bottom && count.top < number.bottom,
      captionBottom: caption.getBoundingClientRect().bottom,
      headingTop: heading.top
    };
  }));
  for (const caption of captions) {
    expect(caption.writingMode).toBe("horizontal-tb");
    expect(caption.countFontSize).toBeGreaterThanOrEqual(13);
    expect(caption.onSameLine).toBe(true);
    expect(caption.captionBottom).toBeLessThanOrEqual(caption.headingTop);
  }
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

test("mobile open rows keep full labels and the selected reading note usable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/map");
  await page.locator('[data-explore-ready="true"]').waitFor();
  await waitForFontsSettled(page);
  await expect(page.locator(".explore-node-list")).toBeVisible();
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
