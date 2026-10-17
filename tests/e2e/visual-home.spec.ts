import { expect, test } from "@playwright/test";

test("home content keeps a readable code annotation and distinct featured article and note list", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("A-Znk");
  const metrics = await page.evaluate(() => {
    const node = (s: string) => document.querySelector<HTMLElement>(s)!;
    const box = (s: string) => node(s).getBoundingClientRect();
    const cover = box("[data-home-featured-cover]");
    const copy = box(".home-reference-featured-card__copy");
    const recentStyle = getComputedStyle(node("[data-home-recent-item]"));
    return {
      codeSize: parseFloat(getComputedStyle(node(".home-reference-terminal__body")).fontSize),
      domainHeight: box(".home-reference-domain-card").height,
      coverWidth: cover.width,
      coverRatio: cover.width / cover.height,
      copyBesideCover: copy.left >= cover.right,
      recentWidth: box("[data-home-recent-item]").width,
      recentRadius: parseFloat(recentStyle.borderTopLeftRadius),
      recentDivider: parseFloat(recentStyle.borderBottomWidth),
    };
  });
  expect(metrics.codeSize).toBeGreaterThanOrEqual(12);
  expect(metrics.domainHeight).toBeLessThanOrEqual(200);
  expect(metrics.coverWidth).toBeGreaterThanOrEqual(440);
  expect(metrics.coverRatio).toBeCloseTo(4 / 3, 1);
  expect(metrics.copyBesideCover).toBe(true);
  expect(metrics.recentWidth).toBeGreaterThan(900);
  expect(metrics.recentRadius).toBeLessThanOrEqual(2);
  expect(metrics.recentDivider).toBeGreaterThan(0);
});

test("home featured article stacks its larger cover above the copy on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".home-reference-featured-card__copy")).toBeVisible();
  const metrics = await page.evaluate(() => {
    const cover = document.querySelector("[data-home-featured-cover]")!.getBoundingClientRect();
    const copy = document.querySelector(".home-reference-featured-card__copy")!.getBoundingClientRect();
    return { coverBottom: cover.bottom, copyTop: copy.top, width: innerWidth, scrollWidth: document.documentElement.scrollWidth };
  });
  expect(metrics.copyTop).toBeGreaterThanOrEqual(metrics.coverBottom);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
});

test("home prioritizes topics and research with a concise introduction", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator(".home-reference-hero");
  await expect(hero.getByRole("link", { name: "按主题探索", exact: true })).toHaveAttribute("href", "/topics");
  await expect(hero.getByRole("link", { name: "论文与研究成果", exact: true })).toHaveAttribute("href", "/papers");
  const intro = await hero.locator(".home-reference-hero__description").innerText();
  expect(intro.length).toBeLessThanOrEqual(130);
  expect(intro.split(/[。！？]/).filter((part) => part.trim()).length).toBeGreaterThanOrEqual(2);
});


