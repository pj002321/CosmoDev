import { sql } from "@/lib/db";

export type NotificationType = "follow" | "comment" | "like";

export type Notification = {
  id: number;
  actorId: string;
  actorName: string;
  type: NotificationType;
  postSlug: string | null;
  postTitle: string | null;
  read: boolean;
  createdAt: string;
};

type Row = {
  id: number;
  actor_id: string;
  actor_name: string;
  type: NotificationType;
  post_slug: string | null;
  post_title: string | null;
  read: boolean;
  created_at: string | Date;
};

function toNotification(row: Row): Notification {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    type: row.type,
    postSlug: row.post_slug,
    postTitle: row.post_title,
    read: row.read,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function createNotification(
  recipientId: string,
  actorId: string,
  actorName: string,
  type: NotificationType,
  postSlug: string | null = null,
  postTitle: string | null = null
): Promise<void> {
  if (recipientId === actorId) return;
  await sql()`
    INSERT INTO notifications (recipient_id, actor_id, actor_name, type, post_slug, post_title)
    VALUES (${recipientId}, ${actorId}, ${actorName}, ${type}, ${postSlug}, ${postTitle})
  `;
}

export async function getNotifications(recipientId: string, limit = 20): Promise<Notification[]> {
  const rows = (await sql()`
    SELECT id, actor_id, actor_name, type, post_slug, post_title, read, created_at
    FROM notifications WHERE recipient_id = ${recipientId}
    ORDER BY created_at DESC LIMIT ${limit}
  `) as Row[];
  return rows.map(toNotification);
}

export async function getUnreadCount(recipientId: string): Promise<number> {
  const rows = (await sql()`
    SELECT count(*)::int AS count FROM notifications
    WHERE recipient_id = ${recipientId} AND read = false
  `) as { count: number }[];
  return rows[0]?.count ?? 0;
}

export async function markAllRead(recipientId: string): Promise<void> {
  await sql()`
    UPDATE notifications SET read = true WHERE recipient_id = ${recipientId} AND read = false
  `;
}
