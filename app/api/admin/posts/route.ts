import { NextRequest, NextResponse } from "next/server";
import { savePost, slugify } from "@/lib/posts";

export async function POST(req: NextRequest) {
  const { title, date, summary, tags, content } = await req.json();

  if (!title || !date || !content) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const slug = slugify(title, date);
  await savePost(slug, { title, date, summary: summary ?? "", tags: tags ?? [], content });
  return NextResponse.json({ slug });
}
