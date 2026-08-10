"use client";

import { useState } from "react";
import { NotionIcon } from "@/components/icons";

type Category = { name: string; count: number };
type PreviewState = { categories: Category[]; totalFiles: number };

const inputClass =
  "flex-1 bg-surface border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent";

export default function NotionImportButton() {
  const [open, setOpen] = useState(false);
  const [rootPageId, setRootPageId] = useState("");
  const [token, setToken] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);

  async function handlePreview() {
    if (!rootPageId.trim() || !token.trim() || loading) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setResult(null);
    try {
      const res = await fetch("/api/notion/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootPageId, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "미리보기에 실패했어요");
        return;
      }
      setPreview(data);
      setSelected(new Set(data.categories.map((c: Category) => c.name)));
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleImport() {
    if (!preview || selected.size === 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notion/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootPageId, token, categories: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "가져오기에 실패했어요");
        return;
      }
      setResult(data.imported);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border rounded-lg px-4 py-3 bg-surface max-w-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm w-full text-left"
      >
        <NotionIcon className="w-4 h-4 text-muted" />
        Notion 연동
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={rootPageId}
            onChange={(e) => setRootPageId(e.target.value)}
            placeholder="Notion 페이지 URL 또는 ID"
            className={inputClass}
          />
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            type="password"
            placeholder="Notion Integration Token"
            className={inputClass}
          />
          <p className="text-[11px] text-muted">
            notion.so/my-integrations 에서 토큰을 만들고, 대상 페이지에 해당 통합을 연결해주세요.
          </p>
          <button
            type="button"
            onClick={handlePreview}
            disabled={!rootPageId.trim() || !token.trim() || loading}
            className="font-mono text-xs border border-border rounded px-2.5 py-1.5 hover:border-accent disabled:opacity-50 w-fit"
          >
            미리보기
          </button>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {preview && (
            <div className="flex flex-col gap-2 mt-1">
              <p className="font-mono text-[11px] text-muted">페이지 {preview.totalFiles}개</p>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {preview.categories.map((c) => (
                  <label key={c.name} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selected.has(c.name)}
                      onChange={() => toggleCategory(c.name)}
                    />
                    {c.name} ({c.count})
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={handleImport}
                disabled={selected.size === 0 || loading}
                className="btn-accent font-mono text-xs rounded px-2.5 py-1.5 disabled:opacity-50 w-fit"
              >
                {loading ? "가져오는 중..." : "가져오기"}
              </button>
            </div>
          )}

          {result !== null && (
            <p className="text-xs text-accent">{result}개 글을 가져왔어요.</p>
          )}
        </div>
      )}
    </div>
  );
}
