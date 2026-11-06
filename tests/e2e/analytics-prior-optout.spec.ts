import {expect, test} from "@playwright/test";

test("previous opt-out remains respected after auto-statistics rollout",async({page})=>{
  const collected:string[]=[];
  await page.addInitScript(()=>{
    localStorage.setItem("analytics-consent-v1","off");
    Object.defineProperty(navigator,"webdriver",{get:()=>false});
  });
  await page.route("**/*",async route=>{
    const url=new URL(route.request().url());
    if(url.hostname!=="a-znk.com")return route.abort();
    if(url.pathname==="/_analytics/count") {collected.push(url.search);return route.fulfill({status:204,body:""});}
    if(url.pathname.startsWith("/_analytics/counter/"))return route.fulfill({status:404,contentType:"application/json",body:'{"count":"0"}'});
    if(url.pathname.startsWith("/_waline/"))return route.fulfill({contentType:"application/json",body:'{"errno":0,"data":{"data":[],"count":0}}'});
    const response=await page.request.get("http://127.0.0.1:4173"+url.pathname+url.search);
    return route.fulfill({response});
  });
  await page.goto("https://a-znk.com/en/posts/myblog-design-manual");
  await expect(page.locator('script[src*="count.v2.7.0"]')).toHaveCount(0);
  await page.getByRole("button",{name:"Bionic reading"}).click();
  await page.reload();
  expect(collected).toEqual([]);
  await page.goto("https://a-znk.com/en/privacy");
  await expect(page.locator('[data-analytics-choice="off"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("[data-analytics-status]")).toContainText("off on this browser");
  expect(collected).toEqual([]);
  await expect(page.locator('[data-analytics-choice="on"]')).toBeEnabled();
});

test("front page has a simple privacy link with no mandatory analytics prompt",async({page})=>{
  await page.goto("/");
  await expect(page.locator("footer a[href='/privacy']")).toBeVisible();
  await expect(page.locator("footer [data-analytics-controls]")).toHaveCount(0);
  await expect(page.locator("[data-analytics-controls]")).toHaveCount(0);
});
