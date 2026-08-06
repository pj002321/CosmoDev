"use client";

import { useState } from "react";
import Link from "next/link";

type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
};

type Props = {
  posts: Post[];
  categories: string[];
  allLabel: string;
  emptyLabel: string;
};

export default function PostFilter({ posts, categories, allLabel, emptyLabel }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = selected ? posts.filter((p) => p.tags.includes(selected)) : posts;

  return (
    <>
      {categories.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={`font-mono text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 border transition-colors ${
              selected === null
                ? "border-accent text-accent"
                : "border-border text-muted hover:border-accent hover:text-accent"
            }`}
          >
            {allLabel}
          </button>
          {categories.map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => setSelected(tag)}
              className={`font-mono text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 border transition-colors ${
                selected === tag
                  ? "border-accent text-accent"
                  : "border-border text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
        {filtered.map((post, i) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            style={{ animationDelay: `${i * 60}ms` }}
            className="post-card group border border-border rounded-lg p-5 bg-surface hover:border-accent flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="card-index">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-mono text-xs text-muted">{post.date}</span>
            </div>
            <h2 className="text-lg font-medium mb-1 group-hover:text-accent transition-colors">
              {post.title}
            </h2>
            <p className="text-sm text-muted flex-1">{post.summary}</p>
            {post.tags.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[11px] uppercase tracking-wide text-muted border border-border rounded px-1.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted sm:col-span-2">{emptyLabel}</p>
        )}
      </div>
    </>
  );
}
