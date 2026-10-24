import { expect, test, type Page } from "@playwright/test";
import { waitForFontsSettled, waitForScrollSettled } from "./page-state";

const articles = [
  { slug: "paragraph-anchor-design", notes: 10, refs: 10 },
  { slug: "ant-ai-coding-review", notes: 8, refs: 8 },
  { slug: "myblog-design-manual", notes: 4, refs: 5 },
] as const;
const widths = [320, 390, 768, 1100, 1180, 1280, 1281, 1440, 1920];

async function noteProblems(page: Page) {
  return page.evaluate(() => {
    const errors: string[] = [];
    const body = document.querySelector<HTMLElement>("[data-post-body]")!;
    const layer = document.querySelector<HTMLElement>("[data-post-scholar-floating-layer]")!;
    const refs = [...body.querySelectorAll<HTMLAnchorElement>("a[data-footnote-ref]")];
    const notes = [...document.querySelectorAll<HTMLElement>("[data-marginalia-bubble]")];
    const footnotes = notes.filter(note => note.hasAttribute("data-footnote-rail-item"));
    const unique = new Set(refs.map(ref => ref.dataset.footnoteRailTarget));
    if (unique.has(undefined)) errors.push("a reference bypassed the note compiler");
    if (footnotes.length !== unique.size) errors.push("missing or duplicated note bodies");
    if (body.querySelector("[data-footnotes]")) errors.push("raw endnotes remain in the body");
    if ([...body.querySelectorAll("h2,h3")].some(h => h.id === "footnote-label")) errors.push("endnote label leaked into TOC");
    for (const ref of refs) {
      const target = document.getElementById(decodeURIComponent(ref.hash.slice(1)));
      if (!target?.matches("[data-footnote-rail-item]")) errors.push(`unresolved note: ${ref.hash}`);
    }
    const boxes = notes.map(note => ({note, rect:note.getBoundingClientRect()}));
    for (const {note, rect} of boxes) {
      const content = note.querySelector<HTMLElement>(".post-scholar-footnote-body")!;
      const c = content.getBoundingClientRect();
      if (c.width < 180) errors.push(`${note.id}: unreadably narrow (${c.width}px)`);
      if (!content.textContent?.trim()) errors.push(`${note.id}: empty`);
      if (rect.left < -1 || rect.right > innerWidth + 1) errors.push(`${note.id}: outside viewport`);
      if (c.left < rect.left - 1 || c.right > rect.right + 1) errors.push(`${note.id}: body outside note`);
      for (const p of content.querySelectorAll<HTMLElement>("p")) {
        if (p.scrollWidth > p.clientWidth + 1) errors.push(`${note.id}: overflowing paragraph`);
        if (parseFloat(getComputedStyle(p).fontSize) < 14) errors.push(`${note.id}: text too small`);
      }
      for (const other of document.querySelectorAll<HTMLElement>(".post-title-card, .post-waline-comments-section, .post-pager")) {
        const box=other.getBoundingClientRect();
        if (Math.min(rect.right,box.right)-Math.max(rect.left,box.left)>1 && Math.min(rect.bottom,box.bottom)-Math.max(rect.top,box.top)>1) errors.push(`${note.id}: overlaps ${other.className}`);
      }
      if (innerWidth>1280 && layer.dataset.marginaliaLayout !== "floating") {
        const main=document.querySelector(".post-reading-main")!.getBoundingClientRect();
        if (rect.top<main.bottom-1) errors.push(`${note.id}: fallback must follow the article, clear of its cover`);
      }
      const source = note.dataset.anchorId;
      if (source && !document.getElementById("c-" + source)) errors.push(`${note.id}: missing source paragraph ${source}`);
      if (layer.dataset.marginaliaLayout === "floating") {
        if (rect.left < body.getBoundingClientRect().right - 1) errors.push(`${note.id}: overlaps main reading column`);
      }
    }
    for (let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++) {
      const a=boxes[i].rect,b=boxes[j].rect;
      if (Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1) errors.push(`${boxes[i].note.id} overlaps ${boxes[j].note.id}`);
    }
    if (document.documentElement.scrollWidth > innerWidth+1) errors.push("horizontal page overflow");
    return errors;
  });
}

