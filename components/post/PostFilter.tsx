"use client";

import { useState } from "react";
import PostCard from "@/components/post/PostCard";

type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  likeCount?: number;
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
            className={`font-mono text-[11px] uppercase tracking-wide rounded-full px-2 py-0.5 border transition-colors ${
              selected === null
                ? "border-accent text-accent bg-accent/10"
                : "border-border text-muted bg-background/40 hover:border-accent hover:text-accent"
            }`}
          >
            {allLabel}
          </button>
          {categories.map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => setSelected(tag)}
              className={`font-mono text-[11px] uppercase tracking-wide rounded-full px-2 py-0.5 border transition-colors ${
                selected === tag
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-muted bg-background/40 hover:border-accent hover:text-accent"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
        {filtered.map((post, i) => (
          <PostCard key={post.slug} post={post} index={i} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted sm:col-span-2">{emptyLabel}</p>
        )}
      </div>
    </>
  );
}
