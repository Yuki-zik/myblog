import {test, expect} from "@playwright/test";
import {waitForFontsSettled} from "./helpers/page-state";

const routes = [
  ["home", "/"], ["topics", "/topics"], ["topic", "/topics/ai-coding"],
  ["papers", "/papers"], ["paper", "/papers/duap-multilingual-speech-privacy"],
  ["archives", "/archives"], ["author", "/author"], ["concept", "/concepts/anchor-id"],
  ["map", "/map"], ["404", "/404"], ["article", "/posts/paragraph-anchor-design"],
] as const;

for (const scheme of ["light", "dark"] as const) {
  for (const width of [1440, 390]) {
    test(`shared paper identity across all page families (${scheme}, ${width}px)`, async ({page}, testInfo) => {
      test.setTimeout(180_000);
      await page.setViewportSize({width, height: width === 1440 ? 960 : 844});
      await page.emulateMedia({colorScheme: scheme, reducedMotion: "reduce"});
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      for (const [name, route] of routes) {
        await page.goto(route);
        await waitForFontsSettled(page);
        await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
        await expect(page.locator(".site-header")).toHaveAttribute("data-header-variant", "drawing");
        await expect(page.locator("h1")).toHaveCount(1);
        const paint = await page.evaluate(() => {
          const resolve=(token: string)=>{
            const probe=document.createElement("span"); probe.style.color=`var(${token})`;
            document.body.append(probe); const color=getComputedStyle(probe).color;probe.remove();
            const canvas=document.createElement("canvas");canvas.width=canvas.height=1;
            const ctx=canvas.getContext("2d")!;ctx.fillStyle=color;ctx.fillRect(0,0,1,1);
            return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3);
          };
          const luminance=(rgb: number[])=>rgb.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
          const ink=resolve("--drawing-accent-ink"),paper=resolve("--surface-primary");
          const a=luminance(ink),b=luminance(paper);
          const active=document.querySelector('.site-nav a[aria-current="page"]');
          return {
            ink, link:resolve("--link"), button:resolve("--button-primary-bg"),
            contrast:(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05),
            overflow:document.documentElement.scrollWidth-innerWidth,
            activeColor:active?getComputedStyle(active).color:null,
            activeExpected:(()=>{const p=document.createElement("span");p.style.color="var(--drawing-accent-ink)";document.body.append(p);const c=getComputedStyle(p).color;p.remove();return c;})(),
          };
        });
        expect(paint.overflow, `${route}: horizontal overflow`).toBeLessThanOrEqual(1);
        expect(paint.link, `${route}: shared link ink`).toEqual(paint.ink);
        expect(paint.button, `${route}: shared action token`).toEqual(paint.ink);
        expect(paint.contrast, `${route}: small accent-label contrast`).toBeGreaterThanOrEqual(4.5);
        if (paint.activeColor) expect(paint.activeColor, `${route}: active navigation`).toBe(paint.activeExpected);
        await expect(page.locator(".discover-page__ambient")).toHaveCount(0);
        const action=page.locator(".discover-action").first();
        if (await action.count()) expect(await action.evaluate(el=>parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBe(0);
        const surface=page.locator(".discover-surface").first();
        if (await surface.count()) expect(await surface.evaluate(el=>parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeLessThanOrEqual(2);
        const screenshot=testInfo.outputPath(`style-${name}-${width}-${scheme}.png`);
        await page.screenshot({path:screenshot, timeout:15000});
        await testInfo.attach(`style-${name}-${width}-${scheme}`, {path:screenshot,contentType:"image/png"});
      }
      expect(errors).toEqual([]);
    });
  }
}
