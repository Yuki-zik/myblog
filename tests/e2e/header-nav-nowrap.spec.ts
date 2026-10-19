import { expect, test, type Page } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

/** Measure the rendered text itself: overflow checks alone miss CJK labels
 * wrapping onto two lines while remaining entirely inside their buttons. */
async function headerProblems(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    const shell = rect(".site-header > .shell");
    const nav = rect(".site-nav");
    const links = [...document.querySelectorAll<HTMLAnchorElement>(".site-nav-links > a")];
    if (links.length !== 6) problems.push(`expected six links, found ${links.length}`);
    const rowTops: number[] = [];
    for (const link of links) {
      const range = document.createRange();
      range.selectNodeContents(link);
      const lines = new Set([...range.getClientRects()]
        .filter(box => box.width > 1 && box.height > 1)
        .map(box => Math.round(box.top)));
      if (lines.size !== 1) problems.push(`${link.textContent?.trim()}: ${lines.size} text lines`);
      const box = link.getBoundingClientRect();
      rowTops.push(box.top);
      if (box.left < nav.left - 1 || box.right > nav.right + 1) {
        problems.push(`${link.textContent?.trim()}: outside navigation`);
      }
    }
    if (Math.max(...rowTops) - Math.min(...rowTops) > 1) problems.push("links split across rows");
    if (nav.right > shell.right + 1 || nav.left < shell.left - 1) problems.push("navigation outside shell");
    if (document.documentElement.scrollWidth > innerWidth + 1) problems.push("page horizontal overflow");
    if (innerWidth > 900) {
      const brand = rect(".brand");
      const search = rect(".site-header-search-slot");
      if (search.left < brand.right + 8) problems.push("search overlaps brand");
      if (nav.left < search.right + 8) problems.push("navigation overlaps search");
      if (search.width < 180) problems.push("search unnecessarily squeezed");
    }
    return problems;
  });
}

for (const scheme of ["light", "dark"] as const) {
  test(`six navigation labels stay horizontal at desktop widths in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "no-preference" });
    await page.goto("/map");
    await waitForFontsSettled(page);
    for (const width of [901, 1024, 1100, 1101, 1280, 1440, 1920, 2048]) {
      await page.setViewportSize({ width, height: 800 });
      for (const top of [0, 200]) {
        await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), top);
        await expect.poll(() => headerProblems(page), { message: `${width}px scroll=${top}` }).toEqual([]);
      }
    }
  });

  test(`mobile keeps all six full labels on its second header row in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto("/map");
    await waitForFontsSettled(page);
    for (const width of [320, 375, 390, 768, 900]) {
      await page.setViewportSize({ width, height: 844 });
      for (const top of [0, 200]) {
        await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), top);
        await expect.poll(() => headerProblems(page), { message: `${width}px scroll=${top}` }).toEqual([]);
      }
    }
  });
}

test("the shared fix preserves readable navigation on home, reading and author pages", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/", "/posts/ant-ai-coding-review", "/papers/duap-multilingual-speech-privacy", "/author"]) {
    await page.goto(path);
    await waitForFontsSettled(page);
    await expect.poll(() => headerProblems(page), { message: path }).toEqual([]);
  }
});

test("navigation labels remain one line before JavaScript initializes", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto("/map");
    await expect.poll(() => headerProblems(page)).toEqual([]);
  } finally { await context.close(); }
});
