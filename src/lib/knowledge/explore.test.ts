import {describe, it, expect} from "vitest";
import {filterExploreNodes, getRelatedNodes, buildReadingTrails, layoutExploreNodes, wrapNodeTitle} from "./explore";
import type {KnowledgeGraph, GraphNode} from "./graph";
const n=(id:string,type:GraphNode["type"]="topic", summary=""):GraphNode=>({id,type,title:id,url:"/topics/"+id,summary});
const graph:KnowledgeGraph={nodes:[n("topic:agent-engineering"),n("post:ant-ai-coding-review","post","上下文与工具"),n("topic:exam-review"),n("other","concept")],edges:[{source:"topic:agent-engineering",target:"post:ant-ai-coding-review"},{source:"post:ant-ai-coding-review",target:"topic:exam-review"}]};
describe("explore helpers",()=>{
  it("searches normalized titles and summaries together with the type filter",()=>{
    expect(filterExploreNodes(graph.nodes,"上下文","all").map(x=>x.id)).toEqual(["post:ant-ai-coding-review"]);
    expect(filterExploreNodes([n("AI Coding")],"ＡＩ","topic")).toHaveLength(1);
    expect(filterExploreNodes(graph.nodes,"上下文","topic")).toHaveLength(0);
  });
  it("only returns real neighboring nodes, including incoming edges",()=>{
    expect(getRelatedNodes(graph,"post:ant-ai-coding-review").map(x=>x.id).sort()).toEqual(["topic:agent-engineering","topic:exam-review"]);
    expect(getRelatedNodes(graph,"missing")).toEqual([]);
  });
  it("offers only curated routes whose every node and edge exists",()=>{
    const trails=buildReadingTrails(graph);
    expect(trails).toHaveLength(1);
    expect(trails[0].nodes.map(n=>n.id)).toEqual(["topic:agent-engineering","post:ant-ai-coding-review","topic:exam-review"]);
    expect(buildReadingTrails({...graph,edges:[]})).toEqual([]);
    expect(buildReadingTrails({...graph,nodes:[]})).toEqual([]);
  });
  it("positions each real node once with stable, non-overlapping columns",()=>{
    const a=layoutExploreNodes(graph.nodes);expect(a).toEqual(layoutExploreNodes([...graph.nodes].reverse()));
    expect(a.nodes).toHaveLength(graph.nodes.length);
    for(const p of a.nodes){expect(p.x).toBeGreaterThan(0);expect(p.y).toBeLessThan(a.height);}
    for(const type of ["post","topic","concept"]){const ys=a.nodes.filter(x=>x.type===type).map(x=>x.y).sort((a,b)=>a-b);for(let i=1;i<ys.length;i++)expect(ys[i]-ys[i-1]).toBeGreaterThanOrEqual(82);}
    expect(layoutExploreNodes([]).nodes).toEqual([]);
  });
  it("wraps long CJK titles without dropping their full source text",()=>{
    const title="如何把很多篇文章组织成可反复探索的研究笔记";
    expect(wrapNodeTitle(title).join("")).toBe(title);
    expect(wrapNodeTitle("AI Coding")).toEqual(["AI Coding"]);
  });
});
