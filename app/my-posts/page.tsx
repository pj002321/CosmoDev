import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getPostsByAuthor } from "@/lib/posts";
import MyPostsExplorer from "@/components/profile/MyPostsExplorer";

export const dynamic = "force-dynamic";

export default async function MyPostsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const posts = await getPostsByAuthor(userId);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs text-muted mb-2">▸ MY POSTS</p>
          <h1 className="text-2xl font-semibold">내 글 관리</h1>
        </div>
        <Link
          href="/write"
          className="font-mono text-xs border border-border rounded px-3 py-2 hover:border-accent"
        >
          + 새 글
        </Link>
      </div>

      <MyPostsExplorer posts={posts} />
    </div>
  );
}
