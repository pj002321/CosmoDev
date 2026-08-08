"use client";

import { useState } from "react";
import { HeartIcon } from "@/components/icons";

export default function LikeButton({
  slug,
  initialLiked,
  initialCount,
  signedIn,
}: {
  slug: string;
  initialLiked: boolean;
  initialCount: number;
  signedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!signedIn || pending) return;
    setPending(true);
    setLiked(!liked);
    setCount((c) => c + (liked ? -1 : 1));
    try {
      const res = await fetch(`/api/posts/${slug}/like`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setCount(data.count);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!signedIn || pending}
      title={signedIn ? undefined : "로그인 후 좋아요를 누를 수 있어요"}
      className={`flex items-center gap-1.5 font-mono text-xs border border-border rounded px-2.5 py-1.5 transition-colors disabled:opacity-50 ${
        liked ? "text-accent border-accent" : "text-muted hover:border-accent hover:text-accent"
      }`}
    >
      <HeartIcon className="w-3.5 h-3.5" filled={liked} />
      {count}
    </button>
  );
}
