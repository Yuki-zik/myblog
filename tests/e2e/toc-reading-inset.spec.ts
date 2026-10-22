import { expect, test } from "@playwright/test";
import { disableSmoothScroll, waitForFontsSettled, waitForScrollSettled } from "./helpers/page-state";

for (const height of [600, 760, 1000]) {
  test(`long reading TOC gives active branches and the final entry breathing room at ${height}px`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/posts/myblog-design-manual");
    await waitForFontsSettled(page);
    await disableSmoothScroll(page);

    for (const label of ["Guidelines", "References"]) {
      if (label === "References") {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      } else {
        await page.locator("h2").filter({ hasText: label }).first().evaluate(el => {
          window.scrollTo(0, el.getBoundingClientRect().top + scrollY - Math.min(innerHeight * .25, 230));
        });
      }
      await waitForScrollSettled(page);
      const active = page.locator("[data-toc-sidebar] [data-toc-link].is-active");
      await expect(active).toContainText(label);
      await expect(page.locator("[data-toc-progress]")).not.toHaveAttribute("data-instant");
      const position = await page.evaluate(() => {
        const body = document.querySelector("[data-toc-sidebar-body]")!.getBoundingClientRect();
        const active = document.querySelector("[data-toc-sidebar] [data-toc-link].is-active")!.getBoundingClientRect();
        const marker = document.querySelector("[data-toc-progress]")!.getBoundingClientRect();
        return { listGap: body.bottom - active.bottom, viewportGap: innerHeight - marker.bottom, activeTop: active.top - body.top, markerDelta: Math.abs(marker.bottom - active.bottom) };
      });
      expect(position.listGap, "the current entry stays above the bottom comfort zone").toBeGreaterThanOrEqual(48);
      expect(position.viewportGap, "the orange marker must not hug the screen bottom").toBeGreaterThanOrEqual(64);
      expect(position.activeTop).toBeGreaterThanOrEqual(-1);
      expect(position.markerDelta).toBeLessThanOrEqual(24);
      const documentScroll = await page.evaluate(() => scrollY);
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
      await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(documentScroll, 0);
    }
    if (height === 760) {
      await page.setViewportSize({ width: 1440, height: 600 });
      await waitForScrollSettled(page);
      const toggle = page.locator("[data-toc-toggle]");
      const documentScroll = await page.evaluate(() => scrollY);
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect.poll(() => page.locator("[data-toc-progress]").evaluate(el => innerHeight - el.getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(64);
      expect(await page.evaluate(() => scrollY)).toBeCloseTo(documentScroll, 0);

      const earlierLink = page.locator("[data-toc-sidebar] [data-toc-link]").filter({ hasText: "Typography" });
      const headingId = (await earlierLink.getAttribute("data-target-id"))!;
      await earlierLink.click();
      await waitForScrollSettled(page);
      await expect(earlierLink).toHaveClass(/is-active/);
      const headingTop = await page.evaluate(id => document.getElementById(id)!.getBoundingClientRect().top, headingId);
      expect(headingTop).toBeGreaterThan(70);
      expect(headingTop).toBeLessThan(180);
    }
  });
}
