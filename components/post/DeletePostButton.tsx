"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePostButton({
  slug,
  redirectTo,
}: {
  slug: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("이 글을 삭제할까요?")) return;
    setDeleting(true);
    await fetch(`/api/posts/${slug}`, { method: "DELETE" });
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="font-mono text-xs border border-border rounded px-2 py-1 text-red-400 hover:border-red-400 disabled:opacity-50"
    >
      삭제
    </button>
  );
}
