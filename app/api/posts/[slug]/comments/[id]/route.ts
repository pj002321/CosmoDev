import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteComment } from "@/lib/comments";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteComment(Number(id), userId);
  if (!ok) return NextResponse.json({ error: "not found or forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
