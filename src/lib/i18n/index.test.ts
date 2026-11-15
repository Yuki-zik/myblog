import { describe, expect, it } from "vitest";
import { createTranslator, getLocale, localizePath, localizeData, localizeStructuredData } from "./index";

describe("language-aware routes", () => {
  it("retains Chinese URLs and gives English its own canonical paths", () => {
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/posts/example", "en")).toBe("/en/posts/example");
    expect(localizePath("/en/posts/example", "zh-CN")).toBe("/posts/example");
    expect(localizePath("/en/author", "en")).toBe("/en/author");
    expect(getLocale("/en/papers")).toBe("en");
    expect(getLocale("/engineering")).toBe("zh-CN");
  });
  it("preserves query strings, fragments, assets and external links", () => {
    expect(localizePath("/map?focus=topic%3Aai#connections", "en")).toBe("/en/map?focus=topic%3Aai#connections");
    for (const path of ["https://example.org/author", "//example.org/author", "/author-avatar.png", "/_astro/image.png", "#research", "/_waline/api/comment"]) expect(localizePath(path, "en")).toBe(path);
  });
  it("uses real translated strings and parameterized messages", () => {
    expect(createTranslator("en")("约 {0} 分钟", [3])).toBe("about 3 min");
    expect(createTranslator("zh-CN")("约 {0} 分钟", [3])).toBe("约 3 分钟");
    expect(localizeData({href:"/author", title:"研究方向"}, "en")).toEqual({href:"/en/author",title:"Research tracks"});
  });
  it("keeps shared schema identity stable while localizing page URLs", () => {
    const result = localizeStructuredData({
      "@type":"WebSite",
      "@id":"https://a-znk.com/#website",
      name:"A-Znk的blog",
      alternateName:["A-Znk Blog", "A-Znk的博客"],
      inLanguage:"zh-CN",
      url:"https://a-znk.com/posts/test",
      image:"https://a-znk.com/og/posts/test.png"
    }, "en", new URL("https://a-znk.com"));
    expect(result["@id"]).toBe("https://a-znk.com/#website");
    expect(result.name).toBe("A-Znk Blog");
    expect(result.alternateName).toEqual(["A-Znk的blog", "A-Znk的博客"]);
    expect(result.url).toBe("https://a-znk.com/en/posts/test");
    expect(result.image).toBe("https://a-znk.com/og/en/posts/test.png");
    expect(result.inLanguage).toBe("en");
  });
  it("localizes GEO endpoints (llms.txt and llms-full.txt)", () => {
    expect(localizePath("/llms.txt", "en")).toBe("/en/llms.txt");
    expect(localizePath("/llms-full.txt", "en")).toBe("/en/llms-full.txt");
    expect(localizePath("/en/llms.txt", "zh-CN")).toBe("/llms.txt");
  });
});
