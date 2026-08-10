"use client";

import { useState } from "react";
import { CommentIcon } from "@/components/icons";
import type { Comment } from "@/lib/comments";

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

export default function CommentSection({
  slug,
  initialComments,
  signedIn,
  currentUserId,
}: {
  slug: string;
  initialComments: Comment[];
  signedIn: boolean;
  currentUserId: string | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [...prev, data.comment]);
        setText("");
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: number) {
    const prev = comments;
    setComments((c) => c.filter((cm) => cm.id !== id));
    const res = await fetch(`/api/posts/${slug}/comments/${id}`, { method: "DELETE" });
    if (!res.ok) setComments(prev);
  }

  return (
    <div className="mt-10 border-t border-border pt-6">
      <h2 className="flex items-center gap-1.5 font-mono text-xs text-muted mb-4">
        <CommentIcon className="w-3.5 h-3.5" />
        댓글 {comments.length}
      </h2>

      <div className="flex flex-col gap-3 mb-5">
        {comments.map((c) => (
          <div key={c.id} className="border border-border rounded-lg px-4 py-3 bg-surface">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-muted">
                {c.authorName} · {formatDate(c.createdAt)}
              </span>
              {c.authorId === currentUserId && (
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="font-mono text-[11px] text-muted hover:text-accent"
                >
                  삭제
                </button>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{c.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted">아직 댓글이 없습니다.</p>
        )}
      </div>

      {signedIn ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="댓글을 남겨보세요"
            className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!text.trim() || pending}
            className="btn-accent font-mono text-xs rounded px-3 py-2 disabled:opacity-50"
          >
            등록
          </button>
        </form>
      ) : (
        <p className="font-mono text-xs text-muted">로그인 후 댓글을 남길 수 있어요</p>
      )}
    </div>
  );
}
