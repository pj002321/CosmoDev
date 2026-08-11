"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import TableBuilder from "@/components/editor/TableBuilder";
import type { PostStatus, PostVisibility } from "@/lib/posts";
import { HIGHLIGHT_COLORS } from "@/lib/colors";

type Initial = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  content: string;
  status: PostStatus;
  visibility: PostVisibility;
  thumbnail: string | null;
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

type MenuPos = { left: number; top?: number; bottom?: number; direction: "down" | "up" };
type SlashMenuState = MenuPos & { index: number; active: number };
type LangMenuState = MenuPos & { index: number };

const SLASH_MENU_HEIGHT = 260; // 8 items * ~30px + padding, estimate
const LANG_MENU_HEIGHT = 230; // capped by max-h-56, estimate

const DETAILS_SNIPPET = "<details>\n<summary>제목</summary>\n\n내용\n\n</details>";
const DETAILS_TITLE_OFFSET = "<details>\n<summary>".length;
const DETAILS_TITLE_LEN = "제목".length;

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
function getCaretLine(el: HTMLTextAreaElement, pos: number) {
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
  const lineTop = span.offsetTop - el.scrollTop;
  const left = span.offsetLeft - el.scrollLeft;
  document.body.removeChild(div);
  return { lineTop, lineHeight, left };
}

// Flips the dropdown above the caret line when there isn't enough viewport
// space below it (e.g. typing "/" near the bottom of the editor/page).
function placeMenu(el: HTMLTextAreaElement, pos: number, menuHeight: number): MenuPos {
  const { lineTop, lineHeight, left } = getCaretLine(el, pos);
  const rect = el.getBoundingClientRect();
  const spaceBelow = window.innerHeight - (rect.top + lineTop + lineHeight);
  const spaceAbove = rect.top + lineTop;
  const direction: "down" | "up" = spaceBelow < menuHeight && spaceAbove > spaceBelow ? "up" : "down";
  return direction === "down"
    ? { direction, left, top: lineTop + lineHeight }
    : { direction, left, bottom: el.clientHeight - lineTop };
}

