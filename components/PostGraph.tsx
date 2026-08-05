"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import type { SimulationNodeDatum } from "d3-force";

type Post = { slug: string; title: string; tags: string[] };

type Node = SimulationNodeDatum & {
  id: string;
  label: string;
  kind: "tag" | "post";
  slug?: string;
};

type Link = { source: string; target: string };

const UNCATEGORIZED = "미분류";

function layout(posts: Post[]) {
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

  const sim = forceSimulation(nodes)
    .force(
      "link",
      forceLink<Node, Link>(links)
        .id((n) => n.id)
        .distance(60)
    )
    .force("charge", forceManyBody().strength(-160))
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide<Node>((n) => (n.kind === "tag" ? 34 : 20)))
    .stop();

  for (let i = 0; i < 300; i++) sim.tick();

  const xs = nodes.map((n) => n.x ?? 0);
  const ys = nodes.map((n) => n.y ?? 0);
  const pad = 60;
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;

  return { nodes, links, viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}` };
}

export default function PostGraph({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const { nodes, links, viewBox } = useMemo(() => layout(posts), [posts]);
  const [hovered, setHovered] = useState<string | null>(null);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const neighbors = useMemo(() => {
    if (!hovered) return null;
    const set = new Set<string>([hovered]);
    for (const l of links) {
      const s = typeof l.source === "string" ? l.source : (l.source as Node).id;
      const t = typeof l.target === "string" ? l.target : (l.target as Node).id;
      if (s === hovered) set.add(t);
      if (t === hovered) set.add(s);
    }
    return set;
  }, [hovered, links]);

  if (posts.length === 0) {
    return <p className="text-sm text-muted">아직 작성된 글이 없습니다.</p>;
  }

  return (
    <svg viewBox={viewBox} className="w-full h-[70vh] border border-border rounded-lg bg-surface">
      {links.map((l, i) => {
        const s = byId.get(typeof l.source === "string" ? l.source : (l.source as Node).id);
        const t = byId.get(typeof l.target === "string" ? l.target : (l.target as Node).id);
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
            strokeOpacity={dim ? 0.15 : 0.6}
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
            opacity={dim ? 0.25 : 1}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => n.slug && router.push(`/posts/${n.slug}`)}
            className={n.slug ? "cursor-pointer" : ""}
          >
            <circle
              r={isTag ? 9 : 5}
              fill={isTag ? "var(--accent)" : "var(--surface)"}
              stroke={isTag ? "none" : "var(--muted)"}
              strokeWidth={isTag ? 0 : 1.5}
            />
            <text
              x={isTag ? 13 : 9}
              y={4}
              fontSize={isTag ? 12 : 10.5}
              fontFamily="var(--font-mono)"
              fill={isTag ? "var(--accent)" : "var(--foreground)"}
            >
              {isTag ? n.label : n.label.length > 18 ? `${n.label.slice(0, 18)}…` : n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
