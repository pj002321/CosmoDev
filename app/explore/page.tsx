import { cookies } from "next/headers";
import { getAllPosts } from "@/lib/posts";
import { getLikeCounts } from "@/lib/likes";
import PostCard from "@/components/PostCard";
import { LOCALE_COOKIE, getDict, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ko";
  const dict = getDict(locale).explore;
  const rawPosts = await getAllPosts();
  const likeCounts = await getLikeCounts(rawPosts.map((p) => p.slug));
  const posts = rawPosts.map((p) => ({ ...p, likeCount: likeCounts[p.slug] ?? 0 }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ {dict.eyebrow}</p>
      <h1 className="text-2xl font-semibold mb-8">{dict.title}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.map((post, i) => (
          <PostCard key={post.slug} post={post} index={i} showAuthor />
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-muted sm:col-span-2">{dict.empty}</p>
        )}
      </div>
    </div>
  );
}
