import type {GraphNode, GraphNodeType, KnowledgeGraph} from "./graph";

export const EXPLORE_LABEL = "漫游";
export const NODE_LABELS: Record<GraphNodeType, string> = {topic: "主题", post: "笔记", concept: "概念"};
export type NodeFilter = GraphNodeType | "all";
const normalize=(value:string)=>value.normalize("NFKC").trim().toLocaleLowerCase();

export function filterExploreNodes(nodes: GraphNode[], query: string, type: NodeFilter): GraphNode[] {
  const text=normalize(query);
  return nodes.filter(node=>(type==="all"||node.type===type)&&(!text||normalize(node.title+" "+(node.summary??"")).includes(text)));
}

export function getRelatedNodes(graph: KnowledgeGraph, id: string): GraphNode[] {
  const ids=new Set(graph.edges.flatMap(edge=>edge.source===id?[edge.target]:edge.target===id?[edge.source]:[]));
  return graph.nodes.filter(node=>ids.has(node.id));
}

export interface ReadingTrail {id:string; title:string; description:string; nodes:GraphNode[];}
const trailDefinitions=[
  {id:"build",title:"从生成代码，到真正交付",description:"一次限时开发复盘，连接 Agent 的工程方法与实战中的取舍。",ids:["topic:agent-engineering","post:ant-ai-coding-review","topic:exam-review"]},
  {id:"organize",title:"让旧笔记长出新的联系",description:"从主题入口开始，理解文章如何被重新找到、引用与组织。",ids:["topic:knowledge-network","post:why-topic-first","concept:anchor-id"]},
  {id:"discuss",title:"把讨论放回具体的段落",description:"沿着锚点与交互的线索，把阅读、反馈和实现串在一起。",ids:["topic:paragraph-review","post:paragraph-anchor-design","concept:optimistic-ui"]}
];

/** Never synthesize a relation for the sake of a decorative reading path. */
export function buildReadingTrails(graph:KnowledgeGraph):ReadingTrail[] {
  const byId=new Map(graph.nodes.map(n=>[n.id,n]));
  const connected=(a:string,b:string)=>graph.edges.some(e=>(e.source===a&&e.target===b)||(e.source===b&&e.target===a));
  return trailDefinitions.flatMap(({ids,...trail})=>{
    if(!ids.every(id=>byId.has(id))||!ids.slice(1).every((id,i)=>connected(ids[i],id)))return [];
    return [{...trail,nodes:ids.map(id=>byId.get(id)!)}];
  });
}

/** A stable semantic layout makes filtering predictable and keeps all labels apart. */
export function layoutExploreNodes(nodes:GraphNode[]) {
  const columns:GraphNodeType[]=["topic","post","concept"];
  const groups=columns.map(type=>nodes.filter(n=>n.type===type).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0));
  const height=Math.max(520,...groups.map(g=>g.length*88+104));
  const positions=groups.flatMap((group,column)=>group.map((node,i)=>({
    ...node,x:[144,454,764][column],y:group.length===1?height/2:86+i*(height-146)/(group.length-1),width:[230,258,206][column]
  })));
  return {width:908,height,nodes:positions};
}

export function wrapNodeTitle(text:string, units=23):string[] {
  if(!text)return [];
  const width=(value:string)=>Array.from(value).reduce((sum,char)=>sum+(/[\u0000-\u007f]/.test(char)?1:1.75),0);
  const limit=Math.max(1.75,units);
  const parts:string[]=[];
  // Latin words stay intact; source spaces belong to the preceding part so a
  // visual line break never loses text or leaves the next line starting blank.
  for(const part of text.match(/[A-Za-z0-9]+(?:[-_./][A-Za-z0-9]+)*|\s+|./gu)??[]){
    if(/^\s+$/u.test(part)&&parts.length){parts[parts.length-1]+=part;continue;}
    parts.push(...(width(part)>limit?Array.from(part):[part]));
  }
  type Breaks={lines:string[];cost:number};
  const best:Breaks[]=Array(parts.length+1);
  best[parts.length]={lines:[],cost:0};
  // Among layouts using the fewest lines, balance their measures and prefer
  // phrase boundaries. This avoids the one-character tails seen in real nodes.
  for(let start=parts.length-1;start>=0;start--){
    let line="";
    for(let end=start;end<parts.length;end++){
      line+=parts[end];
      const measure=width(line.trimEnd());
      if(measure>limit)break;
      const rest=best[end+1];
      const next=parts[end+1]??"";
      const phraseBreak=/[A-Za-z0-9]\s+$/u.test(line)&&/^[A-Za-z0-9]/.test(next);
      const orphan=Array.from(line.trim()).length===1;
      const startsWithPunctuation=/^[，。！？：；、…,.!?;:)\]）》】”’]/u.test(line.trimStart());
      const candidate={
        lines:[line,...rest.lines],
        cost:rest.cost+(limit-measure)**2+(phraseBreak?limit**2/8:0)+((orphan||startsWithPunctuation)?limit**2:0)
      };
      if(!best[start]||candidate.lines.length<best[start].lines.length||
        (candidate.lines.length===best[start].lines.length&&candidate.cost<best[start].cost))best[start]=candidate;
    }
  }
  return best[0].lines;
}
