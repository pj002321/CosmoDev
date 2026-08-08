import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getPostsByAuthor, uniqueTags } from "@/lib/posts";
import { getTagline } from "@/lib/profiles";
import { getLikeCounts } from "@/lib/likes";
import { isFollowing } from "@/lib/follows";
import { UserIcon } from "@/components/icons";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [rawPosts, { userId }] = await Promise.all([getPostsByAuthor(id), auth()]);
  if (rawPosts.length === 0) notFound();
  const likeCounts = await getLikeCounts(rawPosts.map((p) => p.slug));
  const posts = rawPosts.map((p) => ({ ...p, likeCount: likeCounts[p.slug] ?? 0 }));
  const tagline = (await getTagline(id)) ?? `${posts[0].authorName}의 글`;
  const categories = uniqueTags(posts);
  const following = userId && userId !== id ? await isFollowing(userId, id) : false;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3 mb-10">
        <div className="flex items-center gap-3">
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
        {userId && userId !== id && (
          <FollowButton followeeId={id} followeeName={posts[0].authorName} initialFollowing={following} />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.map((post, i) => (
          <PostCard key={post.slug} post={post} index={i} />
        ))}
      </div>
    </div>
  );
}
