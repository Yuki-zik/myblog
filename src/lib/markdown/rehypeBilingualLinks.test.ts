import {describe,it,expect} from "vitest";
import {localizeMarkdownHref} from "./rehypeBilingualLinks";
const data={paths:new Set(["/","/posts/a","/topics/ai"]),headingMaps:{"/posts/a":{"研究范围":"research-scope"}}};
describe("translated Markdown links",()=>{
 it("uses translated routes and maps known fragments",()=>{
  expect(localizeMarkdownHref("/posts/a",data)).toEqual({href:"/en/posts/a"});
  expect(localizeMarkdownHref("/posts/a#研究范围",data).href).toBe("/en/posts/a#research-scope");
  expect(localizeMarkdownHref("/",data)).toEqual({href:"/en"});
 });
 it("uses labelled real Chinese links when translation or fragment is missing",()=>{
  expect(localizeMarkdownHref("/posts/missing",data)).toEqual({href:"/posts/missing",sourceFallback:true});
  expect(localizeMarkdownHref("/posts/a#unmapped",data)).toEqual({href:"/posts/a#unmapped",sourceFallback:true});
 });
 it("leaves references, external links, assets and already-localized URLs unchanged",()=>{
  for(const href of ["#note-1","https://example.org/posts/a","//example.org/posts/a","/image.svg","/en/posts/a"])expect(localizeMarkdownHref(href,data)).toEqual({href});
 });
});
