import { describe, expect, it } from "vitest";
import { analyticsAllowed, cleanPath, sourceLabel, outboundKind, readingMilestones, parsePublicCount, eventPath } from "./model";

describe("privacy-preserving analytics contract", () => {
  it("automatically collects anonymous site statistics unless opted out or privacy signals block it", () => {
    expect(analyticsAllowed({host:"a-znk.com", preference:"on"})).toBe(true);
    for (const host of ["localhost", "127.0.0.1", "myblog-test.vercel.app", "a-znk.com.evil.test"]) expect(analyticsAllowed({host,preference:"on"})).toBe(false);
    expect(analyticsAllowed({host:"a-znk.com",preference:null})).toBe(true);
    for (const preference of ["off", "broken"]) expect(analyticsAllowed({host:"a-znk.com",preference})).toBe(false);
    expect(analyticsAllowed({host:"a-znk.com",preference:null,dnt:"1"})).toBe(false);
    expect(analyticsAllowed({host:"a-znk.com",preference:null,gpc:true})).toBe(false);
    expect(analyticsAllowed({host:"a-znk.com",preference:"on",dnt:"1"})).toBe(false);
    expect(analyticsAllowed({host:"a-znk.com",preference:"on",gpc:true})).toBe(false);
  });
  it("strips queries, fragments and disallows dynamic/unknown paths", () => {
    expect(cleanPath("/en/posts/paragraph-anchor-design/?email=secret#x")).toBe("/en/posts/paragraph-anchor-design");
    expect(cleanPath("/search?query=private")).toBe(null);
    expect(cleanPath("//evil.test/secret")).toBe(null);
    expect(cleanPath("/posts/email@example.com")).toBe(null);
    expect(cleanPath("/privacy")).toBe(null);
    expect(cleanPath("/")).toBe("/");
  });
  it("uses bounded campaign source labels and origin-only referrers", () => {
    expect(sourceLabel("https://a-znk.com/?utm_source=telegram&utm_campaign=secret", "https://search.test/private?email=secret")).toBe("campaign:telegram");
    expect(sourceLabel("https://a-znk.com/?utm_source=some-person", "https://google.com/search?q=secret")).toBe("https://google.com");
    expect(sourceLabel("https://a-znk.com/", "https://a-znk.com/posts/foo")).toBe("");
    expect(sourceLabel("https://a-znk.com/", "javascript:alert(1)")).toBe("");
  });
  it("tracks outbound category, never private address or invite code", () => {
    expect(outboundKind("mailto:secret@example.com", "https://a-znk.com")).toBe("email");
    expect(outboundKind("https://t.me/+secret-invite", "https://a-znk.com")).toBe("telegram");
    expect(outboundKind("https://discord.gg/private", "https://a-znk.com")).toBe("discord");
    expect(outboundKind("/rss.xml", "https://a-znk.com")).toBe("rss");
    expect(outboundKind("/posts/foo", "https://a-znk.com")).toBe(null);
  });
  it("requires active time before reporting scroll milestones; deduplicates", () => {
    expect(readingMilestones(0.99, 2, new Set())).toEqual([]);
    expect(readingMilestones(0.76, 30, new Set([25]))).toEqual([50,75]);
    expect(readingMilestones(0.9, 30, new Set([25,50,75,90]))).toEqual([]);
    expect(readingMilestones(Number.NaN, 50, new Set())).toEqual([]);
  });
  it("builds bounded event names and parses counters without inventing values", () => {
    expect(eventPath("bionic_on", "/en/posts/example")).toBe("bionic_on:/en/posts/example");
    expect(parsePublicCount({count:"1,234"})).toBe(1234);
    expect(parsePublicCount({count:"0"})).toBe(0);
    for(const v of [{}, {count:"NaN"}, {count:"-2"}, {count:1.5}, {count:"not available"}, null]) expect(parsePublicCount(v)).toBe(null);
  });
});
