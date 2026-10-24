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
    const result = localizeStructuredData({"@id":"https://a-znk.com/#website",inLanguage:"zh-CN",url:"https://a-znk.com/posts/test"}, "en", new URL("https://a-znk.com"));
    expect(result["@id"]).toBe("https://a-znk.com/#website");
    expect(result.url).toBe("https://a-znk.com/en/posts/test");
    expect(result.inLanguage).toBe("en");
  });
});
