import { expect, test, type Page } from "@playwright/test";

/*
 * Behavioural coverage for the header search.
 *
 * The existing specs only assert where the search trigger sits in the header.
 * Everything the feature actually does — the keyboard shortcuts, loading and
 * querying /search-index.json, rendering typed results, Enter-to-navigate and
 * the dismissal paths — had no coverage at all.
 */

const SEARCH_ROOT = "[data-header-search]";
const TRIGGER = "[data-search-trigger]";
const INPUT = "[data-search-input]";
const PANEL = "[data-search-panel]";
const STATUS = "[data-search-status]";
const RESULT_LINK = ".header-search-result-link";

async function openSearchWithSlash(page: Page): Promise<void> {
  await page.locator(TRIGGER).waitFor({ state: "visible" });
  await page.keyboard.press("/");
  await expect(page.locator(SEARCH_ROOT)).toHaveClass(/is-open/);
}

test("slash shortcut opens the search field and focuses the input", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await expect(page.locator(SEARCH_ROOT)).not.toHaveClass(/is-open/);
  await openSearchWithSlash(page);

  await expect(page.locator(INPUT)).toBeFocused();
  // The trigger is swapped out for the live field rather than sitting behind it.
  await expect(page.locator(TRIGGER)).toBeHidden();
});

test("meta+k opens search from anywhere on the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await page.locator(TRIGGER).waitFor({ state: "visible" });
  await page.keyboard.press("ControlOrMeta+k");

  await expect(page.locator(SEARCH_ROOT)).toHaveClass(/is-open/);
  await expect(page.locator(INPUT)).toBeFocused();
});

test("the slash shortcut is ignored while typing in the search input", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await openSearchWithSlash(page);
  await page.locator(INPUT).fill("主题");
  await page.keyboard.press("/");

  // A slash typed inside the field must reach the field, not re-trigger the
  // shortcut and wipe the query.
  await expect(page.locator(INPUT)).toHaveValue("主题/");
});

test("typing surfaces matching posts, topics and concepts with type badges", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await openSearchWithSlash(page);
  await page.locator(INPUT).fill("主题");

  await expect(page.locator(PANEL)).toBeVisible();
  await expect(page.locator(RESULT_LINK).first()).toBeVisible();

  const results = await page.locator(RESULT_LINK).evaluateAll((nodes) =>
    nodes.map((node) => ({
      href: node.getAttribute("href") ?? "",
      title: node.querySelector(".header-search-result-title")?.textContent?.trim() ?? "",
      badge: node.querySelector(".header-search-result-type")?.textContent?.trim() ?? ""
    }))
  );

  expect(results.length).toBeGreaterThan(0);
  expect(results.length).toBeLessThanOrEqual(8);

  // Every row links somewhere real and is labelled with its collection.
  results.forEach((result) => {
    expect(result.href).toMatch(/^\/(posts|topics|concepts)\//);
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.badge.length).toBeGreaterThan(0);
  });

  // "主题" appears in both a post title and a topic title, so the query should
  // reach across collections rather than only matching posts.
  const hrefs = results.map((result) => result.href);
  expect(hrefs).toContain("/topics/knowledge-network");
  expect(hrefs.some((href) => href.startsWith("/posts/"))).toBe(true);

  await expect(page.locator(STATUS)).toContainText(`找到 ${results.length} 条结果`);
});

test("exact title matches rank first", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await openSearchWithSlash(page);
  await page.locator(INPUT).fill("Anchor ID");

  await expect(page.locator(RESULT_LINK).first()).toBeVisible();
  await expect(page.locator(RESULT_LINK).first()).toHaveAttribute("href", "/concepts/anchor-id");
  await expect(page.locator(RESULT_LINK).first()).toHaveAttribute("data-search-first", "true");
});

test("pressing enter navigates to the first result", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await openSearchWithSlash(page);
  await page.locator(INPUT).fill("Optimistic UI");
  await expect(page.locator(RESULT_LINK).first()).toHaveAttribute("data-search-first", "true");

  await page.locator(INPUT).press("Enter");
  await page.waitForURL("**/concepts/optimistic-ui");

  expect(new URL(page.url()).pathname).toBe("/concepts/optimistic-ui");
});

