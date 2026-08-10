import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { parseNotionInput, buildNotionTree, NotionImportError } from "@/lib/notionImport";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { rootPageId, token } = await req.json();
  if (!rootPageId) return NextResponse.json({ error: "페이지를 입력해주세요" }, { status: 400 });
  if (!token) return NextResponse.json({ error: "Notion 토큰을 입력해주세요" }, { status: 400 });

  try {
    const pageId = parseNotionInput(rootPageId);
    const tree = await buildNotionTree(pageId, token);
    const categories = tree.map((c) => ({ name: c.category, count: c.pages.length }));
    const totalFiles = tree.reduce((s, c) => s + c.pages.length, 0);
    return NextResponse.json({ categories, totalFiles });
  } catch (err) {
    if (err instanceof NotionImportError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
