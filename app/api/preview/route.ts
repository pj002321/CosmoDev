import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { renderMarkdown } from "@/lib/markdown";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { content } = await req.json();
  const html = await renderMarkdown(typeof content === "string" ? content : "");
  return NextResponse.json({ html });
}
