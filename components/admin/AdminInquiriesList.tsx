"use client";

import { useEffect, useState } from "react";
import type { Inquiry } from "@/lib/inquiries";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function InquiryItem({ inquiry, onReplied }: { inquiry: Inquiry; onReplied: (id: number, reply: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/inquiries/${inquiry.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "전송에 실패했습니다");
      return;
    }
    onReplied(inquiry.id, reply.trim());
    setReply("");
  }

  return (
    <div className="border border-border rounded-lg bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{inquiry.title}</span>
          <span className="font-mono text-[11px] text-muted">
            {inquiry.senderName} · {inquiry.senderEmail} · {formatDate(inquiry.createdAt)}
          </span>
        </span>
        {inquiry.reply ? (
          <span className="font-mono text-[10px] text-accent border border-accent rounded px-2 py-0.5">답변완료</span>
        ) : (
          <span className="font-mono text-[10px] text-muted border border-border rounded px-2 py-0.5">대기중</span>
        )}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
          <p className="text-sm whitespace-pre-wrap">{inquiry.content}</p>
          {inquiry.reply ? (
            <div className="bg-background border border-border rounded px-3 py-2">
              <p className="font-mono text-[10px] text-muted mb-1">
                {inquiry.repliedAt && formatDate(inquiry.repliedAt)} 답변
              </p>
              <p className="text-sm whitespace-pre-wrap">{inquiry.reply}</p>
            </div>
          ) : (
            <form onSubmit={handleReply} className="flex flex-col gap-2">
              <textarea
                required
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="답변 내용"
                rows={4}
                className="bg-background border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent resize-none"
              />
              {error && <p className="font-mono text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="self-end font-mono text-xs bg-accent text-background rounded px-3 py-1.5 disabled:opacity-50"
              >
                {submitting ? "전송 중…" : "답변 보내기"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminInquiriesList() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);

  useEffect(() => {
    fetch("/api/inquiries")
      .then((res) => res.json())
      .then((data) => setInquiries(data.inquiries ?? []));
  }, []);

  function handleReplied(id: number, reply: string) {
    setInquiries((prev) =>
      prev?.map((i) => (i.id === id ? { ...i, reply, repliedAt: new Date().toISOString() } : i)) ?? prev
    );
  }

  if (inquiries === null) {
    return <p className="font-mono text-xs text-muted">불러오는 중…</p>;
  }

  if (inquiries.length === 0) {
    return <p className="font-mono text-xs text-muted">접수된 문의가 없습니다</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {inquiries.map((inquiry) => (
        <InquiryItem key={inquiry.id} inquiry={inquiry} onReplied={handleReplied} />
      ))}
    </div>
  );
}
