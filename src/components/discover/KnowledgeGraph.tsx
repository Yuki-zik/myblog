import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum
} from "d3-force";

type GraphNodeType = "post" | "topic" | "concept";

interface RawNode {
  id: string;
  type: GraphNodeType;
  title: string;
  url: string;
}
interface RawEdge {
  source: string;
  target: string;
}
interface SimNode extends RawNode, SimulationNodeDatum {
  degree: number;
  radius: number;
  glow: number;
  core: number;
}
interface SimLink {
  source: SimNode;
  target: SimNode;
}
interface BgStar {
  x: number;
  y: number;
  r: number;
  o: number;
  d: number;
}

const WIDTH = 920;
const HEIGHT = 580;
const PADDING = 40;
const MAX_LABEL = 13;
const BG_STARS = 90;

const TYPE_LABEL: Record<GraphNodeType, string> = {
  post: "文章",
  topic: "主题",
  concept: "概念"
};

function clip(title: string): string {
  return title.length > MAX_LABEL ? `${title.slice(0, MAX_LABEL)}…` : title;
}

/** Deterministic PRNG so the background starfield is stable across re-renders. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gentle quadratic arc — constellation lines with a hair of curve. */
function arc(a: SimNode, b: SimNode): string {
  const x1 = a.x ?? 0;
  const y1 = a.y ?? 0;
  const x2 = b.x ?? 0;
  const y2 = b.y ?? 0;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const bow = len * 0.08;
  const cx = (x1 + x2) / 2 + (-dy / len) * bow;
  const cy = (y1 + y2) / 2 + (dx / len) * bow;
  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
}

/** 4-point diffraction sparkle centred at (cx,cy) with arm length `len`. */
function sparkle(cx: number, cy: number, len: number): string {
  const t = Math.max(0.7, len * 0.09);
  return (
    `M${cx},${cy - len} L${cx + t},${cy - t} L${cx + len},${cy} L${cx + t},${cy + t} ` +
    `L${cx},${cy + len} L${cx - t},${cy + t} L${cx - len},${cy} L${cx - t},${cy - t} Z`
  );
}

/**
 * Knowledge graph as a star chart (discover runtime, /map).
 *
 * The network is drawn as a constellation over a deep-space "sea of stars":
 * a scattered background starfield, faint constellation lines, and luminous
 * star nodes (bright core + radial glow + a diffraction sparkle on hubs /
 * focus). Sizing ∝ √degree acts like stellar magnitude. Layout is computed
 * once (no RAF); hover lights up a star's constellation and dims the rest.
 * Motion (twinkle, entrance) is gentle and reduced-motion gated.
 */
