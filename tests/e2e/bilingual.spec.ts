import { test, expect } from "@playwright/test";

for (const width of [320, 360, 390, 768, 1440]) {
  test(`English header and same-page language switch at ${width}px`, async ({page}, testInfo) => {
    await page.setViewportSize({width, height: 900});
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator(".site-nav-links a")).toHaveCount(6);
    await expect(page.locator("[data-language-switch]")).toBeVisible();
    const boxes = await page.locator(".site-nav-links a, [data-language-switch], #theme-toggle").evaluateAll(items => items.map(item => {
      const rect = item.getBoundingClientRect(); return {x:rect.x,right:rect.right,y:rect.y,bottom:rect.bottom};
    }));
    for (const rect of boxes) {expect(rect.x).toBeGreaterThanOrEqual(-1);expect(rect.right).toBeLessThanOrEqual(width + 1);}
    await expect.poll(async () => {
      const tops = await page.locator(".site-nav-links a").evaluateAll(items => items.map(item => item.getBoundingClientRect().top));
      return Math.max(...tops) - Math.min(...tops);
    }).toBeLessThan(2);
    await page.screenshot({path:testInfo.outputPath(`english-home-${width}.png`),fullPage:false});
    await page.goto("/en/posts/paragraph-anchor-design");
    await expect(page.locator("h1")).toContainText("Paragraph Anchors");
    await expect(page.locator("[data-language-switch]")).toHaveAttribute("href", "/posts/paragraph-anchor-design");
    await page.locator("[data-language-switch]").click();
    await expect(page).toHaveURL(/\/posts\/paragraph-anchor-design$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await page.locator("[data-language-switch]").click();
    await expect(page).toHaveURL(/\/en\/posts\/paragraph-anchor-design$/);
    expect(errors).toEqual([]);
  });
}

test("English search stays in the English edition", async ({page}) => {
  await page.goto("/en");
  await page.locator("[data-search-trigger]").click();
  await page.locator("[data-search-input]").fill("paragraph");
  await expect(page.locator("[data-search-results] a").first()).toBeVisible();
  const links = await page.locator("[data-search-results] a").evaluateAll(items=>items.map(a=>a.getAttribute("href")));
  expect(links.every(href=>href?.startsWith("/en/"))).toBeTruthy();
  await expect(page.locator("[data-search-status]")).toContainText("results");
});

test("English graph hydrates, filters, and links to translated entries", async ({page}) => {
  const errors: string[] = [];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/en/map");
  await expect(page.locator("[data-explore-ready]")).toHaveAttribute("data-explore-ready", "true");
  await page.locator(".explore-search input").fill("anchor");
  await expect(page.locator(".explore-inspector__read")).toHaveAttribute("href", /^\/en\//);
  await expect(page.locator(".explore-filter")).toContainText("Topics");
  expect(errors).toEqual([]);
});

test("English article, navigation, and metadata are readable without JavaScript", async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled:false});
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/en/posts/paragraph-anchor-design");
  await expect(page.locator("h1")).toContainText("Paragraph Anchors");
  await expect(page.locator("[data-post-body]")).toContainText("Anchor rules");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://myblog.example/en/posts/paragraph-anchor-design");
  await expect(page.locator('link[hreflang="zh-CN"]')).toHaveAttribute("href", "https://myblog.example/posts/paragraph-anchor-design");
  await page.locator("[data-language-switch]").click();
  await expect(page.locator("h1")).toContainText("段落锚点");
  await context.close();
});

test("English theme controls and translated spoilers work", async ({page}, testInfo) => {
  await page.goto("/en/posts/myblog-design-manual");
  await page.locator("#theme-toggle").click();
  await page.locator("#theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-color-scheme", "dark");
  await expect(page.locator("#theme-toggle")).toHaveAttribute("aria-label", /current: dark/);
  const spoiler=page.locator("[data-spoiler-inline]").first();
  await expect(spoiler).toHaveAttribute("aria-label","Reveal spoiler");
  await spoiler.click();
  await expect(spoiler).toHaveAttribute("aria-pressed","true");
  await page.screenshot({path:testInfo.outputPath("english-reading-dark.png"),fullPage:false});
});
