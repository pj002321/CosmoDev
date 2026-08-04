import { NextRequest, NextResponse } from "next/server";
import { savePost, deletePost } from "@/lib/posts";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { title, date, summary, tags, content } = await req.json();

  if (!title || !date || !content) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  await savePost(slug, { title, date, summary: summary ?? "", tags: tags ?? [], content });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await deletePost(slug);
  return NextResponse.json({ ok: true });
}
