"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BannerUpload({
  bannerUrl,
  editable,
}: {
  bannerUrl: string | null;
  editable: boolean;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

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

  return (
    <div
      className="relative w-full h-40 sm:h-56 rounded-lg overflow-hidden border border-border bg-surface"
      style={
        bannerUrl
          ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(120deg, var(--accent), var(--accent-2))", opacity: 0.35 }
      }
    >
      {editable && (
        <label className="absolute bottom-3 right-3 font-mono text-xs bg-background/80 border border-border rounded px-2.5 py-1.5 cursor-pointer hover:border-accent">
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
      )}
    </div>
  );
}
