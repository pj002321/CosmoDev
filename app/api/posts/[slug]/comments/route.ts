import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getComments, addComment } from "@/lib/comments";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const comments = await getComments(slug);
  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { content } = await req.json();
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요" }, { status: 400 });
  }

  const user = await currentUser();
  const authorName = user?.fullName || user?.username || user?.emailAddresses[0]?.emailAddress || "익명";
  const comment = await addComment(slug, userId, authorName, content.trim());
  return NextResponse.json({ comment });
}
