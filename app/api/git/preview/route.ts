import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  parseRepoInput,
  fetchDefaultBranch,
  fetchMarkdownFiles,
  groupByCategory,
  GitImportError,
} from "@/lib/gitImport";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { repo: repoInput, token } = await req.json();
  if (!repoInput) return NextResponse.json({ error: "리포지토리를 입력해주세요" }, { status: 400 });

  try {
    const { owner, repo } = parseRepoInput(repoInput);
    const branch = await fetchDefaultBranch(owner, repo, token);
    const files = await fetchMarkdownFiles(owner, repo, branch, token);
    const categories = groupByCategory(files);
    return NextResponse.json({ owner, repo, branch, categories, totalFiles: files.length });
  } catch (err) {
    if (err instanceof GitImportError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
