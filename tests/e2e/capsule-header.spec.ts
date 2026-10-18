import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

for (const scheme of ["light", "dark"] as const) {
  test(`drawing pages retain the shared floating capsule in ${scheme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "no-preference" });
    for (const route of ["/", "/topics", "/posts/myblog-design-manual", "/papers/duap-multilingual-speech-privacy"]) {
      await page.goto(route);
      await waitForFontsSettled(page);
      await page.mouse.move(1430, 940);
      // The page must first travel behind the sticky 68px header before
      // the 96px capsule-collapse range starts.
      await page.evaluate(() => window.scrollTo({ top: 164, behavior: "instant" }));
      const surface = page.locator(".site-header-inner");
      await expect.poll(() => surface.evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThanOrEqual(20);
      await expect.poll(() => surface.evaluate(el => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1180);
      const spacing = await page.evaluate(() => {
        const surface = document.querySelector(".site-header-inner")!.getBoundingClientRect();
        const brand = document.querySelector(".site-header .brand")!.getBoundingClientRect();
        const nav = document.querySelector(".site-nav")!.getBoundingClientRect();
        return { center: surface.left + surface.width / 2, left: brand.left - surface.left, right: surface.right - nav.right };
      });
      expect(spacing.center).toBeCloseTo(720, 0);
      expect(spacing.left).toBeGreaterThanOrEqual(12);
      expect(spacing.right).toBeGreaterThanOrEqual(12);
      await expect(page.locator("body")).toHaveAttribute("data-header-variant", "drawing");
    }
  });
}

for (const motion of ["reduce", "no-preference"] as const) {
  test(`mobile capsule contains both navigation rows through scrolling with ${motion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: motion });
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of ["/", "/posts/myblog-design-manual"]) {
        await page.goto(route);
        await waitForFontsSettled(page);
        for (const scroll of [0, 96]) {
          await page.evaluate(top => window.scrollTo({ top, behavior: "instant" }), scroll);
          await expect.poll(() => page.evaluate(() => {
            const surface = document.querySelector(".site-header-inner")!.getBoundingClientRect();
            const nav = document.querySelector(".site-nav")!.getBoundingClientRect();
            return surface.bottom - nav.bottom;
          })).toBeGreaterThanOrEqual(6);
          const surface = (await page.locator(".site-header-inner").boundingBox())!;
          const brand = (await page.locator(".site-header .brand").boundingBox())!;
          const nav = (await page.locator(".site-nav").boundingBox())!;
          expect(surface.y).toBeLessThanOrEqual(brand.y);
          expect(nav.x - surface.x).toBeGreaterThanOrEqual(8);
          expect(surface.x + surface.width - nav.x - nav.width).toBeGreaterThanOrEqual(8);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      }
    }
  });
}

/**
 * The header occupies normal document flow. Until the first content surface
 * reaches the viewport top, its background must still cover the full header
 * band; otherwise a collapsing pill exposes an empty strip when scrolling up.
 */
test("capsule reveals the page only after content scrolls behind it", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await waitForFontsSettled(page);
    const headerHeight = await page.locator(".site-header").evaluate((el) => el.getBoundingClientRect().height);
    const assertCovered = async () => {
      await expect.poll(() => page.evaluate(() => {
        const rect = document.querySelector(".site-header-inner")!.getBoundingClientRect();
        const band = document.querySelector(".site-header")!.getBoundingClientRect();
        return rect.left <= 0 && rect.right >= innerWidth && rect.top <= 1 && rect.bottom >= band.bottom - 1;
      })).toBe(true);
    };

    for (const scroll of [0, Math.floor(headerHeight / 2), Math.floor(headerHeight) - 1]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), scroll);
      await assertCovered();
    }

    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), headerHeight + 110);
    await expect.poll(() => page.locator(".site-header-inner").evaluate(el => el.getBoundingClientRect().width)).toBeLessThan(width);

    // The page remains covered when a reader reverses the gesture.
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), headerHeight / 2);
    await assertCovered();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
});

/** The search dialog's body scroll lock must not change the sticky header's
 * document-flow height when the scroll timeline jumps between top/compact. */
test("mobile capsule keeps a stable flow height while opening search", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 700 });
  await page.goto("/posts/paragraph-anchor-design");
  await waitForFontsSettled(page);
  const measureHeight = () => page.locator(".site-header").evaluate(el => el.getBoundingClientRect().height);
  const topHeight = await measureHeight();
  await page.evaluate(() => window.scrollTo({ top: 650, behavior: "instant" }));
  await expect.poll(measureHeight).toBeCloseTo(topHeight, 0);
  const before = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("/");
  await expect(page.locator("[data-search-dialog]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-search-dialog]")).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(before, 0);
});
