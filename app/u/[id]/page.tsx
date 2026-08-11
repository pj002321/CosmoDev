import { notFound } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPostsByAuthor, uniqueTags } from "@/lib/posts";
import {
  getTagline,
  getBannerUrl,
  getBannerPosition,
  getWidgetPosition,
  getWidgetOrder,
  getWidgetLinks,
  getWidgetSocial,
} from "@/lib/profiles";
import { getLikeCounts } from "@/lib/likes";
import { isFollowing, getFollowerCount, getFollowingCount } from "@/lib/follows";
import PostFilter from "@/components/post/PostFilter";
import BannerUpload from "@/components/profile/BannerUpload";
import ProfileSidebar from "@/components/profile/ProfileSidebar";

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
  const [bannerUrl, bannerPosition, widgetPosition, widgetOrder, widgetLinks, widgetSocial] = await Promise.all([
    getBannerUrl(id),
    getBannerPosition(id),
    getWidgetPosition(id),
    getWidgetOrder(id),
    getWidgetLinks(id),
    getWidgetSocial(id),
  ]);
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

  const recentPosts = posts.slice(0, 5).map((p) => ({ slug: p.slug, title: p.title, date: p.date }));
  const postDates = posts.map((p) => p.date);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <BannerUpload bannerUrl={bannerUrl} bannerPosition={bannerPosition} editable={userId === id} />

      <div
        className={`flex flex-col md:flex-row gap-8 mt-8 ${
          widgetPosition === "right" ? "md:flex-row-reverse" : ""
        }`}
      >
        <ProfileSidebar
          id={id}
          authorName={posts[0].authorName}
          tagline={tagline}
          avatarUrl={avatarUrl}
          followerCount={followerCount}
          followingCount={followingCount}
          editable={userId === id}
          viewerId={userId}
          initialFollowing={following}
          recentPosts={recentPosts}
          postDates={postDates}
          initialPosition={widgetPosition}
          initialOrder={widgetOrder}
          initialLinks={widgetLinks}
          initialSocial={widgetSocial}
        />
        <div className="flex-1 min-w-0">
          <PostFilter posts={posts} categories={categories} allLabel="전체" emptyLabel="아직 작성된 글이 없습니다." />
        </div>
      </div>
    </div>
  );
}