test("home research code signature preserves the author's real research areas and collection counts", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  const overview = page.locator("details[data-home-research-signature]");
  await expect(overview).toHaveCount(1);
  await expect(overview).toHaveAttribute("open", "");
  await expect(overview.locator("summary")).toHaveText("研究签名 · research.ts");
  await expect(overview.locator(".home-reference-terminal__line").first()).toHaveText("const research = {");
  await expect(overview.locator(".home-reference-terminal__comment")).toHaveText("// 当前主研究轨道");
  await expect(overview.locator(".home-reference-terminal__line--indent-2 .home-reference-terminal__string")).toHaveText([
    '"LLM / MLLM 系统"', '"模型安全"', '"Agent 工程"'
  ]);
  await expect(overview.locator(".home-reference-terminal__body")).toContainText('notes: "/topics"');
  await expect(overview.locator(".home-reference-terminal__body")).toContainText('papers: "/papers"');
  const index = await (await page.request.get("/search-index.json")).json();
  const topics = index.filter((entry: { type: string }) => entry.type === "topic");
  const posts = index.filter((entry: { type: string }) => entry.type === "post");
  const concepts = index.filter((entry: { type: string }) => entry.type === "concept");
  await expect(overview.locator("[data-research-count=posts]")).toHaveText(`${posts.length} posts indexed`);
  await expect(overview.locator("[data-research-count=topics]")).toHaveText(`${topics.length} topics mapped`);
  await expect(overview.locator("[data-research-count=concepts]")).toHaveText(`${concepts.length} concepts linked`);
  await page.locator(".home-reference-hero__actions").getByRole("link", { name: "论文与研究成果" }).click();
  await expect(page).toHaveURL(/\/papers$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("mobile research code signature is natively expandable without hiding the topic entrance", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const topicLink = page.locator('.site-nav a[href="/topics"]');
  await expect(topicLink).toBeInViewport();
  expect((await topicLink.boundingBox())!.y).toBeLessThan(100);
  const disclosure = page.locator("details[data-home-research-signature]");
  await expect(disclosure).toBeVisible();
  await expect(disclosure).not.toHaveAttribute("open", "");
  await expect(disclosure.locator(".home-reference-terminal__body")).not.toBeVisible();
  await disclosure.locator("summary").click();
  await expect(disclosure.locator(".home-reference-terminal__body")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await disclosure.locator("summary").press("Enter");
  await expect(disclosure.locator(".home-reference-terminal__body")).not.toBeVisible();
  const heading = page.getByRole("heading", { name: "关注领域", exact: true });
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toBeInViewport();
});

for (const scheme of ["light", "dark"] as const) {
  test(`home research code signature and footer supporting text retain contrast in system ${scheme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("theme-preference", "system"));
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
    await expect(page.locator(".home-reference-terminal__body").filter({ visible: true })).toHaveCount(1);
    const ratios = await page.evaluate(() => {
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
      return [".home-reference-terminal__filename", ".home-reference-terminal__line", ".home-reference-terminal__kw", ".home-reference-terminal__fn", ".home-reference-terminal__comment", ".home-reference-terminal__string", ".home-reference-terminal__meta", ".home-reference-footer__quote"].map((selector) => {
        const el = Array.from(document.querySelectorAll<HTMLElement>(selector)).find((node) => node.getBoundingClientRect().height > 0)!;
        const ancestors: HTMLElement[] = [];
        for (let node: HTMLElement | null = el; node; node = node.parentElement) ancestors.unshift(node);
        let bg = [255, 255, 255];
        for (const node of ancestors) bg = blend(rgba(getComputedStyle(node).backgroundColor), bg);
        const fg = blend(rgba(getComputedStyle(el).color), bg);
        const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
        return { selector, ratio: (a + 0.05) / (b + 0.05) };
      });
    });
    for (const entry of ratios) expect(entry.ratio, entry.selector).toBeGreaterThanOrEqual(4.5);
  });

  test(`discover pages retain visible ambient color behind opaque content in system ${scheme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("theme-preference", "system"));
    await page.goto("/concepts/anchor-id");
    await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
    const ambient = page.locator(".discover-page__ambient");
    await expect(ambient).toHaveAttribute("aria-hidden", "true");
    await expect(ambient.locator(".discover-page__orb")).toHaveCount(2);
    const layers = await page.evaluate(() => {
      const ambient = document.querySelector(".discover-page__ambient")!;
      const card = document.querySelector(".discover-mini-card")!;
      const grid = document.querySelector(".discover-page__grid")!;
      return {
        pointerEvents: getComputedStyle(ambient).pointerEvents,
        gridBackground: getComputedStyle(grid).backgroundImage,
        cardBackground: getComputedStyle(card).backgroundColor,
        orbs: Array.from(ambient.querySelectorAll(".discover-page__orb")).map((orb) => {
          const styles = getComputedStyle(orb);
          return {
            background: styles.backgroundColor,
            opacity: Number(styles.opacity),
            filter: styles.filter,
            width: orb.getBoundingClientRect().width,
            animation: styles.animationName,
          };
        }),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });
    expect(layers.pointerEvents).toBe("none");
    expect(layers.gridBackground).toContain("radial-gradient");
    expect(layers.cardBackground).toMatch(/^rgb\(/);
    expect(layers.orbs[0].background).not.toBe(layers.orbs[1].background);
    for (const orb of layers.orbs) {
      const channels = orb.background.match(/[\d.]+/g)?.map(Number) ?? [];
      expect(channels[3] ?? 1).toBeGreaterThan(0.08);
      expect(orb.opacity).toBeGreaterThan(0);
      expect(orb.filter).toContain("blur");
      expect(orb.width).toBeGreaterThan(300);
      expect(orb.animation).toBe("none");
    }
    expect(layers.scrollWidth).toBeLessThanOrEqual(layers.viewportWidth + 1);
  });
}
