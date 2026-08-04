import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs text-muted mb-2">▸ ARCHIVE</p>
      <h1 className="text-2xl font-semibold mb-10">모든 글</h1>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group border border-border rounded-lg p-5 bg-surface hover:border-accent transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-muted">{post.date}</span>
              <div className="flex gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[11px] uppercase tracking-wide text-muted border border-border rounded px-1.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <h2 className="text-lg font-medium mb-1 group-hover:text-accent transition-colors">
              {post.title}
            </h2>
            <p className="text-sm text-muted">{post.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