test("clicking a result navigates and leaves search closed on the next page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await openSearchWithSlash(page);
  await page.locator(INPUT).fill("段落锚点");
  await expect(page.locator(RESULT_LINK).first()).toBeVisible();

  await page.locator(RESULT_LINK).first().click();
  await page.waitForURL("**/posts/paragraph-anchor-design");

  await expect(page.locator(SEARCH_ROOT)).not.toHaveClass(/is-open/);
  await expect(page.locator(TRIGGER)).toBeVisible();
});

test("a query with no matches reports an empty state instead of stale rows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await openSearchWithSlash(page);

  // Populate results first, so this also proves the previous rows are cleared.
  await page.locator(INPUT).fill("主题");
  await expect(page.locator(RESULT_LINK).first()).toBeVisible();

  await page.locator(INPUT).fill("zzzzzzzzzz-no-such-entry");
  await expect(page.locator(STATUS)).toContainText("未找到结果");
  await expect(page.locator(RESULT_LINK)).toHaveCount(0);
});

test("escape closes search, clears the query and returns focus to the trigger", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await openSearchWithSlash(page);
  await page.locator(INPUT).fill("主题");
  await expect(page.locator(PANEL)).toBeVisible();

  await page.locator(INPUT).press("Escape");

  await expect(page.locator(SEARCH_ROOT)).not.toHaveClass(/is-open/);
  await expect(page.locator(PANEL)).toBeHidden();
  await expect(page.locator(TRIGGER)).toBeVisible();

  // Dismissing must not strand keyboard users on <body>.
  await expect(page.locator(TRIGGER)).toBeFocused();

  // Re-opening must not resurrect the previous query.
  await openSearchWithSlash(page);
  await expect(page.locator(INPUT)).toHaveValue("");
});

test("pointer down outside the search dismisses it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  await openSearchWithSlash(page);
  await page.locator(INPUT).fill("主题");
  await expect(page.locator(PANEL)).toBeVisible();

  await page.locator("main").click({ position: { x: 40, y: 320 } });

  await expect(page.locator(SEARCH_ROOT)).not.toHaveClass(/is-open/);
  await expect(page.locator(PANEL)).toBeHidden();
});

test("search works on a reading-runtime page, not just the home route", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/why-topic-first");

  await openSearchWithSlash(page);
  await page.locator(INPUT).fill("考试");

  await expect(page.locator(RESULT_LINK).first()).toBeVisible();
  await expect(page.locator(RESULT_LINK).first()).toHaveAttribute("href", "/topics/exam-review");
});

test("the search index endpoint exposes every published collection entry", async ({ request }) => {
  const response = await request.get("/search-index.json");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/json");

  const index = (await response.json()) as Array<{
    type: string;
    title: string;
    url: string;
    keywords: string[];
  }>;

  expect(Array.isArray(index)).toBe(true);

  const byType = index.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  expect(byType.post).toBeGreaterThan(0);
  expect(byType.topic).toBeGreaterThan(0);
  expect(byType.concept).toBeGreaterThan(0);
  expect(byType.paper).toBe(2);

  expect(index.filter((item) => item.type === "paper").map((item) => item.url).sort()).toEqual([
    "/papers/duap-multilingual-speech-privacy",
    "/papers/oxicams-carbon-dots-machine-learning"
  ]);

  index.forEach((item) => {
    expect(["post", "paper", "topic", "concept"]).toContain(item.type);
    expect(item.title.length).toBeGreaterThan(0);
    expect(item.url).toMatch(/^\/(posts|papers|topics|concepts)\//);
    expect(Array.isArray(item.keywords)).toBe(true);
  });

  // Each published entry must have a unique client-side index URL.
  const urls = index.map((item) => item.url);
  expect(new Set(urls).size).toBe(urls.length);
});

test("the header degrades gracefully when the search index cannot be fetched", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.route("**/search-index.json", (route) => route.abort());
  await page.goto("/");

  await openSearchWithSlash(page);
  await page.locator(INPUT).fill("主题");

  // The failure is surfaced in the status line rather than throwing away the
  // panel or leaving the spinner text up forever.
  await expect(page.locator(STATUS)).toContainText("搜索索引加载失败");
  await expect(page.locator(RESULT_LINK)).toHaveCount(0);
});