export default function PostForm({ mode, slug, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [visibility, setVisibility] = useState<PostVisibility>(initial?.visibility ?? "public");
  const [thumbnail, setThumbnailRaw] = useState<string | null>(initial?.thumbnail ?? null);
  const [thumbnailTouched, setThumbnailTouched] = useState(!!initial?.thumbnail);
  const [currentSlug, setCurrentSlug] = useState(slug);
  const [persistedStatus, setPersistedStatus] = useState<PostStatus | null>(initial?.status ?? null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [autosaving, setAutosaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [imageSize, setImageSize] = useState<"small" | "medium" | "large" | "original">("medium");
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [showTableBuilder, setShowTableBuilder] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [langMenu, setLangMenu] = useState<LangMenuState | null>(null);
  const [colorMenu, setColorMenu] = useState<"text" | "bg" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const slashCommands: { label: string; hint: string; snippet: string; cursorOffset?: number; cursorSelectLength?: number; openTable?: boolean; openLangPicker?: boolean }[] = [
    { label: "표", hint: "테이블", snippet: "", openTable: true },
    { label: "제목 1", hint: "큰 제목", snippet: "# " },
    { label: "제목 2", hint: "중간 제목", snippet: "## " },
    { label: "제목 3", hint: "작은 제목", snippet: "### " },
    { label: "코드 스코프", hint: "코드 블록", snippet: "```\n\n```", cursorOffset: 4, openLangPicker: true },
    { label: "콜아웃", hint: "강조 인용구", snippet: "> 💡 " },
    { label: "인용구", hint: "블록 인용", snippet: "> " },
    {
      label: "접기/펼치기",
      hint: "토글 블록",
      snippet: DETAILS_SNIPPET,
      cursorOffset: DETAILS_TITLE_OFFSET,
      cursorSelectLength: DETAILS_TITLE_LEN,
    },
  ];

  const images = useMemo(() => {
    const found = [...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
    return [...new Set(found)];
  }, [content]);

  function setThumbnail(url: string | null) {
    setThumbnailRaw(url);
    setThumbnailTouched(true);
  }

  // ponytail: auto-suggests the first image found in the content as the
  // thumbnail until the user explicitly picks one (including "없음"), so
  // most posts get a sensible default without any manual step.
  useEffect(() => {
    if (thumbnailTouched) return;
    if (images.length > 0) setThumbnailRaw(images[0]);
  }, [images, thumbnailTouched]);

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

  // ponytail: never autosave over an already-published post — a background
  // save could silently alter live content mid-edit. Once persistedStatus
  // becomes "published" (via the 발행 button), autosave stops; only an
  // explicit save can touch it again.
  useEffect(() => {
    if (persistedStatus === "published") return;
    if (!title.trim() || !content.trim()) return;
    const timer = setTimeout(() => {
      setAutosaving(true);
      persist("draft").finally(() => setAutosaving(false));
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, date, summary, tags, content, visibility, thumbnail, persistedStatus]);

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

  function wrapWithSpan(className: string) {
    const el = textareaRef.current;
    const open = `<span class="${className}">`;
    const close = "</span>";
    if (!el) {
      setContent((c) => c + open + close);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end);
    insertTextNative(el, start, end, open + selected + close);
    const cursorStart = start + open.length;
    const cursorEnd = cursorStart + selected.length;
    queueMicrotask(() => {
      el.focus();
      el.selectionStart = cursorStart;
      el.selectionEnd = cursorEnd;
    });
    setColorMenu(null);
  }

  const IMAGE_WIDTHS = { small: 280, medium: 520, large: 760, original: null } as const;

  function imageMarkup(alt: string, url: string) {
    const width = IMAGE_WIDTHS[imageSize];
    if (!width) return `![${alt}](${url})`;
    const safeAlt = alt.replace(/"/g, "&quot;");
    return `<img src="${url}" alt="${safeAlt}" width="${width}" />`;
  }

  function insertAtCursor(insertion: string) {
    const el = textareaRef.current;
    if (el) {
      insertTextNative(el, el.selectionStart, el.selectionEnd, insertion);
    } else {
      setContent((c) => c + insertion);
    }
  }

  function applyAtSlash(index: number, snippet: string, cursorOffset?: number, cursorSelectLength = 0) {
    const el = textareaRef.current;
    if (el) {
      insertTextNative(el, index, index + 1, snippet);
      const pos = index + (cursorOffset ?? snippet.length);
      queueMicrotask(() => {
        el.focus();
        el.selectionStart = pos;
        el.selectionEnd = pos + cursorSelectLength;
      });
    }
    setSlashMenu(null);
  }

  function runSlashCommand(cmd: (typeof slashCommands)[number]) {
    if (!slashMenu) return;
    if (cmd.openLangPicker) {
      const el = textareaRef.current;
      const pos = slashMenu.index + 1;
      setLangMenu({
        index: slashMenu.index,
        ...(el ? placeMenu(el, pos, LANG_MENU_HEIGHT) : { left: slashMenu.left, top: slashMenu.top, bottom: slashMenu.bottom, direction: slashMenu.direction }),
      });
      setSlashMenu(null);
      return;
    }
    applyAtSlash(slashMenu.index, cmd.snippet, cmd.cursorOffset, cmd.cursorSelectLength);
    if (cmd.openTable) setShowTableBuilder(true);
  }

  function insertDetailsBlock() {
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + DETAILS_SNIPPET + "\n");
      return;
    }
    const start = el.selectionStart;
    insertTextNative(el, start, el.selectionEnd, DETAILS_SNIPPET + "\n");
    const titleStart = start + DETAILS_TITLE_OFFSET;
    queueMicrotask(() => {
      el.focus();
      el.selectionStart = titleStart;
      el.selectionEnd = titleStart + DETAILS_TITLE_LEN;
    });
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
      setSlashMenu({ index: pos - 1, active: 0, ...placeMenu(el, pos, SLASH_MENU_HEIGHT) });
    } else if (slashMenu) {
      setSlashMenu(null);
    }
    if (langMenu) setLangMenu(null);
  }

  function handleContentKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        wrapSelection("**");
        return;
      }
      if (key === "i") {
        e.preventDefault();
        wrapSelection("*");
        return;
      }
      if (e.shiftKey && key === "x") {
        e.preventDefault();
        wrapSelection("~~");
        return;
      }
    }
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
      insertAtCursor(`${imageMarkup(file.name, url)}\n`);
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
      `${imageMarkup(photo.alt, photo.regular)}\n*Photo by [${photo.authorName}](${photo.authorUrl}?utm_source=cosmodev&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=cosmodev&utm_medium=referral)*\n`
    );
    setShowUnsplash(false);
    setUnsplashQuery("");
    setUnsplashResults([]);
  }

  function handleTableInsert(markdown: string) {
    insertAtCursor(markdown);
    setShowTableBuilder(false);
  }

  async function persist(nextStatus: PostStatus): Promise<boolean> {
    const payload = {
      title,
      date,
      summary,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      content,
      status: nextStatus,
      visibility,
      thumbnail,
    };
    try {
      const res = await fetch(
        currentSlug ? `/api/posts/${currentSlug}` : "/api/posts",
        {
          method: currentSlug ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) return false;
      if (!currentSlug) {
        const { slug: newSlug } = await res.json();
        setCurrentSlug(newSlug);
      }
      setPersistedStatus(nextStatus);
      setSavedAt(new Date());
      return true;
    } catch {
      return false;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const ok = await persist("published");
    if (ok) {
      router.push("/my-posts");
      router.refresh();
    } else {
      setError("저장에 실패했습니다.");
      setSaving(false);
    }
  }

  async function handleDraftSave() {
    setSaving(true);
    setError("");
    const ok = await persist("draft");
    setSaving(false);
    if (!ok) setError("저장에 실패했습니다.");
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
          title="굵게 (Ctrl/Cmd+B)"
          className="font-mono text-xs font-bold text-muted border border-border rounded px-2.5 py-1 hover:border-accent"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapSelection("*")}
          title="기울임 (Ctrl/Cmd+I)"
          className="font-mono text-xs italic text-muted border border-border rounded px-2.5 py-1 hover:border-accent"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapSelection("~~")}
          title="취소선 (Ctrl/Cmd+Shift+X)"
          className="font-mono text-xs line-through text-muted border border-border rounded px-2.5 py-1 hover:border-accent"
        >
          S
        </button>
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setColorMenu((m) => (m === "text" ? null : "text"))}
            title="글자색"
            className="font-mono text-xs text-muted border border-border rounded px-2.5 py-1 hover:border-accent"
          >
            A
          </button>
          {colorMenu === "text" && (
            <div className="absolute z-20 top-full mt-1 left-0 flex gap-1 bg-surface border border-border rounded p-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapWithSpan(`text-hl-${c.name}`)}
                  title={c.name}
                  className="w-5 h-5 rounded-full border border-border"
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setColorMenu((m) => (m === "bg" ? null : "bg"))}
            title="배경색"
            className="font-mono text-xs text-muted border border-border rounded px-2.5 py-1 hover:border-accent"
          >
            <span className="px-0.5 bg-accent/30 rounded-sm">A</span>
          </button>
          {colorMenu === "bg" && (
            <div className="absolute z-20 top-full mt-1 left-0 flex gap-1 bg-surface border border-border rounded p-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapWithSpan(`bg-hl-${c.name}`)}
                  title={c.name}
                  className="w-5 h-5 rounded-full border border-border"
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          )}
        </div>
        <span className="w-px h-4 bg-border" />
        <select
          value={imageSize}
          onChange={(e) => setImageSize(e.target.value as typeof imageSize)}
          title="삽입할 사진 크기"
          className="font-mono text-xs text-muted border border-border rounded px-1.5 py-1 hover:border-accent bg-transparent cursor-pointer"
        >
          <option value="small">작게</option>
          <option value="medium">보통</option>
          <option value="large">크게</option>
          <option value="original">원본</option>
        </select>
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
        <button
          type="button"
          onClick={insertDetailsBlock}
          className="font-mono text-xs text-muted border border-border rounded px-2 py-1 hover:border-accent"
        >
          접기/펼치기
        </button>
        <span className="font-mono text-xs text-muted">커서 위치에 마크다운으로 삽입됩니다</span>
      </div>

      {showTableBuilder && (
        <TableBuilder onInsert={handleTableInsert} onClose={() => setShowTableBuilder(false)} />
      )}

      {showUnsplash && (
        <div className="bg-surface border border-border rounded p-3 flex flex-col gap-3">
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
              style={
                slashMenu.direction === "down"
                  ? { top: slashMenu.top, left: slashMenu.left }
                  : { bottom: slashMenu.bottom, left: slashMenu.left }
              }
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
              style={
                langMenu.direction === "down"
                  ? { top: langMenu.top, left: langMenu.left }
                  : { bottom: langMenu.bottom, left: langMenu.left }
              }
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
        <div className="bg-surface border border-border rounded px-4 py-3 h-[36rem] overflow-y-auto">
          {previewHtml ? (
            <div className="prose-post" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <p className="font-mono text-xs text-muted">미리보기가 여기에 표시됩니다</p>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs text-muted">썸네일</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setThumbnail(null)}
              className={`font-mono text-xs border rounded px-2.5 py-1.5 ${
                thumbnail === null ? "border-accent text-accent" : "border-border text-muted hover:border-accent"
              }`}
            >
              없음
            </button>
            {images.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setThumbnail(url)}
                title={url}
                className={`w-16 h-16 rounded overflow-hidden border-2 ${
                  thumbnail === url ? "border-accent" : "border-border hover:border-accent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex border border-border rounded overflow-hidden">
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={`font-mono text-xs px-3 py-1.5 ${
              visibility === "public" ? "bg-accent text-background" : "text-muted hover:text-accent"
            }`}
          >
            공개
          </button>
          <button
            type="button"
            onClick={() => setVisibility("neighbors")}
            className={`font-mono text-xs px-3 py-1.5 border-l border-border ${
              visibility === "neighbors" ? "bg-accent text-background" : "text-muted hover:text-accent"
            }`}
          >
            이웃공개
          </button>
          <button
            type="button"
            onClick={() => setVisibility("private")}
            className={`font-mono text-xs px-3 py-1.5 border-l border-border ${
              visibility === "private" ? "bg-accent text-background" : "text-muted hover:text-accent"
            }`}
          >
            비공개
          </button>
        </div>

        <button
          type="button"
          onClick={handleDraftSave}
          disabled={saving}
          className="font-mono text-xs border border-border rounded px-3 py-1.5 hover:border-accent disabled:opacity-50"
        >
          임시저장
        </button>

        <button
          type="submit"
          disabled={saving}
          className="btn-accent font-medium rounded px-4 py-2 disabled:opacity-50"
        >
          {saving ? "저장 중…" : mode === "new" ? "발행" : "수정 저장"}
        </button>

        {autosaving && <span className="font-mono text-xs text-muted">자동 저장 중…</span>}
        {!autosaving && savedAt && (
          <span className="font-mono text-xs text-muted">
            {savedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 자동 저장됨
          </span>
        )}
      </div>
    </form>
  );
}
