"use client";

import { useState } from "react";

export default function ContactButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function close() {
    setOpen(false);
    setTitle("");
    setContent("");
    setError(null);
    setDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    setSubmitting(false);
    if (!res.ok) {
      if (res.status === 401) {
        setError("로그인 후 이용해주세요");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "전송에 실패했습니다");
      return;
    }
    setDone(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hover:text-accent transition-colors cursor-pointer"
      >
        {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-fade-in"
          onClick={close}
        >
          <div
            className="glass-panel border border-border rounded-lg w-full max-w-md p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <>
                <p className="font-mono text-sm">문의가 접수되었습니다</p>
                <p className="font-mono text-xs text-muted">답변은 이메일로 회신됩니다</p>
                <button
                  type="button"
                  onClick={close}
                  className="self-end font-mono text-xs border border-border rounded px-3 py-1.5 hover:border-accent"
                >
                  닫기
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <h2 className="font-mono text-sm font-semibold">{label}</h2>
                <input
                  autoFocus
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목"
                  className="bg-surface border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="내용"
                  rows={6}
                  className="bg-surface border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                />
                {error && <p className="font-mono text-xs text-red-400">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="font-mono text-xs border border-border rounded px-3 py-1.5 hover:border-accent"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="font-mono text-xs bg-accent text-background rounded px-3 py-1.5 disabled:opacity-50"
                  >
                    {submitting ? "전송 중…" : "보내기"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
