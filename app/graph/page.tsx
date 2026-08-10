import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getPostsByAuthor } from "@/lib/posts";
import PostGraph from "@/components/graph/PostGraph";

export const dynamic = "force-dynamic";

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await searchParams;
  const targetId = id || userId;
  const isOwner = targetId === userId;

  const rawPosts = await getPostsByAuthor(targetId);
  const posts = isOwner
    ? rawPosts
    : rawPosts.filter((p) => p.status === "published" && p.visibility === "public");
  if (posts.length === 0 && !isOwner) notFound();

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-12">
      <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ GRAPH</p>
      <h1 className="text-2xl font-semibold mb-8 animate-fade-in">
        {isOwner ? "카테고리 그래프" : `${posts[0]?.authorName ?? ""}님의 카테고리 그래프`}
      </h1>
      <PostGraph posts={posts.map((p) => ({ slug: p.slug, title: p.title, tags: p.tags }))} />
    </div>
  );
}
