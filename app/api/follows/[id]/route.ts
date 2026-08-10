import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { follow, unfollow } from "@/lib/follows";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: followeeId } = await params;
  if (followeeId === userId) {
    return NextResponse.json({ error: "자기 자신은 추가할 수 없습니다" }, { status: 400 });
  }

  const { name } = await req.json();
  if (typeof name !== "string" || !name) {
    return NextResponse.json({ error: "name이 필요합니다" }, { status: 400 });
  }

  await follow(userId, followeeId, name);

  const user = await currentUser();
  const actorName = user?.fullName || user?.username || user?.emailAddresses[0]?.emailAddress || "익명";
  await createNotification(followeeId, userId, actorName, "follow");

  return NextResponse.json({ following: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: followeeId } = await params;
  await unfollow(userId, followeeId);
  return NextResponse.json({ following: false });
}
