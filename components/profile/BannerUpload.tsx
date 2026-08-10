"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function BannerUpload({
  bannerUrl,
  bannerPosition,
  editable,
}: {
  bannerUrl: string | null;
  bannerPosition: number;
  editable: boolean;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [position, setPosition] = useState(bannerPosition);
  const dragRef = useRef<{ startY: number; startPos: number } | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) return;
      const { url } = await res.json();
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerUrl: url }),
      });
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function savePosition(next: number) {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerPosition: next }),
    });
    router.refresh();
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!adjusting) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startPos: position };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!adjusting || !dragRef.current || !bannerRef.current) return;
    const deltaPct = ((e.clientY - dragRef.current.startY) / bannerRef.current.clientHeight) * 100;
    setPosition(Math.max(0, Math.min(100, dragRef.current.startPos - deltaPct)));
  }

  function handlePointerUp() {
    if (!adjusting || !dragRef.current) return;
    dragRef.current = null;
    savePosition(position);
  }

  return (
    <div>
      <div
        ref={bannerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative w-full h-40 sm:h-56 rounded-lg overflow-hidden border border-border bg-surface ${
          adjusting ? "cursor-grab active:cursor-grabbing select-none" : ""
        }`}
        style={
          bannerUrl
            ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: `center ${position}%` }
            : { background: "linear-gradient(120deg, var(--accent), var(--accent-2))", opacity: 0.35 }
        }
      >
        {editable && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            {bannerUrl && (
              <button
                type="button"
                onClick={() => setAdjusting((v) => !v)}
                className={`font-mono text-xs border rounded px-2.5 py-1.5 ${
                  adjusting ? "bg-accent text-background border-accent" : "bg-background/80 border-border hover:border-accent"
                }`}
              >
                {adjusting ? "완료" : "위치 조정"}
              </button>
            )}
            <label className="font-mono text-xs bg-background/80 border border-border rounded px-2.5 py-1.5 cursor-pointer hover:border-accent">
              {uploading ? "업로드 중…" : "배너 변경"}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        )}
      </div>
      {adjusting && <p className="font-mono text-xs text-muted mt-1.5">배너를 드래그해서 위치를 조정하세요</p>}
    </div>
  );
}
