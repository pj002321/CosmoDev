import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { toggleLike } from "@/lib/likes";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slug } = await params;
  const state = await toggleLike(slug, userId);
  return NextResponse.json(state);
}
