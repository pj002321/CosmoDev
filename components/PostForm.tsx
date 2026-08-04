"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("upload failed");
      const { url } = await res.json();
      const insertion = `![${file.name}](${url})\n`;
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
    } catch {
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
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
        mode === "new" ? "/api/admin/posts" : `/api/admin/posts/${slug}`,
        {
          method: mode === "new" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("save failed");
      router.push("/admin");
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
          required
          className="bg-surface border border-border rounded px-3 py-2 font-mono text-sm outline-none focus:border-accent"
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
        <span className="font-mono text-xs text-muted">커서 위치에 마크다운으로 삽입됩니다</span>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="마크다운으로 작성하세요"
        required
        rows={20}
        className="bg-surface border border-border rounded px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-accent"
      />

      <button
        type="submit"
        disabled={saving}
        className="self-start bg-accent text-background font-medium rounded px-4 py-2 hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "저장 중…" : mode === "new" ? "발행" : "수정 저장"}
      </button>
    </form>
  );
}
