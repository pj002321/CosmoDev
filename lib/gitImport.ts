const GITHUB_API = "https://api.github.com";
const USER_AGENT = "CosmoDev-Import";

export type GitFile = { path: string; category: string };
export type GitCategory = { name: string; count: number };

export class GitImportError extends Error {}

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function ghFetch(url: string, token?: string) {
  const res = await fetch(url, { headers: headers(token) });
  if (res.status === 404) {
    throw new GitImportError("리포지토리를 찾을 수 없어요. private 리포지토리면 토큰을 입력해주세요.");
  }
  if (res.status === 403) {
    throw new GitImportError("GitHub API 요청 한도를 초과했어요. 잠시 후 다시 시도하거나 토큰을 입력해주세요.");
  }
  if (!res.ok) {
    throw new GitImportError(`GitHub API 오류 (${res.status})`);
  }
  return res.json();
}

// Accepts "owner/repo", a github.com URL, or a URL with a trailing .git.
export function parseRepoInput(input: string): { owner: string; repo: string } {
  const cleaned = input.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const urlMatch = cleaned.match(/github\.com[/:]([^/]+)\/([^/]+)$/);
  const [owner, repo] = urlMatch ? [urlMatch[1], urlMatch[2]] : cleaned.split("/");
  if (!owner || !repo) {
    throw new GitImportError("리포지토리 형식이 올바르지 않아요. (예: owner/repo)");
  }
  return { owner, repo };
}

export async function fetchDefaultBranch(owner: string, repo: string, token?: string) {
  const data = await ghFetch(`${GITHUB_API}/repos/${owner}/${repo}`, token);
  return data.default_branch as string;
}

function categoryOf(path: string): string {
  const slash = path.indexOf("/");
  return slash === -1 ? "root" : path.slice(0, slash);
}

export async function fetchMarkdownFiles(
  owner: string,
  repo: string,
  branch: string,
  token?: string
): Promise<GitFile[]> {
  const data = await ghFetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    token
  );
  type TreeEntry = { path: string; type: string };
  const entries = (data.tree ?? []) as TreeEntry[];
  return entries
    .filter((e) => e.type === "blob" && e.path.toLowerCase().endsWith(".md"))
    .map((e) => ({ path: e.path, category: categoryOf(e.path) }));
}

export function groupByCategory(files: GitFile[]): GitCategory[] {
  const counts = new Map<string, number>();
  for (const f of files) counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  token?: string
): Promise<string> {
  const data = await ghFetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${branch}`,
    token
  );
  return Buffer.from(data.content, "base64").toString("utf-8");
}

export function deriveTitle(content: string, path: string): string {
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.md$/i, "").replace(/[-_]+/g, " ").trim();
}

export function deriveSummary(content: string): string {
  const plain = content
    .replace(/^#.*$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*`>[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 150);
}
