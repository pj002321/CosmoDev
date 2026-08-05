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
};

type Link = { source: string | Node; target: string | Node };

const UNCATEGORIZED = "미분류";

function buildGraph(posts: Post[]) {
  const tagIds = new Set<string>();
  const nodes: Node[] = [];
  const links: Link[] = [];

  for (const post of posts) {
    const tags = post.tags.length > 0 ? post.tags : [UNCATEGORIZED];
    for (const tag of tags) {
      const tagId = `tag:${tag}`;
      if (!tagIds.has(tagId)) {
        tagIds.add(tagId);
        nodes.push({ id: tagId, label: tag, kind: "tag" });
      }
      links.push({ source: tagId, target: post.slug });
    }
    nodes.push({ id: post.slug, label: post.title, kind: "post", slug: post.slug });
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
  const simRef = useRef<Simulation<Node, Link> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragNode = useRef<Node | null>(null);

  const clusterSize = Math.max(320, Math.sqrt(nodes.length) * 85);
  const viewW = clusterSize * 2.2;
  const viewH = clusterSize * 1.3;

  useEffect(() => {
    if (nodes.length === 0) return;
    const sim = forceSimulation(nodes)
      .force(
        "link",
        forceLink<Node, Link>(links)
          .id((n) => n.id)
          .distance(46)
          .strength(0.6)
      )
      .force("charge", forceManyBody().strength(-120))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide<Node>((n) => (n.kind === "tag" ? 20 : 12)))
      .on("tick", () => bump((t) => t + 1));
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
    simRef.current?.alphaTarget(0);
  }

  if (posts.length === 0) {
    return <p className="text-sm text-muted">아직 작성된 글이 없습니다.</p>;
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`${-viewW / 2} ${-viewH / 2} ${viewW} ${viewH}`}
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
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            opacity={dim ? 0.2 : 1}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
            onPointerDown={(e) => handlePointerDown(n, e)}
            onClick={() => n.slug && router.push(`/posts/${n.slug}`)}
            className={n.slug ? "cursor-pointer" : "cursor-grab"}
          >
            <circle
              r={isTag ? 5.5 : 3}
              fill={isTag ? "var(--accent)" : "var(--surface)"}
              stroke={isTag ? "none" : "var(--muted)"}
              strokeWidth={isTag ? 0 : 1}
            />
            <text
              x={isTag ? 8 : 5.5}
              y={2.8}
              fontSize={isTag ? 8 : 7}
              fontFamily="var(--font-mono)"
              fill={isTag ? "var(--accent)" : "var(--muted)"}
            >
              {isTag ? n.label : n.label.length > 16 ? `${n.label.slice(0, 16)}…` : n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
