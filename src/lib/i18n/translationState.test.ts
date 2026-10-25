import {describe, it, expect} from "vitest";
import {deriveTranslationState} from "./translationState";
describe("translation freshness", () => {
  const entry={sourceHash:"source-v1",targetHash:"english-v1"};
  it("distinguishes current, missing and untracked translations",()=>{
    expect(deriveTranslationState("source-v1","english-v1",entry)).toBe("current");
    expect(deriveTranslationState("source-v1",undefined,entry)).toBe("missing");
    expect(deriveTranslationState("source-v1","english-v1")).toBe("untracked");
  });
  it("never presents old English as updated source",()=>{
    expect(deriveTranslationState("source-v2","english-v1",entry)).toBe("stale");
    expect(deriveTranslationState("source-v2","manually-revised",entry)).toBe("stale");
  });
  it("recognizes manual target edits without overwriting them",()=>{
    expect(deriveTranslationState("source-v1","manually-revised",entry)).toBe("manual");
  });
});
