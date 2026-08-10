"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowButton({
  followeeId,
  followeeName,
  initialFollowing,
}: {
  followeeId: string;
  followeeName: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    const next = !following;
    setFollowing(next);
    try {
      await fetch(`/api/follows/${followeeId}`, {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: next ? JSON.stringify({ name: followeeName }) : undefined,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={pending}
      className={`font-mono text-xs border rounded px-2.5 py-1.5 transition-colors disabled:opacity-50 ${
        following
          ? hovered
            ? "border-border text-muted"
            : "border-accent text-accent"
          : "border-border text-muted hover:border-accent hover:text-accent"
      }`}
    >
      {following ? (hovered ? "언팔로우" : "팔로잉") : "+ 팔로우"}
    </button>
  );
}
