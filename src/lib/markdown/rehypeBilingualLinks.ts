import type { Root, Element } from "hast";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";
import { visitParents } from "unist-util-visit-parents";

interface Inventory { paths: Set<string>; headingMaps: Record<string, Record<string,string>>; }
const FIXED = ["/", "/author", "/papers", "/topics", "/archives", "/map", "/agents"];
function publicMarkdown(file: string): boolean {
  if (!existsSync(file)) return false;
  const text=readFileSync(file,"utf8").replace(/^\uFEFF/, "");
  const match=/^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return false;
  const parsed=parseDocument(match[1]);
  return parsed.errors.length===0 && parsed.get("draft")!==true;
}
function inventory(): Inventory {
  const paths=new Set(FIXED);
  const root=join(process.cwd(),"src/content");
  const walk=(directory: string,prefix=""): string[] => !existsSync(directory) ? [] : readdirSync(directory,{withFileTypes:true}).flatMap(entry=>
    entry.isSymbolicLink() ? [] : entry.isDirectory() ? walk(join(directory,entry.name),prefix+entry.name+"/") : entry.name.endsWith(".md") ? [prefix+entry.name] : []);
  for (const collection of ["posts","papers","topics","concepts"]) {
    for (const file of walk(join(root,"en",collection))) {
      if(publicMarkdown(join(root,collection,file)) && publicMarkdown(join(root,"en",collection,file))) paths.add(`/${collection}/${file.slice(0,-3)}`);
    }
  }
  let entries: Record<string,{headingMap?: Record<string,string>}>={};
  const state=join(process.cwd(),"src/data/translation-state.json");
  if(existsSync(state)) entries=JSON.parse(readFileSync(state,"utf8")).entries ?? {};
  return {paths,headingMaps:Object.fromEntries(Object.entries(entries).map(([key,entry])=>["/"+key.replace(/\.md$/,""),entry.headingMap??{}]))};
}
export function localizeMarkdownHref(href: string, data: Inventory): {href:string; sourceFallback?:boolean} {
  if(!href.startsWith("/") || href.startsWith("//") || /^\/en(?:\/|$)/.test(href)) return {href};
  const url=new URL(href,"https://local.invalid");
  if(!/^\/(?:$|(?:posts|papers|topics|concepts)(?:\/|$)|(?:author|archives|map|agents)$)/.test(url.pathname))return {href};
  if(!data.paths.has(url.pathname))return {href,sourceFallback:true};
  if(url.hash) {
    let fragment;try{fragment=decodeURIComponent(url.hash.slice(1));}catch{return {href,sourceFallback:true};}
    const mapped=data.headingMaps[url.pathname]?.[fragment];
    if(!mapped)return {href,sourceFallback:true};
    url.hash=mapped;
  }
  return {href:"/en"+(url.pathname==="/"?"":url.pathname)+url.search+url.hash};
}
export function rehypeBilingualLinks() {
  return (tree: Root,file?:{path?:string})=>{
    if(!/\/src\/content\/en\//.test((file?.path??"").replace(/\\/g,"/")))return;
    const data=inventory();
    visitParents(tree,"element",node=>{
      const link=node as Element;
      if(link.tagName!=="a" || typeof link.properties?.href!=="string")return;
      const result=localizeMarkdownHref(link.properties.href,data);
      link.properties.href=result.href;
      if(result.sourceFallback){link.properties.lang="zh-CN";link.properties["data-source-fallback"]="";link.properties.title="Chinese source (translation or matching section pending)";}
    });
  };
}
