"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
} from "d3-force";
import type { SimulationNodeDatum } from "d3-force";

type Post = { slug: string; title: string; tags: string[] };

type Node = SimulationNodeDatum & {
  id: string;
  label: string;
  kind: "tag" | "post";
  slug?: string;
  weight: number;
};

type Link = { source: string | Node; target: string | Node };

const UNCATEGORIZED = "미분류";

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function tagColor(label: string) {
  const hue = hashString(label) % 360;
  return `hsl(${hue} 75% 65%)`;
}

// tag vertices grow with how many posts carry that tag, so heavily-used
// tags read as hubs at a glance (capped so one giant tag can't dominate)
function tagRadius(weight: number) {
  return Math.min(13, 4 + weight * 1.4);
}

function buildGraph(posts: Post[]) {
  const tagNodes = new Map<string, Node>();
  const nodes: Node[] = [];
  const links: Link[] = [];

  for (const post of posts) {
    const tags = post.tags.length > 0 ? post.tags : [UNCATEGORIZED];
    for (const tag of tags) {
      const tagId = `tag:${tag}`;
      let tagNode = tagNodes.get(tagId);
      if (!tagNode) {
        tagNode = { id: tagId, label: tag, kind: "tag", weight: 0 };
        tagNodes.set(tagId, tagNode);
        nodes.push(tagNode);
      }
      tagNode.weight += 1;
      links.push({ source: tagId, target: post.slug });
    }
    nodes.push({ id: post.slug, label: post.title, kind: "post", slug: post.slug, weight: 1 });
  }

  return { nodes, links };
}

function nodeId(end: string | Node) {
  return typeof end === "string" ? end : end.id;
}

export default function PostGraph({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const { nodes, links } = useMemo(() => buildGraph(posts), [posts]);
  const [, bump] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const simRef = useRef<Simulation<Node, Link> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragNode = useRef<Node | null>(null);

  const clusterSize = Math.max(240, Math.sqrt(nodes.length) * 60);
  const viewW = clusterSize * 2.2;
  const viewH = clusterSize * 1.3;

  useEffect(() => {
    if (nodes.length === 0) return;
    const sim = forceSimulation(nodes)
      .force(
        "link",
        forceLink<Node, Link>(links)
          .id((n) => n.id)
          .distance(28)
          .strength(0.9)
      )
      .force("charge", forceManyBody().strength(-55))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide<Node>((n) => (n.kind === "tag" ? tagRadius(n.weight) + 6 : 12)))
      .on("tick", () => {
        const halfW = viewW / 2 - 24;
        const halfH = viewH / 2 - 24;
        for (const n of nodes) {
          n.x = Math.max(-halfW, Math.min(halfW, n.x ?? 0));
          n.y = Math.max(-halfH, Math.min(halfH, n.y ?? 0));
        }
        bump((t) => t + 1);
      });
    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, [nodes, links]);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const neighbors = useMemo(() => {
    if (!hovered) return null;
    const set = new Set<string>([hovered]);
    for (const l of links) {
      const s = nodeId(l.source);
      const t = nodeId(l.target);
      if (s === hovered) set.add(t);
      if (t === hovered) set.add(s);
    }
    return set;
  }, [hovered, links]);

  function toSvgPoint(e: ReactPointerEvent) {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function handlePointerDown(n: Node, e: ReactPointerEvent) {
    e.stopPropagation();
    dragNode.current = n;
    setHovered(n.id);
    simRef.current?.alphaTarget(0.3).restart();
    const { x, y } = toSvgPoint(e);
    n.fx = x;
    n.fy = y;
  }

  function handlePointerMove(e: ReactPointerEvent) {
    const n = dragNode.current;
    if (!n) return;
    const { x, y } = toSvgPoint(e);
    n.fx = x;
    n.fy = y;
  }

  function endDrag() {
    if (dragNode.current) {
      dragNode.current.fx = null;
      dragNode.current.fy = null;
      dragNode.current = null;
    }
    setHovered(null);
    simRef.current?.alphaTarget(0);
  }

  if (posts.length === 0) {
    return <p className="text-sm text-muted">아직 작성된 글이 없습니다.</p>;
  }

  const effW = viewW / zoom;
  const effH = viewH / zoom;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`${-effW / 2} ${-effH / 2} ${effW} ${effH}`}
        className="w-full h-[85vh] touch-none select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
      {links.map((l, i) => {
        const s = byId.get(nodeId(l.source));
        const t = byId.get(nodeId(l.target));
        if (!s || !t) return null;
        const dim = neighbors && (!neighbors.has(s.id) || !neighbors.has(t.id));
        return (
          <line
            key={i}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke="var(--border)"
            strokeWidth={0.75}
            strokeOpacity={dim ? 0.1 : 0.5}
          />
        );
      })}
      {nodes.map((n) => {
        const dim = neighbors && !neighbors.has(n.id);
        const isTag = n.kind === "tag";
        const color = isTag ? tagColor(n.label) : undefined;
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            opacity={dim ? 0.2 : 1}
            onPointerDown={(e) => handlePointerDown(n, e)}
            onClick={() => n.slug && router.push(`/posts/${n.slug}`)}
            className={n.slug ? "cursor-pointer" : "cursor-grab"}
          >
            <circle
              r={isTag ? tagRadius(n.weight) : 3}
              fill={isTag ? color : "var(--surface)"}
              stroke={isTag ? "none" : "var(--muted)"}
              strokeWidth={isTag ? 0 : 1}
              style={isTag ? { filter: `drop-shadow(0 0 ${4 + n.weight}px ${color})` } : undefined}
            />
            {zoom > 0.6 && (
              <text
                x={isTag ? tagRadius(n.weight) + 3 : 5.5}
                y={2.8}
                fontSize={isTag ? 8 : 7}
                fontFamily="var(--font-mono)"
                fill={isTag ? color : "var(--muted)"}
              >
                {isTag ? n.label : n.label.length > 16 ? `${n.label.slice(0, 16)}…` : n.label}
              </text>
            )}
          </g>
        );
      })}
      </svg>
      <div className="absolute top-1/2 right-3 -translate-y-1/2 flex flex-col items-center gap-2 glass-panel rounded-full px-1.5 py-3 border border-border">
        <span className="font-mono text-[10px] text-muted">+</span>
        <input
          type="range"
          min={0.5}
          max={2.5}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="zoom-gauge"
          aria-label="확대/축소"
        />
        <span className="font-mono text-[10px] text-muted">−</span>
      </div>
    </div>
  );
}
