import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="font-mono text-xs text-muted hover:text-accent">
        ▸ ARCHIVE로 돌아가기
      </Link>

      <div className="mt-6 mb-8 border-b border-border pb-6">
        <div className="flex items-center gap-3 mb-3">
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
        <h1 className="text-2xl font-semibold">{post.title}</h1>
      </div>

      <div
        className="prose-post"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </div>
  );
}
