import { expect, test, type Page } from "@playwright/test";

async function layoutProblems(page: Page) {
  return page.evaluate(() => {
    const errors: string[] = [];
    const controls = [...document.querySelectorAll<HTMLElement>(
      '.site-header .brand, .site-header .header-search-trigger, .site-header [data-language-switch], .site-header .site-nav a, .site-header #theme-toggle'
    )].filter(el => el.getBoundingClientRect().width > 0);
    const boxes = controls.map(el => ({ el, box: el.getBoundingClientRect() }));
    for (const { el, box } of boxes) {
      if (box.left < -1 || box.right > innerWidth + 1) errors.push(`outside: ${el.textContent}`);
      if (el.scrollWidth > el.clientWidth + 1) errors.push(`clipped: ${el.textContent}`);
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].box, b = boxes[j].box;
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1)
        errors.push(`overlap: ${boxes[i].el.textContent} / ${boxes[j].el.textContent}`);
    }
    for (const el of document.querySelectorAll<HTMLElement>(
      '.home-reference-recent-item__title, .home-reference-recent-item__summary, .home-reference-recent-item__tag'
    )) {
      const box = el.getBoundingClientRect();
      if (el.scrollWidth > el.clientWidth + 1) errors.push(`card clipping: ${el.className}`);
      const range = document.createRange();
      range.selectNodeContents(el);
      for (const text of range.getClientRects()) {
        if (text.left < box.left - 1 || text.right > box.right + 1)
          errors.push(`text outside card: ${el.className}`);
      }
    }
    return errors;
  });
}

export function registerReadingIntegrityTests(browserName: "chromium" | "webkit") {
  test.describe(`${browserName} bilingual reading integrity`, () => {
    for (const prefix of ["", "/en"]) {
      test(`${prefix || "zh"}: every note resolves uniquely to its own body citation`, async ({ page }) => {
        await page.goto(`${prefix}/posts/ant-ai-coding-review`);
        await expect(page.locator("[data-footnote-rail-item]")).toHaveCount(8);
        const problems = await page.evaluate(() => {
          const errors: string[] = [];
          for (const note of document.querySelectorAll<HTMLElement>("[data-footnote-rail-item]")) {
            const matches = [...document.querySelectorAll<HTMLElement>("[id]")].filter(el => el.id === `c-${note.dataset.anchorId}`);
            if (!note.dataset.anchorId || matches.length !== 1) { errors.push(`${note.id}: ${matches.length} anchors`); continue; }
            const refs = [...matches[0].querySelectorAll<HTMLAnchorElement>("a[data-footnote-ref]")];
            if (!refs.some(ref => ref.getAttribute("href") === `#${note.id}`)) errors.push(`${note.id}: wrong source`);
          }
          return errors;
        });
        expect(problems).toEqual([]);
      });
      for (const zoom of [100, 200]) {
        for (const width of zoom === 100 ? [320, 390, 768, 1440, 1920] : [390, 1440]) {
          test(`${prefix || "zh"}: ${width}px at ${zoom}% root text`, async ({ page }, testInfo) => {
            await page.setViewportSize({ width, height: 1000 });
            await page.emulateMedia({ reducedMotion: "reduce" });
            await page.goto(prefix || "/");
            await page.evaluate(async zoom => {
              document.documentElement.style.fontSize = `${zoom}%`;
              await document.fonts.ready;
            }, zoom);
            await expect.poll(() => page.locator("html").evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBe(16 * zoom / 100);
            await expect(page.locator(".site-nav-links > a")).toHaveCount(6);
            for (const control of await page.locator(".site-nav-links > a, [data-language-switch], #theme-toggle, [data-search-trigger]").all()) {
              await expect(control).toBeVisible();
            }
            await expect.poll(() => layoutProblems(page)).toEqual([]);
            if (zoom === 100 && width <= 768) {
              const tops = await page.locator(".site-nav-links > a").evaluateAll(links => links.map(link => link.getBoundingClientRect().top));
              expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
            }
            if (zoom === 200) {
              expect(await page.locator("html").evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBe(32);
              await page.screenshot({ path: testInfo.outputPath(`header-${width}-${zoom}.png`) });
              await page.locator(".home-content-note").last().scrollIntoViewIfNeeded();
              await expect.poll(() => layoutProblems(page)).toEqual([]);
              await page.screenshot({ path: testInfo.outputPath(`recent-${width}-${zoom}.png`) });
            }
          });
        }
      }
    }
  });

}
