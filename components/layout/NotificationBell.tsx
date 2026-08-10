"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/icons";
import type { Notification } from "@/lib/notifications";

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

function notificationText(n: Notification) {
  if (n.type === "follow") return `${n.actorName}님이 나를 팔로우했습니다`;
  if (n.type === "like") return `${n.actorName}님이 '${n.postTitle}'을(를) 좋아합니다`;
  return `${n.actorName}님이 '${n.postTitle}'에 댓글을 남겼습니다`;
}

function notificationHref(n: Notification) {
  return n.type === "follow" ? `/u/${n.actorId}` : `/posts/${n.postSlug}`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      setUnreadCount(0);
      await fetch("/api/notifications", { method: "POST" });
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent px-2.5 py-1.5 rounded hover:bg-surface transition-colors cursor-pointer"
      >
        <BellIcon className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-1 w-3.5 h-3.5 rounded-full bg-accent text-background text-[9px] leading-[14px] text-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto glass-panel border border-border rounded-lg shadow-lg z-20">
          {notifications.length === 0 ? (
            <p className="font-mono text-xs text-muted px-4 py-6 text-center">알림이 없습니다</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={notificationHref(n)}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 border-b border-border last:border-0 hover:bg-surface transition-colors"
              >
                <p className="text-xs">{notificationText(n)}</p>
                <p className="font-mono text-[10px] text-muted mt-1">{relativeTime(n.createdAt)}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
