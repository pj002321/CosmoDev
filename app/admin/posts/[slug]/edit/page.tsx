import { notFound } from "next/navigation";
import { getPost } from "@/lib/posts";
import PostForm from "@/components/PostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs text-muted mb-2">▸ EDIT POST</p>
      <h1 className="text-2xl font-semibold mb-8">글 수정</h1>
      <PostForm
        mode="edit"
        slug={slug}
        initial={{
          title: post.title,
          date: post.date,
          summary: post.summary,
          tags: post.tags,
          content: post.content,
        }}
      />
    </div>
  );
}
