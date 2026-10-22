import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

for (const width of [1440, 1100, 390]) {
  test(`recent articles use a leading record and aligned horizontal metadata at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForFontsSettled(page);
    const stream = page.locator("[data-home-recent-posts] [data-editorial-grid]");
    const records = stream.locator("[data-home-recent-item]");
    await expect(records).toHaveCount(3);
    const layout = await stream.evaluate(el => {
      const box = (node: Element) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width };
      };
      return { group: box(el), records: [...el.children].map(box) };
    });
    expect(Math.abs(layout.records[0].width - layout.group.width)).toBeLessThan(2);
    if (width > 1100) {
      expect(layout.records[1].width / layout.records[2].width).toBeGreaterThan(1.2);
      expect(layout.records[1].width / layout.records[2].width).toBeLessThan(1.8);
      expect(layout.records[2].x).toBeGreaterThan(layout.records[1].right);
      expect(layout.records[2].top - layout.records[1].top).toBeGreaterThanOrEqual(22);
      expect(layout.records[2].top - layout.records[1].top).toBeLessThanOrEqual(26);
      expect(layout.records[1].top).toBeGreaterThan(layout.records[0].bottom);
    } else {
      for (const [index, record] of layout.records.entries()) {
        expect(Math.abs(record.width - layout.group.width)).toBeLessThan(2);
        expect(Math.abs(record.x - layout.group.x)).toBeLessThan(2);
        if (index) expect(record.top).toBeGreaterThan(layout.records[index - 1].bottom);
      }
    }
    for (const record of await records.all()) {
      await expect(record.locator(".content-dossier__leading")).toHaveCount(0);
      const metadata = await record.evaluate(el => {
        const date = el.querySelector(".home-reference-recent-item__date")!.getBoundingClientRect();
        const topic = el.querySelector(".home-reference-recent-item__tag")!.getBoundingClientRect();
        const meta = el.querySelector(".content-dossier__meta")!.getBoundingClientRect();
        const main = el.querySelector(".content-dossier__main")!.getBoundingClientRect();
        return { dateRight: date.right, topicLeft: topic.left, metaBottom: meta.bottom, mainTop: main.top, overflow: el.scrollWidth - el.clientWidth };
      });
      expect(metadata.topicLeft).toBeGreaterThan(metadata.dateRight);
      expect(metadata.metaBottom).toBeLessThanOrEqual(metadata.mainTop);
      expect(metadata.overflow).toBeLessThanOrEqual(1);
    }
    expect(await records.evaluateAll(nodes => nodes.map(node => node.getAttribute("href")))).toEqual([
      "/posts/ant-ai-coding-review", "/posts/paragraph-anchor-design", "/posts/why-topic-first",
    ]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });

  test(`archive month pairs keep chronological order and complete intrinsic posters at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/archives");
    await waitForFontsSettled(page);
    const records = page.locator("[data-archive-card]");
    await expect(records).toHaveCount(4);
    expect((await records.first().locator("h3").boundingBox())!.y).toBeLessThanOrEqual(width > 600 ? 500 : 620);
    const dates = await records.locator("[data-archive-date]").allTextContents();
    expect(dates).toEqual([...dates].sort().reverse());
    for (const month of await page.locator(".archive-grid").all()) {
      const layout = await month.evaluate(el => {
        const box = (node: Element) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.x, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width };
        };
        return { group: box(el), records: [...el.children].map(box) };
      });
      if (width > 1100 && layout.records.length > 1) {
        expect(layout.records[0].width / layout.records[1].width).toBeGreaterThan(1.2);
        expect(layout.records[0].width / layout.records[1].width).toBeLessThan(1.8);
        expect(layout.records[1].x).toBeGreaterThan(layout.records[0].right);
        expect(layout.records[1].top - layout.records[0].top).toBeGreaterThanOrEqual(22);
        expect(layout.records[1].top - layout.records[0].top).toBeLessThanOrEqual(26);
      } else {
        for (const [index, record] of layout.records.entries()) {
          expect(Math.abs(record.width - layout.group.width)).toBeLessThan(2);
          if (index) expect(record.top).toBeGreaterThan(layout.records[index - 1].bottom);
        }
      }
    }
    const posters = await records.locator(".post-cover-img--main").evaluateAll(images => images.map(node => {
      const image = node as HTMLImageElement;
      const box = image.getBoundingClientRect();
      return { ratio: box.width / box.height, sourceRatio: Number(image.getAttribute("width")) / Number(image.getAttribute("height")), border: getComputedStyle(image).borderTopWidth };
    }));
    for (const poster of posters) {
      expect(Math.abs(poster.ratio - poster.sourceRatio)).toBeLessThan(.01);
      expect(poster.border).toBe("0px");
    }
    for (const record of await records.all()) {
      const geometry = await record.evaluate(el => {
        const copy = el.querySelector(".archive-post-content")!.getBoundingClientRect();
        const media = el.querySelector(".archive-post-media")!.getBoundingClientRect();
        return { width: el.clientWidth, copyWidth: copy.width, copyLeft: copy.left, copyBottom: copy.bottom, mediaLeft: media.left, mediaTop: media.top, mediaRight: media.right };
      });
      if (geometry.width <= 768) {
        expect(Math.abs(geometry.copyLeft - geometry.mediaLeft)).toBeLessThan(2);
        expect(geometry.copyBottom).toBeLessThan(geometry.mediaTop);
        expect(geometry.copyWidth).toBeGreaterThan(210);
      } else {
        expect(geometry.copyLeft).toBeGreaterThan(geometry.mediaRight);
        expect(geometry.copyWidth).toBeGreaterThan(400);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
