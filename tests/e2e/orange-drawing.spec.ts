import { expect, test, type Locator, type Page } from "@playwright/test";

async function openHome(page: Page, scheme: "light" | "dark") {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("theme-preference", "system"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
  await page.waitForFunction(() => !document.documentElement.classList.contains("theme-transitioning"));
}

async function readPaint(locator: Locator) {
  return locator.evaluate((node) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    const rgba = (color: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data);
    };
    const blend = (front: number[], back: number[]) => front.slice(0, 3).map((v, i) => v * front[3] / 255 + back[i] * (1 - front[3] / 255));
    const luminance = (rgb: number[]) => rgb.map((v) => {
      const n = v / 255;
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ancestors: Element[] = [];
    for (let el: Element | null = node; el; el = el.parentElement) ancestors.unshift(el);
    let background: number[] | null = null;
    for (const el of ancestors) {
      const paint = rgba(getComputedStyle(el).backgroundColor);
      if (paint[3] === 255) background = paint.slice(0, 3);
      else if (background) background = blend(paint, background);
    }
    if (!background) throw new Error("Contrast sampling requires an opaque painted ancestor");
    const styles = getComputedStyle(node);
    const color = blend(rgba(styles.color), background);
    const backgroundLuminance = luminance(background);
    const foregroundLuminance = luminance(color);
    return {
      color,
      ownBackground: rgba(styles.backgroundColor),
      backgroundLuminance,
      fontSize: Number.parseFloat(styles.fontSize),
      contrast: (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) / (Math.min(backgroundLuminance, foregroundLuminance) + 0.05),
    };
  });
}

function expectWarmOrange(color: number[]) {
  expect(color[0], "orange red channel exceeds green").toBeGreaterThan(color[1]);
  expect(color[1], "orange green channel exceeds blue").toBeGreaterThan(color[2]);
  expect(color[1] - color[2], "accent remains chromatic rather than warm gray").toBeGreaterThan(30);
}

for (const scheme of ["light", "dark"] as const) {
  test(`orange accents preserve the architectural paper and readable code header in ${scheme}`, async ({ page }) => {
    await openHome(page, scheme);
    const title = page.locator(".home-reference-hero__title");
    await expect(title).toHaveText("A-Znk");
    const image = page.locator("[data-home-architecture-image]");
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((node) => {
      const drawing = node as HTMLImageElement;
      return drawing.complete && drawing.naturalWidth > 0 && drawing.naturalHeight > 0;
    })).toBe(true);

    const paper = await readPaint(title);
    if (scheme === "light") expect(paper.backgroundLuminance).toBeGreaterThan(0.75);
    else expect(paper.backgroundLuminance).toBeLessThan(0.12);

    const accent = title.locator(".home-reference-hero__title-accent");
    await expect(accent).toHaveCount(1);
    await expect(accent).toHaveText("-");
    const accentPaint = await readPaint(accent);
    expectWarmOrange(accentPaint.color);
    expect(accentPaint.color).not.toEqual(paper.color);
    expect(accentPaint.fontSize).toBeGreaterThanOrEqual(24);
    expect(accentPaint.contrast).toBeGreaterThanOrEqual(3);

    const header = page.locator(".home-reference-terminal__header");
    const headerPaint = await readPaint(header);
    expect(headerPaint.ownBackground[3]).toBe(255);
    expectWarmOrange(headerPaint.ownBackground);
    const filename = header.locator(".home-reference-terminal__filename");
    await expect(filename).toHaveText("研究签名 · research.ts");
    expect((await readPaint(filename)).contrast).toBeGreaterThanOrEqual(4.5);
  });

  test(`orange drawing labels stay readable and the default article header stays independent in ${scheme}`, async ({ page }) => {
    await openHome(page, scheme);
    const indices = page.locator(".home-reference-section-index");
    await expect(indices).toHaveText(["01", "02", "03"]);
    for (const index of await indices.all()) {
      await expect(index).toHaveAttribute("aria-hidden", "true");
      const paint = await readPaint(index);
      expectWarmOrange(paint.color);
      expect(paint.contrast).toBeGreaterThanOrEqual(4.5);
    }
    for (const selector of ["[data-home-domain-id]", ".home-reference-terminal__kw"]) {
      const label = page.locator(selector).first();
      await expect(label).toBeVisible();
      const paint = await readPaint(label);
      expectWarmOrange(paint.color);
      expect(paint.contrast).toBeGreaterThanOrEqual(4.5);
    }

    const homeHeader = page.locator('.site-header[data-header-variant="drawing"]');
    const activeLink = homeHeader.locator('.site-nav a[aria-current="page"]');
    await expect(activeLink).toHaveCount(1);
    const activePaint = await readPaint(activeLink);
    expectWarmOrange(activePaint.color);
    expect(activePaint.contrast).toBeGreaterThanOrEqual(4.5);

    await page.goto("/posts/paragraph-anchor-design");
    await expect(page.locator(".site-header")).toHaveAttribute("data-header-variant", "default");
    for (const [selector, token] of [
      ['a[aria-current="page"]', "--chrome-text"],
      ['a[href="/"]', "--chrome-text-muted"],
    ]) {
      const defaultLink = page.locator(`.site-header .site-nav ${selector}`);
      const defaultColors = await defaultLink.evaluate((node, token) => {
        const probe = document.createElement("span");
        probe.hidden = true;
        probe.style.color = `var(${token})`;
        node.append(probe);
        const expected = getComputedStyle(probe).color;
        probe.remove();
        return { actual: getComputedStyle(node).color, expected };
      }, token);
      expect(defaultColors.actual, selector).toBe(defaultColors.expected);
    }
  });
}
