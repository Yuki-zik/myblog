import { expect, test } from "@playwright/test";
import { disableSmoothScroll, waitForFontsSettled, waitForScrollSettled } from "./helpers/page-state";

for (const height of [600, 760, 1000]) {
  test(`long reading TOC gives active branches and the final entry breathing room at ${height}px`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/posts/myblog-design-manual");
    await waitForFontsSettled(page);
    await disableSmoothScroll(page);
    const markerDuration = await page.locator("[data-toc-progress]").evaluate(
      (node) => getComputedStyle(node).transitionDuration
    );
    expect(markerDuration.split(",").every((duration) => Number.parseFloat(duration) <= 0.001),
      "reduced-motion readers should not receive marker animations").toBe(true);

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

// Verify the actual scroll instruction rather than assuming each rAF runs while
// a compositor-driven smooth scroll is in flight (loaded CI workers skip frames).
for (const [locale, path] of [
  ["zh", "/posts/myblog-design-manual"],
  ["en", "/en/posts/myblog-design-manual"],
] as const) {
  test(`long reading TOC smoothly follows distant sections without snapping the marker (${locale})`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 760 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(path);
    await waitForFontsSettled(page);
    await disableSmoothScroll(page);

    const samples = await page.evaluate(async () => {
      const toc = document.querySelector<HTMLElement>("[data-toc-sidebar-body]")!;
      const marker = document.querySelector<HTMLElement>("[data-toc-progress]")!;
      const scrollCalls: Array<{ top: number | undefined; behavior: ScrollBehavior | undefined }> = [];
      const nativeScrollTo = toc.scrollTo.bind(toc);
      toc.scrollTo = ((options: ScrollToOptions | number, y?: number) => {
        if (typeof options === "number") {
          nativeScrollTo(options, y ?? 0);
        } else {
          scrollCalls.push({top: options.top, behavior: options.behavior});
          nativeScrollTo(options);
        }
      }) as typeof toc.scrollTo;

      const before = toc.scrollTop;
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
      const immediate = toc.scrollTop;
      await new Promise<void>((resolve) => window.setTimeout(resolve, 900));
      const lastLink = Array.from(document.querySelectorAll<HTMLElement>("[data-toc-sidebar] [data-toc-link]")).at(-1);
      const activeLink = document.querySelector<HTMLElement>("[data-toc-sidebar] [data-toc-link].is-active");
      return {
        before,
        immediate,
        after: toc.scrollTop,
        scrollCalls,
        markerInstant: marker.hasAttribute("data-instant"),
        lastTitle: lastLink?.textContent?.trim() ?? "",
        activeTitle: activeLink?.textContent?.trim() ?? "",
      };
    });

    expect(samples.after - samples.before, "the long TOC should need internal scrolling").toBeGreaterThan(100);
    expect(samples.immediate - samples.before, "the follow must not teleport on activation").toBeLessThan(2);
    expect(samples.scrollCalls.some(({ behavior, top }) => behavior === "smooth" &&
      typeof top === "number" && top > samples.before + 100),
      "a distant chapter should request smooth scrolling on the TOC itself").toBe(true);
    expect(samples.markerInstant, "do not disable the marker's movement transition").toBe(false);
    expect(samples.activeTitle).toBe(samples.lastTitle);
  });
}
