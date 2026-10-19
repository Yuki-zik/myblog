import {useEffect, useId, useMemo, useState} from "react";
import type {KnowledgeGraph as GraphData, GraphNode} from "../../lib/knowledge/graph";
import {filterExploreNodes, getRelatedNodes, layoutExploreNodes, NODE_LABELS, wrapNodeTitle, type NodeFilter} from "../../lib/knowledge/explore";

interface Props {graph: GraphData;}

/** Server-rendered data, deterministic positions, native links for the actual reading step. */
export default function KnowledgeGraph({graph}:Props) {
  const searchId=useId();
  const initial=graph.nodes.find(n=>n.type==="post")?.id??graph.nodes[0]?.id??"";
  const [selectedId,setSelectedId]=useState(initial);
  const [hoverId,setHoverId]=useState<string|null>(null);
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState<NodeFilter>("all");
  const [view,setView]=useState<"map"|"list"|"auto">("auto");
  const [ready,setReady]=useState(false);
  const layout=useMemo(()=>layoutExploreNodes(graph.nodes),[graph.nodes]);
  const positions=useMemo(()=>new Map(layout.nodes.map(n=>[n.id,n])),[layout]);
  const visible=useMemo(()=>filterExploreNodes(graph.nodes,query,filter),[graph.nodes,query,filter]);
  const visibleIds=new Set(visible.map(n=>n.id));
  const selected=visible.find(n=>n.id===selectedId)??visible[0]??null;
  const related=selected?getRelatedNodes(graph,selected.id):[];
  const activeId=hoverId??selected?.id;
  const activeSet=new Set(activeId?[activeId,...getRelatedNodes(graph,activeId).map(n=>n.id)]:[]);

  useEffect(()=>{
    const requested=new URL(window.location.href).searchParams.get("focus");
    if(requested&&graph.nodes.some(n=>n.id===requested))setSelectedId(requested);
    setView(window.matchMedia("(max-width: 759px)").matches?"list":"map");
    setReady(true);
  },[graph.nodes]);

  const choose=(node:GraphNode,clearFilters=false)=>{
    setSelectedId(node.id);setHoverId(null);
    if(clearFilters){setQuery("");setFilter("all");}
    const url=new URL(window.location.href);url.searchParams.set("focus",node.id);
    window.history.replaceState(window.history.state,"",url.pathname+url.search+url.hash);
  };
  const reset=()=>{setQuery("");setFilter("all");setHoverId(null);};
  const next=()=>{
    const index=visible.findIndex(n=>n.id===selected?.id);
    const node=visible[(index+1)%visible.length];if(node)choose(node);
  };

  return <div className="explore-workspace" data-explore-ready={String(ready)} data-view={view}>
    <div className="explore-toolbar">
      <div className="explore-filter" role="group" aria-label="内容类型">
        {(["all","topic","post","concept"] as const).map(type=><button key={type} type="button" aria-pressed={filter===type} aria-label={type==="all"?"全部内容":`仅看${NODE_LABELS[type]}`} onClick={()=>setFilter(type)}>
          {type==="all"?"全部":NODE_LABELS[type]}<span>{type==="all"?graph.nodes.length:graph.nodes.filter(n=>n.type===type).length}</span>
        </button>)}
      </div>
      <div className="explore-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg>
        <label className="sr-only" htmlFor={searchId}>搜索漫游内容</label>
        <input id={searchId} type="search" value={query} placeholder="搜一个想法…" onChange={e=>setQuery(e.target.value)} />
      </div>
      <div className="explore-view-toggle" role="group" aria-label="浏览方式">
        <button type="button" aria-label="关联图视图" aria-pressed={view!=="list"} onClick={()=>setView("map")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="5" cy="12" r="3"/><circle cx="18" cy="5" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8 11 7-5M8 13l7 5"/></svg><span>关联图</span></button>
        <button type="button" aria-label="列表视图" aria-pressed={view==="list"} onClick={()=>setView("list")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M2 6h2M2 12h2M2 18h2"/></svg><span>列表</span></button>
      </div>
    </div>

    <div className="explore-workspace__body">
      <div className="explore-canvas" aria-label="内容关联浏览">
        <div className="explore-canvas__bar"><span>FIELD OF IDEAS</span><output aria-live="polite">{visible.length} 个条目{query||filter!=="all"?" · 已筛选":` · ${graph.edges.length} 条联系`}</output></div>
        {visible.length===0?<div className="explore-empty" role="status"><span aria-hidden="true">∅</span><h3>这条线索还没有记录</h3><p>换个关键词，或回到全部内容继续逛逛。</p><button type="button" onClick={reset}>重置筛选</button></div>:<>
          <div className="explore-map" tabIndex={0} aria-label="关联图画布，可横向滚动">
            <svg className="knowledge-graph" viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label="主题、笔记与概念的关联图">
              <g className="explore-map__guides" aria-hidden="true">
                {[144,454,764].map((x,i)=><g key={x}><path d={`M${x} 58V${layout.height-22}`}/><text x={x} y="31" textAnchor="middle">{["01 / 主题","02 / 笔记","03 / 概念"][i]}</text></g>)}
              </g>
              <g fill="none" aria-hidden="true">
                {graph.edges.map((edge,i)=>{
                  const a=positions.get(edge.source),b=positions.get(edge.target);
                  if(!a||!b||!visibleIds.has(a.id)||!visibleIds.has(b.id))return null;
                  const active=a.id===activeId||b.id===activeId;
                  const direction=a.x<b.x?1:-1;
                  const x1=a.x+direction*a.width/2,x2=b.x-direction*b.width/2;
                  const same=a.x===b.x;
                  const path=same?`M${a.x-a.width/2} ${a.y} C${a.x-a.width/2-38} ${a.y},${b.x-b.width/2-38} ${b.y},${b.x-b.width/2} ${b.y}`:`M${x1} ${a.y} C${(x1+x2)/2} ${a.y},${(x1+x2)/2} ${b.y},${x2} ${b.y}`;
                  return <path key={i} d={path} className={`explore-map__edge${active?" is-active":""}`}/>;
                })}
              </g>
              {layout.nodes.filter(n=>visibleIds.has(n.id)).map(node=>{
                const lines=wrapNodeTitle(node.title).slice(0,3);
                const active=node.id===selected?.id;
                return <g key={node.id} role="button" tabIndex={0} aria-label={`预览${NODE_LABELS[node.type]}：${node.title}`} aria-pressed={active}
                  className={`explore-map__node explore-map__node--${node.type}${active?" is-selected":""}${activeId&&!activeSet.has(node.id)?" is-distant":""}`}
                  transform={`translate(${node.x},${node.y})`} onClick={()=>choose(node)}
                  onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(node);}}}
                  onMouseEnter={()=>setHoverId(node.id)} onMouseLeave={()=>setHoverId(null)} onFocus={()=>setHoverId(node.id)} onBlur={()=>setHoverId(null)}>
                    <rect className="explore-map__node-paper" x={-node.width/2} y="-35" width={node.width} height="70" rx={node.type==="topic"?35:3}/>
                    {node.type==="concept"?<path className="explore-map__glyph" d={`M${-node.width/2+17} -7l7 7-7 7-7-7Z`}/>:<circle className="explore-map__glyph" cx={-node.width/2+18} cy="0" r={node.type==="post"?3.5:5}/>}
                    <text className="explore-map__node-title" x="10" y={-((lines.length-1)*18)/2+5} textAnchor="middle">{lines.map((line,i)=><tspan x="10" dy={i?18:0} key={i}>{line}{i===2&&wrapNodeTitle(node.title).length>3?"…":""}</tspan>)}</text>
                </g>;
              })}
            </svg>
          </div>
          <div className="explore-node-list" aria-label="内容列表">
            {visible.map(node=><button key={node.id} type="button" className={`explore-list-item explore-list-item--${node.type}`} aria-pressed={selected?.id===node.id} onClick={()=>choose(node)}>
              <span className="explore-type">{NODE_LABELS[node.type]}</span><strong>{node.title}</strong><span className="explore-list-item__summary">{node.summary}</span><span className="explore-list-item__arrow" aria-hidden="true">↗</span>
            </button>)}
          </div>
        </>}
        <div className="explore-canvas__foot"><p>连线来自文章与主题的实际引用。选择条目，展开下一步。</p><button type="button" onClick={next} disabled={!visible.length}>换个起点 <span aria-hidden="true">↻</span></button></div>
      </div>

      <aside className="explore-inspector" aria-label="当前条目与相关阅读" aria-live="polite">
        {selected?<>
          <div className="explore-inspector__top"><span className={`explore-type explore-type--${selected.type}`}>{NODE_LABELS[selected.type]}</span><span>READING NOTE</span></div>
          <h3>{selected.title}</h3>
          <p className="explore-inspector__summary">{selected.summary||"打开这个条目，继续阅读其中的内容与链接。"}</p>
          <a href={selected.url} className="explore-inspector__read">{selected.type==="post"?"阅读这篇笔记":selected.type==="topic"?"进入这个主题":"理解这个概念"}<span aria-hidden="true">↗</span></a>
          <div className="explore-inspector__related-heading"><h4>接着可以看</h4><span>{String(related.length).padStart(2,"0")}</span></div>
          {related.length?<div className="explore-inspector__neighbors">{related.map(node=><button type="button" key={node.id} onClick={()=>choose(node,true)}><span>{NODE_LABELS[node.type]}</span><strong>{node.title}</strong><span aria-hidden="true">→</span></button>)}</div>:<p className="explore-inspector__summary">这个条目暂时独立，更多联系会随内容积累出现。</p>}
          <span className="explore-inspector__folio" aria-hidden="true">A—Z / NOTES IN CONNECTION</span>
        </>:<><span className="explore-type">没有匹配内容</span><h3>换一条线索</h3><p>清空筛选，重新选择一个感兴趣的主题。</p></>}
      </aside>
    </div>
  </div>;
}
