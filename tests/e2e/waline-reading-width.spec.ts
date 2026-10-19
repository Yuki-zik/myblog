import { expect, test } from "@playwright/test";

// A grid item's auto inline margins must not make the Waline editor shrink
// to its intrinsic form width. Align it with the existing article pager measure.
for (const viewportWidth of [390, 900, 1180, 1493, 1920]) {
  test(`post comments match the reading measure at ${viewportWidth}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewportWidth, height: 850 });
    await page.goto("/posts/paragraph-anchor-design");
    await expect(page.locator(".post-waline-comments-section")).toBeVisible();
    await expect(page.locator(".post-pager")).toBeVisible();

    const layout = await page.evaluate(() => {
      const box = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const rect = element.getBoundingClientRect();
        return { x: rect.x, width: rect.width, right: rect.right };
      };
      return {
        comments: box(".post-waline-comments-section"),
        mount: box(".waline-comments__mount"),
        pager: box(".post-pager"),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });

    expect(Math.abs(layout.comments.width - layout.pager.width)).toBeLessThan(1);
    expect(Math.abs(layout.comments.x - layout.pager.x)).toBeLessThan(1);
    expect(Math.abs(layout.mount.width - layout.comments.width)).toBeLessThan(1);
    expect(layout.overflow).toBeLessThanOrEqual(1);
  });
}
