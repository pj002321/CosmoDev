import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getPost, incrementViews } from "@/lib/posts";
import { getLikeState } from "@/lib/likes";
import { EyeIcon } from "@/components/icons";
import DeletePostButton from "@/components/DeletePostButton";
import LikeButton from "@/components/LikeButton";
import PostWidthToggle from "@/components/PostWidthToggle";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, { userId }] = await Promise.all([getPost(slug), auth()]);
  if (!post) notFound();
  const isOwner = post.authorId === userId;
  if (!isOwner && (post.status !== "published" || post.visibility !== "public")) notFound();
  const [views, likeState] = await Promise.all([incrementViews(slug), getLikeState(slug, userId)]);

  return (
    <PostWidthToggle
      backLink={
        <Link href="/" className="font-mono text-xs text-muted hover:text-accent">
          ▸ ARCHIVE로 돌아가기
        </Link>
      }
    >
      <div className="mt-6 bg-surface border border-border rounded-lg px-6 py-6">
        <div className="mb-8 border-b border-border pb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted">
                {post.date} ·{" "}
                <Link href={`/u/${post.authorId}`} className="hover:text-accent">
                  {post.authorName}
                </Link>{" "}
                · <EyeIcon className="inline w-3 h-3 -mt-0.5" /> {views}
              </span>
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
            <div className="flex gap-2">
              <LikeButton
                slug={post.slug}
                initialLiked={likeState.liked}
                initialCount={likeState.count}
                signedIn={!!userId}
              />
              {isOwner && (
                <>
                  <Link
                    href={`/write/${post.slug}/edit`}
                    className="font-mono text-xs border border-border rounded px-2 py-1 hover:border-accent"
                  >
                    수정
                  </Link>
                  <DeletePostButton slug={post.slug} redirectTo="/" />
                </>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-semibold">{post.title}</h1>
        </div>

        <div
          className="prose-post"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </div>
    </PostWidthToggle>
  );
}
