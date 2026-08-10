import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { toggleLike } from "@/lib/likes";
import { getPostOwner } from "@/lib/posts";
import { createNotification } from "@/lib/notifications";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slug } = await params;
  const state = await toggleLike(slug, userId);

  if (state.liked) {
    const owner = await getPostOwner(slug);
    if (owner) {
      const user = await currentUser();
      const actorName = user?.fullName || user?.username || user?.emailAddresses[0]?.emailAddress || "익명";
      await createNotification(owner.authorId, userId, actorName, "like", slug, owner.title);
    }
  }

  return NextResponse.json(state);
}
