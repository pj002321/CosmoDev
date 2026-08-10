import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPostsByAuthor, uniqueTags } from "@/lib/posts";
import { getTagline, getBannerUrl } from "@/lib/profiles";
import { getLikeCounts } from "@/lib/likes";
import { isFollowing, getFollowerCount, getFollowingCount } from "@/lib/follows";
import { UserIcon, GraphIcon } from "@/components/icons";
import PostFilter from "@/components/post/PostFilter";
import FollowButton from "@/components/friends/FollowButton";
import BannerUpload from "@/components/profile/BannerUpload";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [allPosts, { userId }] = await Promise.all([getPostsByAuthor(id), auth()]);
  const rawPosts =
    userId === id
      ? allPosts
      : allPosts.filter((p) => p.status === "published" && p.visibility === "public");
  if (rawPosts.length === 0) notFound();
  const likeCounts = await getLikeCounts(rawPosts.map((p) => p.slug));
  const posts = rawPosts.map((p) => ({ ...p, likeCount: likeCounts[p.slug] ?? 0 }));
  const tagline = (await getTagline(id)) ?? `${posts[0].authorName}의 글`;
  const bannerUrl = await getBannerUrl(id);
  const categories = uniqueTags(posts);
  const following = userId && userId !== id ? await isFollowing(userId, id) : false;
  const [followerCount, followingCount] = await Promise.all([
    getFollowerCount(id),
    getFollowingCount(id),
  ]);

  let avatarUrl: string | null = null;
  try {
    const client = await clerkClient();
    avatarUrl = (await client.users.getUser(id)).imageUrl;
  } catch {
    avatarUrl = null;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <BannerUpload bannerUrl={bannerUrl} editable={userId === id} />

      <div className="flex items-center justify-between gap-3 mt-6 mb-10">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-16 h-16 rounded-full border border-border bg-surface text-accent overflow-hidden shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={posts[0].authorName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-6 h-6" />
            )}
          </span>
          <div>
            <p className="font-mono text-xs text-muted animate-fade-in">▸ PROFILE</p>
            <h1 className="text-xl font-semibold animate-fade-in">{tagline}</h1>
            <p className="font-mono text-xs text-muted mt-1">
              팔로워 {followerCount} · 팔로잉 {followingCount}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/graph?id=${id}`}
            className="flex items-center gap-1.5 font-mono text-xs border border-border rounded px-2 py-1.5 hover:border-accent"
          >
            <GraphIcon className="w-3.5 h-3.5" />
            그래프
          </Link>
          {userId && userId !== id && (
            <FollowButton followeeId={id} followeeName={posts[0].authorName} initialFollowing={following} />
          )}
        </div>
      </div>

      <PostFilter posts={posts} categories={categories} allLabel="전체" emptyLabel="아직 작성된 글이 없습니다." />
    </div>
  );
}