export default function KnowledgeGraph() {
  const [graph, setGraph] = useState<{ nodes: SimNode[]; links: SimLink[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [restLabels, setRestLabels] = useState<Set<string>>(new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const labelRefs = useRef(new Map<string, SVGTextElement>());

  const bgStars = useMemo<BgStar[]>(() => {
    const rand = mulberry32(20260701);
    return Array.from({ length: BG_STARS }, () => ({
      x: rand() * WIDTH,
      y: rand() * HEIGHT,
      r: 0.4 + rand() * 1.2,
      o: 0.12 + rand() * 0.55,
      d: rand() * 6
    }));
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/knowledge-graph.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`graph fetch failed: ${response.status}`);
        }
        return response.json() as Promise<{ nodes: RawNode[]; edges: RawEdge[] }>;
      })
      .then((data) => {
        if (!alive) {
          return;
        }
        const degree = new Map<string, number>();
        for (const edge of data.edges) {
          degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
          degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
        }
        const nodes: SimNode[] = data.nodes.map((node) => {
          const deg = degree.get(node.id) ?? 0;
          const mag = Math.sqrt(deg);
          return {
            ...node,
            degree: deg,
            radius: 13 + mag * 4,
            glow: 12 + mag * 6.5,
            core: 1.7 + mag * 1.1
          };
        });
        const byId = new Map(nodes.map((node) => [node.id, node]));
        const links: SimLink[] = data.edges
          .map((edge) => ({ source: byId.get(edge.source), target: byId.get(edge.target) }))
          .filter((link): link is SimLink => Boolean(link.source && link.target));

        const simulation = forceSimulation(nodes)
          .force("charge", forceManyBody().strength(-360))
          .force(
            "link",
            forceLink<SimNode, SimLink>(links)
              .id((node) => node.id)
              .distance(112)
              .strength(0.16)
          )
          .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
          .force("x", forceX(WIDTH / 2).strength(0.055))
          .force("y", forceY(HEIGHT / 2).strength(0.09))
          .force("collide", forceCollide<SimNode>((node) => node.radius + 18).strength(0.9))
          .stop();
        simulation.tick(360);

        for (const node of nodes) {
          node.x = Math.max(PADDING, Math.min(WIDTH - PADDING, node.x ?? WIDTH / 2));
          node.y = Math.max(PADDING, Math.min(HEIGHT - PADDING, node.y ?? HEIGHT / 2));
        }
        setGraph({ nodes, links });
      })
      .catch(() => {
        if (alive) {
          setFailed(true);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (graph) {
      for (const link of graph.links) {
        if (!map.has(link.source.id)) map.set(link.source.id, new Set());
        if (!map.has(link.target.id)) map.set(link.target.id, new Set());
        map.get(link.source.id)!.add(link.target.id);
        map.get(link.target.id)!.add(link.source.id);
      }
    }
    return map;
  }, [graph]);

  useLayoutEffect(() => {
    if (!graph) {
      return;
    }
    const declutter = () => {
      const ordered = [...graph.nodes].sort((a, b) => b.degree - a.degree);
      const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
      const keep = new Set<string>();
      for (const node of ordered) {
        const el = labelRefs.current.get(node.id);
        if (!el) {
          continue;
        }
        const box = el.getBBox();
        const padded = { x: box.x - 5, y: box.y - 2, w: box.width + 10, h: box.height + 4 };
        const overlaps = placed.some(
          (b) =>
            padded.x < b.x + b.w &&
            padded.x + padded.w > b.x &&
            padded.y < b.y + b.h &&
            padded.y + padded.h > b.y
        );
        if (!overlaps) {
          keep.add(node.id);
          placed.push(padded);
        }
      }
      setRestLabels(keep);
    };
    declutter();
    let alive = true;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (alive) declutter();
      });
    }
    return () => {
      alive = false;
    };
  }, [graph]);

  if (failed) {
    return <p className="knowledge-graph-status">星图暂时无法载入。</p>;
  }
  if (!graph) {
    return <p className="knowledge-graph-status">正在绘制星图…</p>;
  }

  const focusSet =
    focusId === null ? null : new Set<string>([focusId, ...(adjacency.get(focusId) ?? [])]);
  const nodeState = (id: string): "" | "focus" | "near" | "mute" => {
    if (!focusSet) return "";
    if (id === focusId) return "focus";
    return focusSet.has(id) ? "near" : "mute";
  };

  return (
    <figure className="knowledge-graph-figure">
      <div className="kg-sky">
        <svg
          className="knowledge-graph"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="group"
          aria-label="主题、概念与文章连成星座的知识网络星图"
        >
          <defs>
            <radialGradient id="kgStar-post" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="20%" stopColor="#ffe4d8" stopOpacity="0.72" />
              <stop offset="48%" stopColor="#ff8f73" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#ff7a5b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="kgStar-topic" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="20%" stopColor="#e6eefe" stopOpacity="0.72" />
              <stop offset="48%" stopColor="#9db6ea" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#7c9ad6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="kgStar-concept" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="20%" stopColor="#fff1d9" stopOpacity="0.72" />
              <stop offset="48%" stopColor="#f0cf9c" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#eac48f" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g className="kg-starfield" aria-hidden="true">
            {bgStars.map((star, index) => (
              <circle
                key={index}
                cx={star.x}
                cy={star.y}
                r={star.r}
                className="kg-bgstar"
                style={{ ["--o" as string]: star.o, ["--d" as string]: `${star.d}s` }}
              />
            ))}
          </g>

          <g className="kg-constellation" fill="none">
            {graph.links.map((link, index) => {
              const active = focusSet
                ? link.source.id === focusId || link.target.id === focusId
                : false;
              const muted = Boolean(focusSet && !active);
              return (
                <path
                  key={index}
                  d={arc(link.source, link.target)}
                  className={`kg-line${active ? " is-active" : ""}${muted ? " is-muted" : ""}`}
                />
              );
            })}
          </g>

          <g className="kg-stars">
            {graph.nodes.map((node, index) => {
              const state = nodeState(node.id);
              const isHub = node.degree >= 3;
              const showSpike = state === "focus" || state === "near" || (!focusSet && isHub);
              const spikeLen = state === "focus" ? node.glow * 1.5 : node.glow * 0.95;
              return (
                <a
                  key={node.id}
                  href={node.url}
                  className={`kg-star kg-star--${node.type}${state ? ` is-${state}` : ""}`}
                  aria-label={`${TYPE_LABEL[node.type]}:${node.title}`}
                  style={{ ["--kg-i" as string]: index }}
                  onMouseEnter={() => setFocusId(node.id)}
                  onMouseLeave={() => setFocusId(null)}
                  onFocus={() => setFocusId(node.id)}
                  onBlur={() => setFocusId(null)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.glow}
                    className="kg-star-glow"
                    fill={`url(#kgStar-${node.type})`}
                  />
                  {showSpike ? (
                    <path
                      d={sparkle(node.x ?? 0, node.y ?? 0, spikeLen)}
                      className="kg-star-spike"
                    />
                  ) : null}
                  <circle cx={node.x} cy={node.y} r={node.core} className="kg-star-core" />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={Math.max(node.glow * 0.7, 16)}
                    className="kg-star-hit"
                  />
                </a>
              );
            })}
          </g>

          <g className="kg-labels" aria-hidden="true">
            {graph.nodes.map((node) => {
              const state = nodeState(node.id);
              const show = focusSet
                ? state === "focus" || state === "near"
                : restLabels.has(node.id);
              return (
                <text
                  key={node.id}
                  ref={(el) => {
                    if (el) labelRefs.current.set(node.id, el);
                    else labelRefs.current.delete(node.id);
                  }}
                  x={node.x}
                  y={(node.y ?? 0) + node.glow * 0.62 + 14}
                  textAnchor="middle"
                  className={`kg-label${show ? "" : " is-hidden"}${state === "focus" ? " is-focus" : ""}`}
                >
                  {clip(node.title)}
                </text>
              );
            })}
          </g>
        </svg>
      </div>
      <figcaption className="knowledge-graph-legend">
        <span className="kg-legend kg-legend--post">文章</span>
        <span className="kg-legend kg-legend--topic">主题</span>
        <span className="kg-legend kg-legend--concept">概念</span>
        <span className="kg-legend-hint">悬停任意星点,点亮它的星座</span>
      </figcaption>
    </figure>
  );
}
