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

type SlashMenuState = { index: number; top: number; left: number; active: number };
type LangMenuState = { index: number; top: number; left: number };

const CODE_LANGS: { label: string; lang: string }[] = [
  { label: "자동 감지", lang: "" },
  { label: "JavaScript", lang: "js" },
  { label: "TypeScript", lang: "ts" },
  { label: "Python", lang: "python" },
  { label: "Bash", lang: "bash" },
  { label: "JSON", lang: "json" },
  { label: "CSS", lang: "css" },
  { label: "HTML", lang: "html" },
  { label: "SQL", lang: "sql" },
  { label: "Go", lang: "go" },
  { label: "Java", lang: "java" },
];

// ponytail: approximates caret pixel position via a mirrored offscreen div
// (no textarea caret-coordinate API exists). Good enough for menu placement,
// not pixel-perfect on window resize.
function getCaretCoords(el: HTMLTextAreaElement, pos: number) {
  const div = document.createElement("div");
  const style = window.getComputedStyle(el);
  const props = [
    "box-sizing", "width", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
    "font-family", "font-size", "font-weight", "letter-spacing", "line-height",
  ];
  for (const p of props) div.style.setProperty(p, style.getPropertyValue(p));
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  div.style.top = "0";
  div.style.left = "-9999px";
  document.body.appendChild(div);
  div.textContent = el.value.slice(0, pos);
  const span = document.createElement("span");
  span.textContent = el.value.slice(pos) || ".";
  div.appendChild(span);
  const lineHeight = parseFloat(style.lineHeight) || 20;
  const top = span.offsetTop - el.scrollTop + lineHeight;
  const left = span.offsetLeft - el.scrollLeft;
  document.body.removeChild(div);
  return { top, left };
}

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
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [langMenu, setLangMenu] = useState<LangMenuState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const slashCommands: { label: string; hint: string; snippet: string; cursorOffset?: number; openTable?: boolean; openLangPicker?: boolean }[] = [
    { label: "표", hint: "테이블", snippet: "", openTable: true },
    { label: "제목 1", hint: "큰 제목", snippet: "# " },
    { label: "제목 2", hint: "중간 제목", snippet: "## " },
    { label: "제목 3", hint: "작은 제목", snippet: "### " },
    { label: "코드 스코프", hint: "코드 블록", snippet: "```\n\n```", cursorOffset: 4, openLangPicker: true },
    { label: "콜아웃", hint: "강조 인용구", snippet: "> 💡 " },
  ];

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

  // ponytail: execCommand is deprecated but it's still the only way to make a
  // programmatic textarea edit land on the browser's native undo stack
  // (Ctrl/Cmd+Z) — setting .value directly (via setContent) clears that stack.
  function insertTextNative(el: HTMLTextAreaElement, start: number, end: number, text: string) {
    el.focus();
    el.setSelectionRange(start, end);
    if (!document.execCommand("insertText", false, text)) {
      el.setRangeText(text, start, end, "end");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function handleTabKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    const el = e.currentTarget;
    const start = el.selectionStart;
    const fenceCount = (content.slice(0, start).match(/^```/gm) ?? []).length;
    if (fenceCount % 2 === 0) return;
    e.preventDefault();
    insertTextNative(el, start, el.selectionEnd, "\t");
  }

  function wrapSelection(marker: string) {
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + marker + marker);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end);
    insertTextNative(el, start, end, marker + selected + marker);
    const cursorStart = start + marker.length;
    const cursorEnd = cursorStart + selected.length;
    queueMicrotask(() => {
      el.focus();
      el.selectionStart = cursorStart;
      el.selectionEnd = cursorEnd;
    });
  }

  function insertAtCursor(insertion: string) {
    const el = textareaRef.current;
    if (el) {
      insertTextNative(el, el.selectionStart, el.selectionEnd, insertion);
    } else {
      setContent((c) => c + insertion);
    }
  }

  function applyAtSlash(index: number, snippet: string, cursorOffset?: number) {
    const el = textareaRef.current;
    if (el) {
      insertTextNative(el, index, index + 1, snippet);
      const pos = index + (cursorOffset ?? snippet.length);
      queueMicrotask(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = pos;
      });
    }
    setSlashMenu(null);
  }

  function runSlashCommand(cmd: (typeof slashCommands)[number]) {
    if (!slashMenu) return;
    if (cmd.openLangPicker) {
      setLangMenu({ index: slashMenu.index, top: slashMenu.top, left: slashMenu.left });
      setSlashMenu(null);
      return;
    }
    applyAtSlash(slashMenu.index, cmd.snippet, cmd.cursorOffset);
    if (cmd.openTable) setShowTableBuilder(true);
  }

  function applyCodeLang(lang: string) {
    if (!langMenu) return;
    const snippet = "```" + lang + "\n\n```";
    applyAtSlash(langMenu.index, snippet, ("```" + lang + "\n").length);
    setLangMenu(null);
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    const el = e.target;
    const pos = el.selectionStart;
    setContent(next);

    const justTyped = next[pos - 1];
    const before = pos >= 2 ? next[pos - 2] : undefined;
    if (justTyped === "/" && (pos === 1 || before === "\n")) {
      const { top, left } = getCaretCoords(el, pos);
      setSlashMenu({ index: pos - 1, top, left, active: 0 });
    } else if (slashMenu) {
      setSlashMenu(null);
    }
    if (langMenu) setLangMenu(null);
  }

  function handleContentKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (langMenu) {
      if (e.key === "Escape") {
        e.preventDefault();
        setLangMenu(null);
      }
      return;
    }
    if (slashMenu) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashMenu((m) => (m ? { ...m, active: (m.active + 1) % slashCommands.length } : m));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashMenu((m) => (m ? { ...m, active: (m.active - 1 + slashCommands.length) % slashCommands.length } : m));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        runSlashCommand(slashCommands[slashMenu.active]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashMenu(null);
        return;
      }
    }
    handleTabKey(e);
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

  function handleContentPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(e.clipboardData.items)
      .find((item) => item.type.startsWith("image/"))
      ?.getAsFile();
    if (!file) return;
    e.preventDefault();
    handleImageUpload(file);
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
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapSelection("**")}
          title="굵게"
          className="font-mono text-xs font-bold text-muted border border-border rounded px-2.5 py-1 hover:border-accent"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapSelection("*")}
          title="기울임"
          className="font-mono text-xs italic text-muted border border-border rounded px-2.5 py-1 hover:border-accent"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapSelection("~~")}
          title="취소선"
          className="font-mono text-xs line-through text-muted border border-border rounded px-2.5 py-1 hover:border-accent"
        >
          S
        </button>
        <span className="w-px h-4 bg-border" />
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
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleContentKeyDown}
            onPaste={handleContentPaste}
            placeholder="마크다운으로 작성하세요 ( / 로 빠른 삽입 메뉴)"
            required
            className="w-full bg-surface border border-border rounded px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-accent h-[36rem] resize-none"
          />
          {slashMenu && (
            <div
              className="absolute z-20 w-44 bg-surface border border-border rounded shadow-lg py-1 font-mono text-xs"
              style={{ top: slashMenu.top, left: slashMenu.left }}
            >
              {slashCommands.map((cmd, i) => (
                <button
                  key={cmd.label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runSlashCommand(cmd)}
                  onMouseEnter={() => setSlashMenu((m) => (m ? { ...m, active: i } : m))}
                  className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between gap-2 ${
                    i === slashMenu.active ? "bg-background text-accent" : "text-muted"
                  }`}
                >
                  <span>{cmd.label}</span>
                  <span className="text-[10px] text-muted">{cmd.hint}</span>
                </button>
              ))}
            </div>
          )}
          {langMenu && (
            <div
              className="absolute z-20 w-40 bg-surface border border-border rounded shadow-lg py-1 font-mono text-xs max-h-56 overflow-y-auto"
              style={{ top: langMenu.top, left: langMenu.left }}
            >
              {CODE_LANGS.map((l) => (
                <button
                  key={l.label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyCodeLang(l.lang)}
                  className="w-full text-left px-2.5 py-1.5 text-muted hover:bg-background hover:text-accent"
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
