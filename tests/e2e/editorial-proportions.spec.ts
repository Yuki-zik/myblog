import { expect, test } from "@playwright/test";

async function size(locator: import("@playwright/test").Locator) {
  return locator.evaluate(node => parseFloat(getComputedStyle(node).fontSize));
}

test("author groups use available columns and readable content hierarchy", async ({ page }) => {
  await page.setViewportSize({width:1440,height:960});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/author");
  await page.evaluate(() => document.fonts.ready);
  const body = page.locator(".discover-page__body");
  expect((await body.boundingBox())!.width).toBeGreaterThanOrEqual(1200);
  const tracks = page.locator(".discover-entity-grid").first();
  await expect(tracks.locator(":scope > article")).toHaveCount(3);
  const groupBox = (await tracks.boundingBox())!;
  const lastBox = (await tracks.locator(":scope > article").last().boundingBox())!;
  expect(Math.abs(groupBox.x + groupBox.width - lastBox.x - lastBox.width)).toBeLessThan(2);
  const focus = page.locator(".discover-mini-grid").first();
  const focusBox = (await focus.boundingBox())!;
  const lastFocusBox = (await focus.locator(":scope > article").last().boundingBox())!;
  expect(Math.abs(focusBox.x + focusBox.width - lastFocusBox.x - lastFocusBox.width)).toBeLessThan(2);
  expect(await size(tracks.locator("h3").first())).toBeGreaterThanOrEqual(24);
  expect(await size(tracks.locator("p").first())).toBeGreaterThanOrEqual(17);
  expect(await size(page.locator(".discover-stream-item__summary").first())).toBeGreaterThanOrEqual(17);
});

test("concept page prioritizes readable explanation and linked articles", async ({ page }) => {
  await page.setViewportSize({width:1440,height:960});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/concepts/anchor-id");
  expect(await size(page.locator(".discover-rich p").first())).toBeGreaterThanOrEqual(18);
  expect(await size(page.locator("[data-concept-posts] .post-card-title").first())).toBeGreaterThanOrEqual(24);
  expect(await size(page.locator("[data-concept-posts] .post-card-summary").first())).toBeGreaterThanOrEqual(17);
  await expect(page.getByRole("heading",{level:1})).toBeInViewport({ratio:1});
});

test("editorial pages keep readable narrow-screen columns without clipping", async ({ page }) => {
  for (const width of [320,390]) {
    await page.setViewportSize({width,height:844});
    await page.emulateMedia({reducedMotion:"reduce"});
    for (const route of ["/author","/concepts/anchor-id"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBe(0);
      await expect(page.getByRole("heading",{level:1})).toBeInViewport({ratio:1});
      const headerSurface = (await page.locator(".site-header-inner").boundingBox())!;
      const nav = (await page.locator(".site-nav").boundingBox())!;
      expect(headerSurface.y + headerSurface.height, "reduced-motion header surface contains both mobile rows").toBeGreaterThanOrEqual(nav.y + nav.height - 1);
      const text = page.locator(route === "/author" ? ".discover-entity-card p" : ".discover-rich p").first();
      expect(await size(text)).toBeGreaterThanOrEqual(16);
      expect(await text.evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1);
    }
  }
});
