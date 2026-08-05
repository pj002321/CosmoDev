import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByAuthor, uniqueTags } from "@/lib/posts";
import { getTagline } from "@/lib/profiles";
import { UserIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const posts = await getPostsByAuthor(id);
  if (posts.length === 0) notFound();
  const tagline = (await getTagline(id)) ?? `${posts[0].authorName}의 글`;
  const categories = uniqueTags(posts);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center gap-3 mb-10">
        <span className="flex items-center justify-center w-11 h-11 rounded-full border border-border bg-surface text-accent">
          <UserIcon className="w-5 h-5" />
        </span>
        <div>
          <p className="font-mono text-xs text-muted animate-fade-in">▸ PROFILE</p>
          <h1 className="text-xl font-semibold animate-fade-in">{tagline}</h1>
          {categories.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {categories.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[11px] uppercase tracking-wide text-muted border border-border rounded px-1.5 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.map((post, i) => (
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
      </div>
    </div>
  );
}
