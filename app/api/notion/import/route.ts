import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { parseNotionInput, buildNotionTree, fetchPageContent, NotionImportError } from "@/lib/notionImport";
import { deriveSummary } from "@/lib/gitImport";
import { createPost } from "@/lib/posts";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { rootPageId, token, categories } = await req.json();
  if (!rootPageId) return NextResponse.json({ error: "페이지를 입력해주세요" }, { status: 400 });
  if (!token) return NextResponse.json({ error: "Notion 토큰을 입력해주세요" }, { status: 400 });

  const user = await currentUser();
  const authorName = user?.fullName || user?.username || user?.emailAddresses[0]?.emailAddress || "익명";
  const today = new Date().toISOString().slice(0, 10);

  try {
    const pageId = parseNotionInput(rootPageId);
    let tree = await buildNotionTree(pageId, token);
    if (Array.isArray(categories) && categories.length > 0) {
      const allowed = new Set(categories);
      tree = tree.filter((c) => allowed.has(c.category));
    }

    const slugs: string[] = [];
    for (const cat of tree) {
      for (const page of cat.pages) {
        const content = await fetchPageContent(page.id, token);
        const summary = deriveSummary(content);
        const slug = await createPost(
          {
            title: page.title,
            date: today,
            summary,
            tags: [cat.category],
            content,
            status: "published",
            visibility: "public",
            thumbnail: null,
            letterSpacing: null,
            lineHeight: null,
          },
          userId,
          authorName
        );
        slugs.push(slug);
      }
    }

    return NextResponse.json({ imported: slugs.length, slugs });
  } catch (err) {
    if (err instanceof NotionImportError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
