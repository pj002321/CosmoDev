import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  parseRepoInput,
  fetchDefaultBranch,
  fetchMarkdownFiles,
  fetchFileContent,
  deriveTitle,
  deriveSummary,
  GitImportError,
} from "@/lib/gitImport";
import { createPost } from "@/lib/posts";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { repo: repoInput, token, categories } = await req.json();
  if (!repoInput) return NextResponse.json({ error: "리포지토리를 입력해주세요" }, { status: 400 });

  const user = await currentUser();
  const authorName = user?.fullName || user?.username || user?.emailAddresses[0]?.emailAddress || "익명";
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { owner, repo } = parseRepoInput(repoInput);
    const branch = await fetchDefaultBranch(owner, repo, token);
    let files = await fetchMarkdownFiles(owner, repo, branch, token);
    if (Array.isArray(categories) && categories.length > 0) {
      const allowed = new Set(categories);
      files = files.filter((f) => allowed.has(f.category));
    }

    // ponytail: imported sequentially (GitHub API rate limit + Vercel function
    // timeout headroom), fine for personal-blog-sized repos. Parallelize with a
    // concurrency cap if repos with hundreds of files become common.
    const slugs: string[] = [];
    for (const file of files) {
      const content = await fetchFileContent(owner, repo, file.path, branch, token);
      const title = deriveTitle(content, file.path);
      const summary = deriveSummary(content);
      const slug = await createPost(
        {
          title,
          date: today,
          summary,
          tags: [file.category],
          content,
          status: "published",
          visibility: "public",
        },
        userId,
        authorName
      );
      slugs.push(slug);
    }

    return NextResponse.json({ imported: slugs.length, slugs });
  } catch (err) {
    if (err instanceof GitImportError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
