import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getPostsByAuthor, uniqueTags } from "@/lib/posts";
import { getTagline } from "@/lib/profiles";
import EditableTagline from "@/components/EditableTagline";
import PostFilter from "@/components/PostFilter";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <div className="term-bar">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot accent" />
          <span className="ml-2 font-mono text-[11px] text-muted">~/devshot</span>
        </div>
        <div className="border border-border rounded-b-lg bg-surface px-8 py-16 text-center">
          <p className="font-mono text-xs text-muted mb-3 animate-fade-in">
            $ whoami<span className="cursor-blink" />
          </p>
          <h1 className="text-3xl font-semibold mb-3 animate-fade-in glow-text">
            오늘 생각을 정리해보세요
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
      </div>
    );
  }

  const posts = await getPostsByAuthor(userId);
  const tagline = (await getTagline(userId)) ?? "내가 쓴 글";
  const categories = uniqueTags(posts);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ MY ARCHIVE</p>
          <EditableTagline initialValue={tagline} />
        </div>
        <Link
          href="/write"
          className="btn-accent font-mono text-xs rounded px-3 py-2"
        >
          + 새 글
        </Link>
      </div>

      <PostFilter posts={posts} categories={categories} allLabel="전체" emptyLabel="아직 작성된 글이 없습니다." />
    </div>
  );
}