export function registerMarginaliaTests(browserName: "chromium" | "webkit") {
  test.describe(`${browserName} bilingual marginalia`, () => {
    for (const article of articles) for (const scheme of ["light", "dark"] as const) {
      test(`${article.slug}: complete readable notes across breakpoints in ${scheme}`, async ({page}, testInfo) => {
        const errors: string[]=[];page.on("pageerror",error=>errors.push(error.message));
        await page.emulateMedia({colorScheme:scheme,reducedMotion:"reduce"});
        await page.goto(`/en/posts/${article.slug}`);
        await expect(page.locator("[data-footnote-rail-item]")).toHaveCount(article.notes);
        await expect(page.locator("[data-post-body] a[data-footnote-ref]")).toHaveCount(article.refs);
        for (const width of widths) {
          await page.setViewportSize({width,height:1000});
          await waitForFontsSettled(page);
          await expect(page.locator("[data-post-scholar-floating-layer]")).toHaveAttribute("data-marginalia-layout",width>1280?"floating":"flow");
          await expect.poll(()=>noteProblems(page),{message:`${article.slug} ${width}px ${scheme}`}).toEqual([]);
          if (article.slug==="paragraph-anchor-design" && (width===390 || width===1440)) {
            const note=page.locator('[data-footnote-rail-item="ref-supabase-rls"]');
            await note.scrollIntoViewIfNeeded();
            await waitForScrollSettled(page);
            await page.screenshot({path:testInfo.outputPath(`notes-${width}-${scheme}.png`)});
          }
        }
        expect(errors).toEqual([]);
      });
    }
    test("repeated citations, source links and list-item notes retain round-trip navigation", async ({page}) => {
      await page.setViewportSize({width:1440,height:1000});
      await page.emulateMedia({reducedMotion:"reduce"});
      await page.goto("/en/posts/myblog-design-manual");
      await waitForFontsSettled(page);
      const refs=page.locator('[data-post-body] [data-footnote-rail-target="ref-hig"]');
      const note=page.locator('[data-footnote-rail-item="ref-hig"]');
      await expect(refs).toHaveCount(2);await expect(note).toHaveCount(1);
      await refs.last().click();await expect(note).toBeInViewport();
      await note.locator("[data-footnote-rail-source]").click();
      await expect(refs.first()).toBeFocused();await expect(refs.first()).toBeInViewport();
      await expect(note.locator('[data-footnote-backref]')).toHaveCount(0);
      await expect(note.getByRole("link",{name:"Apple Human Interface Guidelines",exact:true})).toHaveAttribute("href","https://developer.apple.com/design/human-interface-guidelines/");
      await page.goto("/en/posts/ant-ai-coding-review");
      const listNote=page.locator('[data-footnote-rail-item="note-5"]');
      await expect(listNote).toHaveAttribute("data-anchor-id",/::li\d+$/);
      await listNote.locator("[data-footnote-rail-source]").click();
      await expect(page.locator('[data-post-body] [data-footnote-rail-target="note-5"]')).toBeFocused();
    });
    for (const locale of ["", "/en"]) {
      test(`notes remain readable and native targets resolve without JavaScript: ${locale||"Chinese"}`,async({browser,baseURL})=>{
        const context=await browser.newContext({baseURL,javaScriptEnabled:false,viewport:{width:1440,height:1000}});
        const page=await context.newPage();
        for(const width of [390,1440]){
          await page.setViewportSize({width,height:1000});
          await page.goto(`${locale}/posts/paragraph-anchor-design`);
          await expect(page.locator('[data-footnote-rail-item]')).toHaveCount(10);
          await expect.poll(()=>noteProblems(page)).toEqual([]);
          await page.locator('[data-post-body] a[data-footnote-ref]').first().click();
          await expect(page.locator('[data-footnote-rail-item="note-anchor-contract"]')).toBeInViewport();
        }
        await context.close();
      });
    }
    test("Chinese notes preserve the same reading contract after the shared fix",async({page})=>{
      for(const article of articles){
        await page.goto(`/posts/${article.slug}`);
        await expect(page.locator('[data-footnote-rail-item]')).toHaveCount(article.notes);
        for(const width of [390,1280,1281,1440]){
          await page.setViewportSize({width,height:1000});
          await waitForFontsSettled(page);
          await expect.poll(()=>noteProblems(page)).toEqual([]);
        }
      }
    });
  });
}
