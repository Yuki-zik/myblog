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
      await page.evaluate(() => window.scrollTo({ top: 96, behavior: "instant" }));
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
