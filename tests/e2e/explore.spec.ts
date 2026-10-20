import {expect,test} from "@playwright/test";
import {waitForFontsSettled} from "./helpers/page-state";

test("roaming is discoverable in navigation and rich homepage/topic entrances",async({page})=>{
  await page.goto("/");
  await expect(page.locator('.site-nav a[href="/map"]')).toHaveText("漫游");
  const entry=page.locator("[data-explore-gateway]");await expect(entry).toBeVisible();
  await expect(entry.locator(".explore-gateway__preview")).toContainText("Agent Engineering");
  await entry.click();await expect(page).toHaveURL(/\/map$/);await expect(page.locator("h1")).toHaveText("漫游↗");
  await expect(page.locator('.site-nav a[href="/map"]')).toHaveAttribute("aria-current","page");
  await page.goto("/topics");await expect(page.locator("[data-explore-gateway]")).toBeVisible();
});

test("real nodes support search, type filtering and a complete preview without navigation",async({page})=>{
  await page.goto("/map");await page.locator('[data-explore-ready="true"]').waitFor();
  await expect(page.locator(".kg-sky,.kg-starfield")).toHaveCount(0);
  await expect(page.locator("[data-reading-trail]")).toHaveCount(3);
  await page.getByRole("button",{name:"列表视图",exact:true}).click();
  await page.getByRole("searchbox",{name:"搜索漫游内容"}).fill("蚂蚁");
  await expect(page.locator(".explore-node-list > button")).toHaveCount(1);
  await page.locator(".explore-node-list > button").click();
  await expect(page.locator(".explore-inspector h3")).toHaveText("蚂蚁 AI Coding 笔试复盘");
  await expect(page.locator(".explore-inspector__read")).toHaveAttribute("href","/posts/ant-ai-coding-review");
  await expect(page).toHaveURL(/\/map/);
  await page.getByRole("searchbox",{name:"搜索漫游内容"}).fill("zz-no-such-idea-zz");await expect(page.locator(".explore-empty")).toBeVisible();
  await page.getByRole("button",{name:"重置筛选",exact:true}).click();
  await page.getByRole("button",{name:/^仅看概念/}).click();
  await expect(page.locator(".explore-node-list > button")).toHaveCount(2);
  await page.getByRole("button",{name:"全部内容",exact:true}).click();await expect(page.locator(".explore-node-list > button")).toHaveCount(11);
});

test("a reading-trail deep link selects the intended real node",async({page})=>{
  await page.goto("/map?focus=topic%3Aagent-engineering");await page.locator('[data-explore-ready="true"]').waitFor();
  await expect(page.locator(".explore-inspector h3")).toHaveText("Agent Engineering");
  await expect(page.locator(".explore-inspector__neighbors button")).toHaveCount(3);
  await page.locator('.explore-inspector__neighbors button').filter({hasText:"蚂蚁"}).click();
  await expect(page.locator(".explore-inspector h3")).toHaveText("蚂蚁 AI Coding 笔试复盘");
});

for(const width of [320,390,768,1440])for(const scheme of ["light","dark"] as const){
  test(`responsive roaming and its navigation: ${width}px ${scheme}`,async({page})=>{
    await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:scheme,reducedMotion:"reduce"});
    await page.goto("/map");await waitForFontsSettled(page);await page.locator('[data-explore-ready="true"]').waitFor();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator("h1")).toBeInViewport();
    if(width<760)await expect(page.locator(".explore-node-list")).toBeVisible();
    else await expect(page.locator(".explore-map")).toBeVisible();
    const links=page.locator(".site-nav-links");expect(await links.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator("html")).toHaveAttribute("data-color-scheme",scheme);
  });
}

test("reading paths and content links remain available without JavaScript",async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,javaScriptEnabled:false});const page=await context.newPage();
  await page.goto("/map");await expect(page.locator("[data-reading-trail]")).toHaveCount(3);
  await expect(page.locator(".explore-noscript a")).toHaveCount(11);
  await page.locator(".explore-noscript a").first().click();await expect(page).not.toHaveURL(/\/map/);await context.close();
});


test("map nodes can be selected from the keyboard",async({page})=>{
  await page.goto("/map");await page.locator('[data-explore-ready="true"]').waitFor();
  const node=page.getByRole("button",{name:"预览主题：Agent Engineering",exact:true});
  await node.focus();await page.keyboard.press("Enter");
  await expect(page.locator(".explore-inspector h3")).toHaveText("Agent Engineering");
  await expect(node).toHaveAttribute("aria-pressed","true");
});
