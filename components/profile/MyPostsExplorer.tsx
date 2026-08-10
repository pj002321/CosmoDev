"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DeletePostButton from "@/components/post/DeletePostButton";

type Post = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  status: "draft" | "published";
  visibility: "public" | "private";
};

const UNCATEGORIZED = "미분류";

export default function MyPostsExplorer({ posts }: { posts: Post[] }) {
  const categories = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const post of posts) {
      const tags = post.tags.length > 0 ? post.tags : [UNCATEGORIZED];
      for (const tag of tags) {
        if (!map.has(tag)) map.set(tag, []);
        map.get(tag)!.push(post);
      }
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [posts]);

  const [active, setActive] = useState<string | null>(null);

  const sections = active
    ? categories.filter(([tag]) => tag === active)
    : categories;

  return (
    <div className="flex gap-6">
      <nav className="w-44 shrink-0 border border-border rounded-lg bg-surface p-3 h-fit sticky top-6">
        <p className="font-mono text-[10px] text-muted mb-2 px-1">▸ VAULT</p>
        <button
          onClick={() => setActive(null)}
          className={`w-full text-left font-mono text-xs px-2 py-1.5 rounded transition-colors ${
            active === null ? "bg-background text-accent" : "text-muted hover:text-accent"
          }`}
        >
          📂 전체 <span className="text-muted">({posts.length})</span>
        </button>
        {categories.map(([tag, tagPosts]) => (
          <button
            key={tag}
            onClick={() => setActive(tag)}
            className={`w-full text-left font-mono text-xs px-2 py-1.5 rounded transition-colors truncate ${
              active === tag ? "bg-background text-accent" : "text-muted hover:text-accent"
            }`}
          >
            # {tag} <span className="text-muted">({tagPosts.length})</span>
          </button>
        ))}
      </nav>

      <div className="flex-1 min-w-0 flex flex-col gap-8">
        {posts.length === 0 && (
          <p className="text-sm text-muted">아직 작성한 글이 없습니다.</p>
        )}
        {sections.map(([tag, tagPosts]) => (
          <section key={tag}>
            <h2 className="font-mono text-xs text-muted mb-3"># {tag}</h2>
            <div className="flex flex-col gap-3">
              {tagPosts.map((post) => (
                <div
                  key={`${tag}-${post.slug}`}
                  className="flex items-center justify-between border border-border rounded-lg p-4 bg-surface"
                >
                  <div>
                    <span className="font-mono text-xs text-muted mr-3">{post.date}</span>
                    <span className="font-medium">{post.title}</span>
                    {post.status === "draft" && (
                      <span className="ml-2 font-mono text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
                        임시저장
                      </span>
                    )}
                    {post.visibility === "private" && (
                      <span className="ml-2 font-mono text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
                        비공개
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/write/${post.slug}/edit`}
                      className="font-mono text-xs border border-border rounded px-2 py-1 hover:border-accent"
                    >
                      수정
                    </Link>
                    <DeletePostButton slug={post.slug} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
