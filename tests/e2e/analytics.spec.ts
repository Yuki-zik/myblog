import { expect, test, type Page } from "@playwright/test";

/** Simulate the canonical host while serving ONLY the local production build.
 * Every analytics request is intercepted. No synthetic traffic reaches production. */
async function fixture(page:Page, options:{dnt?:boolean;gpc?:boolean;consent?:string;counterError?:boolean}={}) {
  const sent:URL[]=[];
  await page.addInitScript(options => {
    Object.defineProperty(navigator,"webdriver",{get:()=>false});
    Object.defineProperty(navigator,"doNotTrack",{get:()=>options.dnt ? "1" : "0"});
    Object.defineProperty(navigator,"globalPrivacyControl",{get:()=>!!options.gpc});
    if(options.consent) localStorage.setItem("analytics-consent-v1",options.consent);
  },options);
  await page.route("**/*",async route => {
    const url=new URL(route.request().url());
    if(url.hostname!=="a-znk.com") return route.abort();
    if(url.pathname==="/_analytics/count") {
      expect(route.request().headers()["referer"]).toBeUndefined();
      expect(route.request().headers()["cookie"]).toBeUndefined();
      sent.push(url);return route.fulfill({status:204,body:""});
    }
    if(url.pathname.startsWith("/_analytics/counter/")) return route.fulfill({status:options.counterError ? 503:200,contentType:"application/json",body:JSON.stringify({count:"1,234"})});
    if(url.pathname.startsWith("/_waline/")) return route.fulfill({contentType:"application/json",body:JSON.stringify({errno:0,data:{data:[],count:0}})});
    const response=await page.request.get("http://127.0.0.1:4173"+url.pathname+url.search);
    return route.fulfill({response});
  });
  return sent;
}

test("consent gates collection; URL secrets never leave; off prevents later events",async({page})=>{
  const sent=await fixture(page);
  await page.goto("https://a-znk.com/en/posts/myblog-design-manual?email=private@example.com&utm_source=telegram&utm_campaign=private-token#secret");
  await expect(page.locator("[data-public-visit-count]")).toHaveText("1,234");
  expect(sent).toHaveLength(0);
  await expect(page.locator('script[src*="count.v2.7.0"]')).toHaveCount(0);
  await page.getByRole("button",{name:"Allow anonymous analytics",exact:true}).click();
  await expect.poll(()=>sent.filter(url=>!url.searchParams.get("e")).length).toBe(1);
  const request=sent[0];
  expect(request.searchParams.get("p")).toBe("/en/posts/myblog-design-manual");
  expect(request.searchParams.get("r")).toBe("campaign:telegram");
  expect(request.searchParams.has("q")).toBe(false);
  expect(request.href).not.toMatch(/private|secret|example\.com/);
  await page.getByRole("button",{name:"Bionic reading",exact:true}).click();
  await expect.poll(()=>sent.some(url=>url.searchParams.get("p")==="bionic_on:/en/posts/myblog-design-manual")).toBe(true);
  await page.getByRole("button",{name:"Keep it off",exact:true}).click();
  const before=sent.length;
  await page.getByRole("button",{name:"Bionic reading",exact:true}).click();
  expect(sent.length).toBe(before);
  await page.reload();
  await expect(page.locator("[data-analytics-status]")).toHaveText("Analytics disabled");
  expect(sent.length).toBe(before);
});

for(const privacy of ["dnt","gpc"] as const) test(`${privacy} overrides saved consent`,async({page})=>{
  const sent=await fixture(page,{[privacy]:true,consent:"on"});
  await page.goto("https://a-znk.com/en/posts/myblog-design-manual");
  await expect(page.getByRole("button",{name:"Allow anonymous analytics",exact:true})).toBeDisabled();
  await expect(page.locator("[data-analytics-status]")).toContainText("browser privacy signal");
  await expect(page.locator('script[src*="count.v2.7.0"]')).toHaveCount(0);
  expect(sent).toHaveLength(0);
});

test("failed counter remains unavailable and local previews never collect",async({page})=>{
  await page.goto("/en/posts/myblog-design-manual");
  await page.getByRole("button",{name:"Allow anonymous analytics",exact:true}).click();
  await expect(page.locator('script[src*="count.v2.7.0"]')).toHaveCount(0);
  await fixture(page,{counterError:true});
  await page.goto("https://a-znk.com/en/posts/myblog-design-manual");
  await expect(page.locator("[data-public-visit-count]")).toHaveText("—");
  await expect(page.locator("[data-post-body]")).toBeVisible();
});

for(const locale of ["", "/en"]) for(const scheme of ["light","dark"] as const) test(`privacy preferences remain usable ${locale||"zh"} ${scheme}`,async({page},testInfo)=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({colorScheme:scheme});
  await page.goto(`${locale}/privacy`);
  await expect(page.locator("h1")).toHaveText(locale ? "Privacy & analytics" : "隐私与访问统计");
  const button=page.locator('[data-analytics-choice="on"]').first();
  await button.focus();await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-pressed","true");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('[data-language-switch]')).toHaveAttribute("href",locale ? "/privacy" : "/en/privacy");
  await page.screenshot({path:testInfo.outputPath(`privacy-${locale ? "en":"zh"}-${scheme}.png`),fullPage:true});
});

test("reading milestones require active time and are emitted once; outbound is only a category",async({page})=>{
  const sent=await fixture(page);
  await page.addInitScript(()=>{Object.defineProperty(document,"hasFocus",{value:()=>true});});
  await page.clock.install();
  await page.goto("https://a-znk.com/en/posts/myblog-design-manual");
  await page.getByRole("button",{name:"Allow anonymous analytics",exact:true}).click();
  await expect.poll(()=>sent.length).toBeGreaterThan(0);
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await page.clock.runFor(6000);
  expect(sent.some(url=>url.searchParams.get("p")?.startsWith("read_"))).toBe(false);
  await page.clock.runFor(10000);
  await expect.poll(()=>sent.some(url=>url.searchParams.get("p")==="read_90:/en/posts/myblog-design-manual")).toBe(true);
  await page.clock.runFor(30000);
  await expect.poll(()=>sent.some(url=>url.searchParams.get("p")==="active_30s:/en/posts/myblog-design-manual")).toBe(true);
  for(const name of ["read_25","read_50","read_75","read_90","active_30s"]) expect(sent.filter(url=>url.searchParams.get("p")==name+":/en/posts/myblog-design-manual")).toHaveLength(1);
  await page.evaluate(()=>{const a=document.createElement("a");a.href="https://t.me/+private-invite";a.addEventListener("click",e=>e.preventDefault());document.body.append(a);a.click();a.remove();});
  await expect.poll(()=>sent.some(url=>url.searchParams.get("p")==="outbound_telegram:/en/posts/myblog-design-manual")).toBe(true);
  expect(sent.map(url=>url.href).join(" ")).not.toContain("private-invite");
});
