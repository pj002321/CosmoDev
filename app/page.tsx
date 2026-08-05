import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getPostsByAuthor } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ DEVShot</p>
        <h1 className="text-3xl font-semibold mb-3 animate-fade-in glow-text">
          로그인하고 내 글을 확인하세요
        </h1>
        <p className="text-sm text-muted mb-8">
          친구나 이웃의 글은 그 사람의 프로필 링크로 볼 수 있어요.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/sign-in"
            className="font-mono text-xs border border-border rounded px-3 py-2 hover:border-accent"
          >
            로그인
          </Link>
          <Link
            href="/sign-up"
            className="btn-accent font-mono text-xs rounded px-3 py-2"
          >
            회원가입
          </Link>
        </div>
      </div>
    );
  }

  const posts = await getPostsByAuthor(userId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ MY ARCHIVE</p>
          <h1 className="text-2xl font-semibold animate-fade-in">내가 쓴 글</h1>
        </div>
        <Link
          href="/write"
          className="font-mono text-xs border border-border rounded px-3 py-2 hover:border-accent"
        >
          + 새 글
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post, i) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            style={{ animationDelay: `${i * 60}ms` }}
            className="post-card group border border-border rounded-lg p-5 bg-surface hover:border-accent"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-muted">{post.date}</span>
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
            <h2 className="text-lg font-medium mb-1 group-hover:text-accent transition-colors">
              {post.title}
            </h2>
            <p className="text-sm text-muted">{post.summary}</p>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-muted">아직 작성된 글이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
