import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getPostsByAuthor } from "@/lib/posts";
import PostGraph from "@/components/PostGraph";

export const dynamic = "force-dynamic";

export default async function GraphPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const posts = await getPostsByAuthor(userId);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-12">
      <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ GRAPH</p>
      <h1 className="text-2xl font-semibold mb-8 animate-fade-in">카테고리 그래프</h1>
      <PostGraph posts={posts.map((p) => ({ slug: p.slug, title: p.title, tags: p.tags }))} />
    </div>
  );
}
