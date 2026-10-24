import { expect, test } from "@playwright/test";

const siteName = "A-Znk的blog";

test("the homepage names the site consistently for readers and search engines", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".brand")).toHaveText(siteName);
  await expect(page.locator(".home-reference-footer__brand-name")).toHaveText(siteName);
  await expect(page).toHaveTitle(`${siteName} | 大模型系统、模型安全与 Agent 工程`);
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", siteName);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /A-Znk.*大模型/);
  const websites = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.flatMap((script) => JSON.parse(script.textContent ?? "{}")["@graph"] ?? [])
      .filter((node) => node["@type"] === "WebSite")
  );
  expect(websites).toHaveLength(1);
  expect(websites[0].name).toBe(siteName);
  expect(websites[0].alternateName).toContain("A-Znk Blog");
});

test("indexed pages retain canonical URLs and use the new site identity", async ({ request, page }) => {
  const sitemap = await request.get("/sitemap-0.xml");
  expect(sitemap.ok()).toBe(true);
  const urls = await page.evaluate((xml) => Array.from(
    new DOMParser().parseFromString(xml, "application/xml").querySelectorAll("loc"),
    (node) => node.textContent ?? ""
  ), await sitemap.text());
  expect(urls.length).toBeGreaterThan(10);
  for (const url of urls) {
    const response = await request.get(new URL(url).pathname);
    expect(response.ok(), url).toBe(true);
    const metadata = await page.evaluate((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      doc.querySelectorAll("script,style").forEach((node) => node.remove());
      return {
        title: doc.title,
        siteName: doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content"),
        canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href"),
        robots: doc.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
        body: doc.body.textContent ?? ""
      };
    }, await response.text());
    const expectedName = /^\/en(?:\/|$)/.test(new URL(url).pathname) ? "A-Znk Blog" : siteName;
    expect(metadata.title, url).toContain(expectedName);
    expect(metadata.siteName, url).toBe(expectedName);
    expect(metadata.canonical, url).toBe(new URL(url).href);
    expect(metadata.robots, url).not.toContain("noindex");
    expect(metadata.body, url).not.toContain("MyBlog");
  }
});

test("RSS, the reading index and favicon carry the same public name", async ({ request }) => {
  const rss = await request.get("/rss.xml");
  expect(await rss.text()).toContain(`<title>${siteName}</title>`);
  const llms = await request.get("/llms.txt");
  expect((await llms.text()).startsWith(`# ${siteName}\n`)).toBe(true);
  const icon = await request.get("/favicon.svg");
  expect(await icon.text()).toContain(`aria-label="${siteName}"`);
});

test("the longer brand stays usable on desktop, short tablets and phones", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 960 }, { width: 824, height: 620 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const brand = page.getByRole("link", { name: siteName, exact: true });
    await expect(brand).toBeVisible();
    const box = (await brand.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "打开搜索", exact: true }).click();
    await expect(page.locator("[data-search-input]")).toBeFocused();
    await page.keyboard.press("Escape");
  }
});
