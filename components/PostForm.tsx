"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import TableBuilder from "@/components/TableBuilder";

type Initial = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  content: string;
};

type Props = {
  mode: "new" | "edit";
  slug?: string;
  initial?: Initial;
};

type UnsplashPhoto = {
  id: string;
  thumb: string;
  regular: string;
  alt: string;
  downloadLocation: string;
  authorName: string;
  authorUrl: string;
};

export default function PostForm({ mode, slug, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [showTableBuilder, setShowTableBuilder] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!showUnsplash || !unsplashQuery.trim()) return;
    const timer = setTimeout(() => {
      setUnsplashLoading(true);
      fetch(`/api/unsplash/search?q=${encodeURIComponent(unsplashQuery)}`)
        .then((res) => res.json())
        .then((data) => setUnsplashResults(data.results ?? []))
        .catch(() => setUnsplashResults([]))
        .finally(() => setUnsplashLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [unsplashQuery, showUnsplash]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
        .then((res) => res.json())
        .then((data) => setPreviewHtml(data.html ?? ""))
        .catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [content]);

  function handleTabKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    const el = e.currentTarget;
    const start = el.selectionStart;
    const fenceCount = (content.slice(0, start).match(/^```/gm) ?? []).length;
    if (fenceCount % 2 === 0) return;
    e.preventDefault();
    const end = el.selectionEnd;
    const next = content.slice(0, start) + "\t" + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 1;
    });
  }

  function insertAtCursor(insertion: string) {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = content.slice(0, start) + insertion + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + insertion.length;
      });
    } else {
      setContent((c) => c + insertion);
    }
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("upload failed");
      const { url } = await res.json();
      insertAtCursor(`![${file.name}](${url})\n`);
    } catch {
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function handleUnsplashSelect(photo: UnsplashPhoto) {
    fetch("/api/unsplash/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadLocation: photo.downloadLocation }),
    }).catch(() => {});

    insertAtCursor(
      `![${photo.alt}](${photo.regular})\n*Photo by [${photo.authorName}](${photo.authorUrl}?utm_source=devshot&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=devshot&utm_medium=referral)*\n`
    );
    setShowUnsplash(false);
    setUnsplashQuery("");
    setUnsplashResults([]);
  }

  function handleTableInsert(markdown: string) {
    insertAtCursor(markdown);
    setShowTableBuilder(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        title,
        date,
        summary,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        content,
      };
      const res = await fetch(
        mode === "new" ? "/api/posts" : `/api/posts/${slug}`,
        {
          method: mode === "new" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("save failed");
      router.push("/my-posts");
      router.refresh();
    } catch {
      setError("저장에 실패했습니다.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          required
          className="flex-1 bg-surface border border-border rounded px-3 py-2 outline-none focus:border-accent"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onClick={(e) => e.currentTarget.showPicker?.()}
          required
          className="bg-surface border border-border rounded px-3 py-2 font-mono text-sm outline-none focus:border-accent cursor-pointer"
        />
      </div>

      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="한 줄 요약"
        className="bg-surface border border-border rounded px-3 py-2 outline-none focus:border-accent"
      />

      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="태그 (쉼표로 구분)"
        className="bg-surface border border-border rounded px-3 py-2 font-mono text-sm outline-none focus:border-accent"
      />

      <div className="flex items-center gap-2">
        <label className="font-mono text-xs text-muted border border-border rounded px-2 py-1 cursor-pointer hover:border-accent">
          {uploading ? "업로드 중…" : "이미지 삽입"}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setShowUnsplash((v) => !v);
            setUnsplashQuery("");
            setUnsplashResults([]);
          }}
          className="font-mono text-xs text-muted border border-border rounded px-2 py-1 hover:border-accent"
        >
          Unsplash 검색
        </button>
        <button
          type="button"
          onClick={() => setShowTableBuilder((v) => !v)}
          className="font-mono text-xs text-muted border border-border rounded px-2 py-1 hover:border-accent"
        >
          표 삽입
        </button>
        <span className="font-mono text-xs text-muted">커서 위치에 마크다운으로 삽입됩니다</span>
      </div>

      {showTableBuilder && (
        <TableBuilder onInsert={handleTableInsert} onClose={() => setShowTableBuilder(false)} />
      )}

      {showUnsplash && (
        <div className="border border-border rounded p-3 flex flex-col gap-3">
          <input
            autoFocus
            value={unsplashQuery}
            onChange={(e) => setUnsplashQuery(e.target.value)}
            placeholder="이미지 검색어 입력 (예: mountain)"
            className="bg-surface border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
          />
          {unsplashLoading && <p className="font-mono text-xs text-muted">검색 중…</p>}
          {!unsplashLoading && unsplashQuery.trim() && unsplashResults.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {unsplashResults.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => handleUnsplashSelect(photo)}
                  className="aspect-square overflow-hidden rounded border border-border hover:border-accent"
                  title={`Photo by ${photo.authorName}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.thumb} alt={photo.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleTabKey}
          placeholder="마크다운으로 작성하세요"
          required
          className="bg-surface border border-border rounded px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-accent h-[36rem] resize-none"
        />
        <div className="border border-border rounded px-4 py-3 h-[36rem] overflow-y-auto">
          {previewHtml ? (
            <div className="prose-post" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <p className="font-mono text-xs text-muted">미리보기가 여기에 표시됩니다</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-accent self-start font-medium rounded px-4 py-2 disabled:opacity-50"
      >
        {saving ? "저장 중…" : mode === "new" ? "발행" : "수정 저장"}
      </button>
    </form>
  );
}
