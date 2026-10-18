import { expect, test } from "@playwright/test";
import { waitForEntranceAnimations, waitForFontsSettled } from "./helpers/page-state";

for (const [width, scheme] of [[1440, "light"], [1440, "dark"], [390, "light"], [320, "light"]] as const) {
  test(`article markers and notes form a readable type hierarchy at ${width}px in ${scheme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto("/posts/myblog-design-manual");
    await waitForFontsSettled(page);
    await waitForEntranceAnimations(page);
    const type = await page.evaluate(() => {
      const style = (selector: string, pseudo?: string) => {
        const s = getComputedStyle(document.querySelector(selector)!, pseudo);
        return { size: parseFloat(s.fontSize), family: s.fontFamily, line: parseFloat(s.lineHeight) };
      };
      return {
        body: style(".post-body--scholarly p[data-anchor]"),
        h2: style(".post-body--scholarly h2"), h2Marker: style(".post-body--scholarly h2", "::before"),
        h3: style(".post-body--scholarly h3"), h3Marker: style(".post-body--scholarly h3", "::before"),
        note: style('[data-footnote-rail-item="ref-hig"] p'),
        number: style('[data-footnote-rail-item="ref-hig"] button'),
        label: style('[data-footnote-rail-item="ref-hig"] .post-scholar-item-type-tag'),
      };
    });
    expect(type.h2Marker.size / type.h2.size).toBeGreaterThanOrEqual(0.75);
    expect(type.h3Marker.size / type.h3.size).toBeGreaterThanOrEqual(0.8);
    expect(type.h2.size / type.body.size).toBeGreaterThan(1.35);
    expect(type.h3.size / type.body.size).toBeGreaterThan(1.1);
    expect(type.note.size / type.body.size).toBeGreaterThanOrEqual(0.82);
    expect(type.label.size).toBeGreaterThanOrEqual(12);
    expect(type.number.family).toBe(type.label.family);
    expect(type.h2Marker.family).toBe(type.label.family);
    expect(type.note.family).toBe(type.body.family);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    if (width === 320) {
      const lines = await page.getByRole("heading", { name: "Foundations（基础）", exact: true }).evaluate(el => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return Array.from(range.getClientRects()).map(rect => ({ left: rect.left, top: rect.top }));
      });
      expect(lines.length).toBeGreaterThan(1);
      expect(Math.abs(lines[1].left - lines[0].left)).toBeLessThan(1);
    }
  });
}

test("repeated source citations use one readable margin note with a working return control", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/posts/myblog-design-manual");
  const note = page.locator('[data-footnote-rail-item="ref-hig"]');
  const refs = page.locator('[data-post-body] a[data-footnote-rail-target="ref-hig"]');
  await expect(refs).toHaveCount(2);
  await expect(note).toHaveCount(1);
  await expect(note.locator("[data-footnote-backref], .tufte-footnote-backref")).toHaveCount(0);
  await expect(note.locator("code")).toHaveCount(0);
  await expect(note.getByRole("link", { name: "Apple Human Interface Guidelines", exact: true })).toHaveAttribute("href", "https://developer.apple.com/design/human-interface-guidelines/");
  await note.locator("[data-footnote-rail-source]").click();
  await expect(refs.first()).toBeFocused();
  await expect(refs.first()).toBeInViewport();
});
