import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createPost, normalizeVisibility } from "@/lib/posts";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { title, date, summary, tags, content, status, visibility, thumbnail, letterSpacing, lineHeight } =
    await req.json();
  if (!title || !date || !content) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const user = await currentUser();
  const authorName =
    user?.fullName || user?.username || user?.emailAddresses[0]?.emailAddress || "익명";

  const slug = await createPost(
    {
      title,
      date,
      summary: summary ?? "",
      tags: tags ?? [],
      content,
      status: status === "draft" ? "draft" : "published",
      visibility: normalizeVisibility(visibility),
      thumbnail: typeof thumbnail === "string" ? thumbnail : null,
      letterSpacing: typeof letterSpacing === "number" ? letterSpacing : null,
      lineHeight: typeof lineHeight === "number" ? lineHeight : null,
    },
    userId,
    authorName
  );
  return NextResponse.json({ slug });
}
