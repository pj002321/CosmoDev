import PostForm from "@/components/editor/PostForm";

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="font-mono text-xs text-muted mb-2">▸ NEW POST</p>
      <h1 className="text-2xl font-semibold mb-8">새 글 작성</h1>
      <PostForm mode="new" />
    </div>
  );
}
