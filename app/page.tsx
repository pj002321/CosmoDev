import Link from "next/link";
import { cookies } from "next/headers";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPostsByAuthor, uniqueTags } from "@/lib/posts";
import {
  getTagline,
  getBannerUrl,
  getBannerPosition,
  getWidgetPosition,
  getWidgetOrder,
  getWidgetLinks,
} from "@/lib/profiles";
import { getLikeCounts } from "@/lib/likes";
import { getFollowerCount, getFollowingCount } from "@/lib/follows";
import EditableTagline from "@/components/profile/EditableTagline";
import PostFilter from "@/components/post/PostFilter";
import BannerUpload from "@/components/profile/BannerUpload";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import { LOCALE_COOKIE, getDict, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ko";
  const dict = getDict(locale).home;

  if (!userId) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <div className="term-bar">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot accent" />
          <span className="ml-2 font-mono text-[11px] text-muted">~/cosmodev</span>
        </div>
        <div className="glass-panel border border-border rounded-b-lg px-8 py-16 text-center">
          <p className="font-mono text-xs text-muted mb-3 animate-fade-in">
            $ {dict.whoami}<span className="cursor-blink" />
          </p>
          <h1 className="text-3xl font-semibold mb-3 animate-fade-in glow-text">
            {dict.heroTitle}
          </h1>
          <p className="text-sm text-muted mb-8">
            {dict.heroDesc}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="font-mono text-xs border border-border rounded px-3 py-2 hover:border-accent"
            >
              {getDict(locale).nav.login}
            </Link>
            <Link
              href="/sign-up"
              className="btn-accent font-mono text-xs rounded px-3 py-2"
            >
              {getDict(locale).nav.signup}
            </Link>
            <Link
              href="/explore"
              className="font-mono text-xs border border-border rounded px-3 py-2 hover:border-accent"
            >
              {getDict(locale).nav.explore}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rawPosts = await getPostsByAuthor(userId);
  const likeCounts = await getLikeCounts(rawPosts.map((p) => p.slug));
  const posts = rawPosts.map((p) => ({ ...p, likeCount: likeCounts[p.slug] ?? 0 }));
  const tagline = (await getTagline(userId)) ?? dict.defaultTagline;
  const categories = uniqueTags(posts);
  const [bannerUrl, bannerPosition, widgetPosition, widgetOrder, widgetLinks, followerCount, followingCount] =
    await Promise.all([
      getBannerUrl(userId),
      getBannerPosition(userId),
      getWidgetPosition(userId),
      getWidgetOrder(userId),
      getWidgetLinks(userId),
      getFollowerCount(userId),
      getFollowingCount(userId),
    ]);

  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  const authorName = me.fullName || me.username || me.emailAddresses[0]?.emailAddress || "익명";
  const recentPosts = posts.slice(0, 5).map((p) => ({ slug: p.slug, title: p.title, date: p.date }));
  const postDates = posts.map((p) => p.date);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <BannerUpload bannerUrl={bannerUrl} bannerPosition={bannerPosition} editable />

      <div
        className={`flex flex-col md:flex-row gap-8 mt-8 ${
          widgetPosition === "right" ? "md:flex-row-reverse" : ""
        }`}
      >
        <ProfileSidebar
          id={userId}
          authorName={authorName}
          tagline={tagline}
          avatarUrl={me.imageUrl}
          followerCount={followerCount}
          followingCount={followingCount}
          editable
          viewerId={userId}
          initialFollowing={false}
          recentPosts={recentPosts}
          postDates={postDates}
          initialPosition={widgetPosition}
          initialOrder={widgetOrder}
          initialLinks={widgetLinks}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ {dict.archive}</p>
              <EditableTagline initialValue={tagline} />
            </div>
            <Link href="/write" className="btn-accent font-mono text-xs rounded px-3 py-2">
              {dict.newPost}
            </Link>
          </div>
          <PostFilter posts={posts} categories={categories} allLabel={dict.all} emptyLabel={dict.empty} />
        </div>
      </div>
    </div>
  );
}
