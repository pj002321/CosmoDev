"use client";

import { useEffect, useState } from "react";
import { UserIcon } from "@/components/icons";
import FollowButton from "@/components/FollowButton";

type SearchUser = { id: string; name: string; email: string };

export default function AddFriendSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setResults(data.users ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="border border-border rounded-lg p-4 mb-6 flex flex-col gap-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이메일이나 이름으로 계정 검색"
        className="bg-surface border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {loading && <p className="font-mono text-xs text-muted">검색 중…</p>}
      {!loading && query.trim() && results.length === 0 && (
        <p className="font-mono text-xs text-muted">일치하는 계정이 없습니다</p>
      )}
      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-3 border border-border rounded px-3 py-2"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="flex items-center justify-center w-7 h-7 rounded-full border border-border text-accent shrink-0">
                  <UserIcon className="w-3.5 h-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm truncate">{user.name}</span>
                  {user.email && (
                    <span className="block font-mono text-[11px] text-muted truncate">{user.email}</span>
                  )}
                </span>
              </span>
              <FollowButton followeeId={user.id} followeeName={user.name} initialFollowing={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
