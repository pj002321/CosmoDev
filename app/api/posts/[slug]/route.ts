import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updatePost, deletePost, normalizeVisibility } from "@/lib/posts";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { title, date, summary, tags, content, status, visibility, thumbnail } = await req.json();
  if (!title || !date || !content) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const ok = await updatePost(
    slug,
    {
      title,
      date,
      summary: summary ?? "",
      tags: tags ?? [],
      content,
      status: status === "draft" ? "draft" : "published",
      visibility: normalizeVisibility(visibility),
      thumbnail: typeof thumbnail === "string" ? thumbnail : null,
    },
    userId
  );
  if (!ok) return NextResponse.json({ error: "not found or forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slug } = await params;
  const ok = await deletePost(slug, userId);
  if (!ok) return NextResponse.json({ error: "not found or forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
