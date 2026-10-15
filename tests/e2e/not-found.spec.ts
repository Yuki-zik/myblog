import { expect, test } from "@playwright/test";

for (const mode of [
  { width: 1440, height: 960, scheme: "dark" },
  { width: 390, height: 844, scheme: "light" }
] as const) {
  test(`missing pages keep their 404 status and offer recovery at ${mode.width}px`, async ({ page }) => {
    await page.setViewportSize(mode);
    await page.emulateMedia({ colorScheme: mode.scheme, reducedMotion: "reduce" });
    const response = await page.goto("/__missing_note_for_test__");
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle("页面未找到 | MyBlog");
    await expect(page.getByRole("heading", { name: "页面未找到", exact: true })).toBeVisible();
    await expect(page.locator('main[data-runtime="discover"]')).toBeVisible();
    await expect(page.getByRole("link", { name: "返回首页", exact: true })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: "浏览主题", exact: true })).toHaveAttribute("href", "/topics");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.keyboard.press("/");
    await page.locator("[data-search-input]").fill("段落锚点短评的最小实现");
    const result = page.locator(".header-search-result-link").first();
    await expect(result).toHaveAttribute("href", "/posts/paragraph-anchor-design");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/posts\/paragraph-anchor-design$/);
    await expect(page.locator("main h1")).toHaveText("段落锚点短评的最小实现");
  });
}

test("the not-found document is noindex and absent from the sitemap", async ({ request, page }) => {
  const response = await request.get("/__missing_note_for_test__");
  expect(response.status()).toBe(404);
  const robots = await page.evaluate((html) => {
    const document = new DOMParser().parseFromString(html, "text/html");
    return document.querySelector('meta[name="robots"]')?.getAttribute("content");
  }, await response.text());
  expect(robots).toBe("noindex, follow");

  const sitemap = await request.get("/sitemap-0.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).not.toContain("/404");
});
