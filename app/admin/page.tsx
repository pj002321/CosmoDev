import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import LogoutButton from "@/components/LogoutButton";
import DeletePostButton from "@/components/DeletePostButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs text-muted mb-2">▸ ADMIN</p>
          <h1 className="text-2xl font-semibold">글 관리</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/posts/new"
            className="font-mono text-xs border border-border rounded px-3 py-2 hover:border-accent"
          >
            + 새 글
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {posts.map((post) => (
          <div
            key={post.slug}
            className="flex items-center justify-between border border-border rounded-lg p-4 bg-surface"
          >
            <div>
              <span className="font-mono text-xs text-muted mr-3">{post.date}</span>
              <span className="font-medium">{post.title}</span>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/posts/${post.slug}/edit`}
                className="font-mono text-xs border border-border rounded px-2 py-1 hover:border-accent"
              >
                수정
              </Link>
              <DeletePostButton slug={post.slug} />
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-muted">아직 글이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
