"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraphIcon, UserIcon, LinkIcon } from "@/components/icons";
import FollowButton from "@/components/friends/FollowButton";

type WidgetKey = "recent" | "calendar" | "links";
type WidgetLink = { label: string; url: string };
type RecentPost = { slug: string; title: string; date: string };

const WIDGET_LABELS: Record<WidgetKey, string> = {
  recent: "최근 글",
  calendar: "캘린더",
  links: "링크",
};

export default function ProfileSidebar({
  id,
  authorName,
  tagline,
  avatarUrl,
  followerCount,
  followingCount,
  editable,
  viewerId,
  initialFollowing,
  recentPosts,
  postDates,
  initialPosition,
  initialOrder,
  initialLinks,
}: {
  id: string;
  authorName: string;
  tagline: string;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  editable: boolean;
  viewerId: string | null;
  initialFollowing: boolean;
  recentPosts: RecentPost[];
  postDates: string[];
  initialPosition: "left" | "right";
  initialOrder: WidgetKey[];
  initialLinks: WidgetLink[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [order, setOrder] = useState(initialOrder);
  const [links, setLinks] = useState(initialLinks);
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>) {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function changePosition(next: "left" | "right") {
    setPosition(next);
    await patch({ widgetPosition: next });
    router.refresh();
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    patch({ widgetOrder: next });
  }

  function addLink() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  function updateLink(i: number, field: "label" | "url", value: string) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function saveLinks() {
    setSaving(true);
    try {
      const cleaned = links.filter((l) => l.label.trim() && l.url.trim());
      setLinks(cleaned);
      await patch({ widgetLinks: cleaned });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4">
      <div className="flex flex-col items-center text-center gap-2 border border-border rounded-lg bg-surface p-5">
        <p className="font-mono text-[10px] text-muted">▸ PROFILE</p>
        <span className="flex items-center justify-center w-20 h-20 rounded-full border border-border bg-background text-accent overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-7 h-7" />
          )}
        </span>
        <p className="font-semibold">{authorName}</p>
        <p className="font-mono text-xs text-muted">{tagline}</p>
        <p className="font-mono text-xs text-muted">
          팔로워 {followerCount} · 팔로잉 {followingCount}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Link
            href={`/graph?id=${id}`}
            className="flex items-center gap-1.5 font-mono text-xs border border-border rounded px-2 py-1.5 hover:border-accent"
          >
            <GraphIcon className="w-3.5 h-3.5" />
            스페이스
          </Link>
          {viewerId && viewerId !== id && (
            <FollowButton followeeId={id} followeeName={authorName} initialFollowing={initialFollowing} />
          )}
        </div>
      </div>

      {editable && (
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(["left", "right"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => changePosition(p)}
                className={`font-mono text-[11px] border rounded px-2 py-1 ${
                  position === p ? "border-accent text-accent" : "border-border text-muted hover:border-accent"
                }`}
              >
                {p === "left" ? "왼쪽" : "오른쪽"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="font-mono text-[11px] border border-border rounded px-2 py-1 hover:border-accent"
          >
            {editing ? "완료" : "편집"}
          </button>
        </div>
      )}

      {order.map((key, i) => (
        <div key={key} className="flex flex-col gap-2">
          {editable && editing && (
            <div className="flex items-center justify-between px-0.5">
              <span className="font-mono text-[11px] text-muted">{WIDGET_LABELS[key]}</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="font-mono text-[11px] text-muted hover:text-accent disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={i === order.length - 1}
                  onClick={() => move(i, 1)}
                  className="font-mono text-[11px] text-muted hover:text-accent disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
            </div>
          )}
          {key === "recent" && <RecentPostsWidget posts={recentPosts} />}
          {key === "calendar" && <CalendarWidget dates={postDates} />}
          {key === "links" && (
            <LinksWidget
              links={links}
              editing={editable && editing}
              saving={saving}
              onAdd={addLink}
              onChange={updateLink}
              onRemove={removeLink}
              onSave={saveLinks}
            />
          )}
        </div>
      ))}
    </aside>
  );
}

function RecentPostsWidget({ posts }: { posts: RecentPost[] }) {
  return (
    <div className="border border-border rounded-lg bg-surface p-4">
      <p className="font-mono text-[11px] text-muted mb-2">최근 글</p>
      {posts.length === 0 ? (
        <p className="font-mono text-xs text-muted">글이 없습니다</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/posts/${p.slug}`} className="text-sm hover:text-accent line-clamp-1 block">
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function CalendarWidget({ dates }: { dates: string[] }) {
  const daySet = new Set(dates);
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const first = new Date(cursor.year, cursor.month, 1);
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function prevMonth() {
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  }

  function nextMonth() {
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));
  }

  return (
    <div className="border border-border rounded-lg bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="text-muted hover:text-accent font-mono text-xs px-1">
          ‹
        </button>
        <p className="font-mono text-[11px] text-muted">
          {cursor.year}.{pad(cursor.month + 1)}
        </p>
        <button type="button" onClick={nextMonth} className="text-muted hover:text-accent font-mono text-xs px-1">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 font-mono text-[10px] text-center text-muted mb-1">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={i} />;
          const active = daySet.has(`${cursor.year}-${pad(cursor.month + 1)}-${pad(day)}`);
          return (
            <span
              key={i}
              className={`flex items-center justify-center h-6 rounded font-mono text-[10px] ${
                active ? "bg-accent text-background" : "text-muted"
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function LinksWidget({
  links,
  editing,
  saving,
  onAdd,
  onChange,
  onRemove,
  onSave,
}: {
  links: WidgetLink[];
  editing: boolean;
  saving: boolean;
  onAdd: () => void;
  onChange: (i: number, field: "label" | "url", value: string) => void;
  onRemove: (i: number) => void;
  onSave: () => void;
}) {
  if (!editing && links.length === 0) return null;

  return (
    <div className="border border-border rounded-lg bg-surface p-4">
      <p className="font-mono text-[11px] text-muted mb-2">링크</p>
      {editing ? (
        <div className="flex flex-col gap-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                value={link.label}
                onChange={(e) => onChange(i, "label", e.target.value)}
                placeholder="이름"
                className="w-16 bg-background border border-border rounded px-1.5 py-1 text-xs outline-none focus:border-accent"
              />
              <input
                value={link.url}
                onChange={(e) => onChange(i, "url", e.target.value)}
                placeholder="https://"
                className="flex-1 min-w-0 bg-background border border-border rounded px-1.5 py-1 text-xs outline-none focus:border-accent"
              />
              <button type="button" onClick={() => onRemove(i)} className="text-muted hover:text-accent text-xs px-1">
                ×
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between mt-1">
            <button type="button" onClick={onAdd} className="font-mono text-[11px] text-muted hover:text-accent">
              + 추가
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="font-mono text-[11px] border border-border rounded px-2 py-1 hover:border-accent disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {links.map((link, i) => (
            <li key={i}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm hover:text-accent"
              >
                <LinkIcon className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
