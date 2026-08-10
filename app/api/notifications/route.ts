import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getNotifications, getUnreadCount, markAllRead } from "@/lib/notifications";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(userId),
    getUnreadCount(userId),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await markAllRead(userId);
  return NextResponse.json({ ok: true });
}
