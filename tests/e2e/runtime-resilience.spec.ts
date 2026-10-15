import { expect, test, type Locator } from "@playwright/test";
import { disableSmoothScroll } from "./helpers/page-state";

// Playwright's visibility check alone allows opacity: 0. Check the painted
// ancestor chain, viewport geometry and hit target as well as focus.
async function expectPaintedControl(control: Locator): Promise<void> {
  await expect.poll(() => control.evaluate((node) => {
    let opacity = 1;
    for (let ancestor: Element | null = node; ancestor; ancestor = ancestor.parentElement) {
      opacity *= Number.parseFloat(getComputedStyle(ancestor).opacity);
    }
    const rect = node.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return opacity > 0.95 && rect.top >= 0 && rect.bottom <= innerHeight &&
      rect.left >= 0 && rect.right <= innerWidth && !!hit && (hit === node || node.contains(hit));
  })).toBe(true);
}

for (const shortcut of ["/", "ControlOrMeta+k"]) {
  test(`${shortcut} reveals desktop search after the header hides on scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/");
    await disableSmoothScroll(page);
    await page.mouse.move(1400, 700);
    await page.evaluate(() => window.scrollTo(0, 900));

    const header = page.locator(".site-header");
    await expect(header).toHaveAttribute("data-header-state", "hidden");
    await expect(header).toHaveCSS("opacity", "0");
    const readingPosition = await page.evaluate(() => window.scrollY);

    await page.keyboard.press(shortcut);
    const input = page.locator("[data-search-input]");
    await expect(input).toBeFocused();
    await expectPaintedControl(input);
    expect(await page.evaluate(() => window.scrollY)).toBe(readingPosition);

    await input.fill("主题");
    await expectPaintedControl(page.locator(".header-search-result-link").first());
    await page.keyboard.press("Escape");
    const trigger = page.locator("[data-search-trigger]");
    await expect(trigger).toBeFocused();
    await expectPaintedControl(trigger);

    // Once focus leaves the header, its scroll-driven hidden state resumes.
    await page.mouse.click(12, 700);
    await expect(page.locator("[data-header-search]")).not.toHaveClass(/is-open/);
    await expect(header).toHaveCSS("opacity", "0");
    expect(await page.evaluate(() => window.scrollY)).toBe(readingPosition);
  });
}

test("slow remote font CSS does not hold up the document or header controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  let releaseFontCss!: () => void;
  let fontRequested = false;
  const fontGate = new Promise<void>((resolve) => { releaseFontCss = resolve; });
  await page.route("https://fonts.googleapis.com/**", async (route) => {
    fontRequested = true;
    await fontGate;
    await route.fulfill({ contentType: "text/css", body: "/* delayed font service */" });
  });

  try {
    await page.goto("/", { waitUntil: "commit" });
    await expect.poll(() => fontRequested).toBe(true);
    await page.waitForLoadState("domcontentloaded", { timeout: 5_000 });
    await expect(page.locator("main h1")).toBeVisible();
    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.keyboard.press("/");
    await expect(page.locator("[data-search-input]")).toBeFocused();
    await expectPaintedControl(page.locator("[data-search-input]"));
  } finally {
    releaseFontCss();
  }
});

for (const unavailable of ["read-and-write", "write-only"]) {
  test(`theme and later controllers still work when storage is ${unavailable} unavailable`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.addInitScript((mode) => {
      if (mode === "read-and-write") {
        Storage.prototype.getItem = () => { throw new DOMException("Storage disabled", "SecurityError"); };
      }
      Storage.prototype.setItem = () => { throw new DOMException("Storage disabled", "SecurityError"); };
    }, unavailable);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");

    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "system");
    await expect(root).toHaveAttribute("data-color-scheme", "dark");
    for (const preference of ["light", "dark", "system"]) {
      await page.locator("#theme-toggle").click();
      await expect(root).toHaveAttribute("data-theme", preference);
      await expect(root).toHaveAttribute("data-color-scheme", preference === "system" ? "dark" : preference);
    }

    await disableSmoothScroll(page);
    await page.mouse.move(1400, 700);
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(page.locator(".site-header")).toHaveAttribute("data-header-state", "hidden");
    const backToTop = page.locator("#back-to-top");
    await expect(backToTop).toHaveClass(/is-visible/);
    await backToTop.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expect(errors).toEqual([]);
  });
}
