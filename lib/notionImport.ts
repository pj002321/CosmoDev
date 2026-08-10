const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export type NotionLeaf = { id: string; title: string };
export type NotionCategory = { category: string; pages: NotionLeaf[] };

type RichText = {
  plain_text: string;
  href?: string | null;
  annotations?: { bold?: boolean; italic?: boolean; strikethrough?: boolean; code?: boolean };
};

type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  child_page?: { title: string };
  paragraph?: { rich_text: RichText[] };
  heading_1?: { rich_text: RichText[] };
  heading_2?: { rich_text: RichText[] };
  heading_3?: { rich_text: RichText[] };
  bulleted_list_item?: { rich_text: RichText[] };
  numbered_list_item?: { rich_text: RichText[] };
  to_do?: { rich_text: RichText[]; checked: boolean };
  quote?: { rich_text: RichText[] };
  code?: { rich_text: RichText[]; language: string };
  image?: { type: string; external?: { url: string }; file?: { url: string } };
};

export class NotionImportError extends Error {}

async function notionFetch(path: string, token: string) {
  const res = await fetch(`${NOTION_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
    },
  });
  if (res.status === 401) throw new NotionImportError("Notion 토큰이 올바르지 않아요.");
  if (res.status === 404) {
    throw new NotionImportError(
      "페이지를 찾을 수 없어요. Notion 통합(integration)이 해당 페이지에 연결되어 있는지 확인해주세요."
    );
  }
  if (!res.ok) throw new NotionImportError(`Notion API 오류 (${res.status})`);
  return res.json();
}

// Accepts a notion.so URL or a raw page ID (with or without dashes).
export function parseNotionInput(input: string): string {
  const hex = input.trim().replace(/[^0-9a-fA-F]/g, "");
  const match = hex.match(/[0-9a-fA-F]{32}$/);
  if (!match) throw new NotionImportError("올바른 Notion 페이지 URL이나 ID를 입력해주세요.");
  const id = match[0];
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

async function fetchAllChildren(blockId: string, token: string): Promise<NotionBlock[]> {
  const results: NotionBlock[] = [];
  let cursor: string | undefined;
  do {
    const qs = cursor ? `?page_size=100&start_cursor=${cursor}` : "?page_size=100";
    const data = await notionFetch(`/blocks/${blockId}/children${qs}`, token);
    results.push(...(data.results as NotionBlock[]));
    cursor = data.has_more ? (data.next_cursor as string) : undefined;
  } while (cursor);
  return results;
}

async function fetchChildPages(blockId: string, token: string): Promise<NotionLeaf[]> {
  const children = await fetchAllChildren(blockId, token);
  return children
    .filter((b) => b.type === "child_page" && b.child_page)
    .map((b) => ({ id: b.id, title: b.child_page!.title }));
}

// Direct sub-pages of the root become categories (folders); their sub-pages
// become posts. Root-level pages with no sub-pages of their own land in "root".
export async function buildNotionTree(rootPageId: string, token: string): Promise<NotionCategory[]> {
  const level1 = await fetchChildPages(rootPageId, token);
  const categories = new Map<string, NotionLeaf[]>();
  for (const page of level1) {
    const subPages = await fetchChildPages(page.id, token);
    if (subPages.length > 0) {
      categories.set(page.title, subPages);
    } else {
      categories.set("root", [...(categories.get("root") ?? []), page]);
    }
  }
  return [...categories.entries()].map(([category, pages]) => ({ category, pages }));
}

function richText(rt: RichText[] = []): string {
  return rt
    .map((t) => {
      let text = t.plain_text ?? "";
      const a = t.annotations ?? {};
      if (a.code) text = `\`${text}\``;
      if (a.bold) text = `**${text}**`;
      if (a.italic) text = `*${text}*`;
      if (a.strikethrough) text = `~~${text}~~`;
      if (t.href) text = `[${text}](${t.href})`;
      return text;
    })
    .join("");
}

function blockToText(block: NotionBlock, depth: number): string {
  const indent = "  ".repeat(depth);
  switch (block.type) {
    case "paragraph":
      return richText(block.paragraph?.rich_text) ? indent + richText(block.paragraph!.rich_text) : "";
    case "heading_1":
      return indent + "# " + richText(block.heading_1?.rich_text);
    case "heading_2":
      return indent + "## " + richText(block.heading_2?.rich_text);
    case "heading_3":
      return indent + "### " + richText(block.heading_3?.rich_text);
    case "bulleted_list_item":
      return indent + "- " + richText(block.bulleted_list_item?.rich_text);
    case "numbered_list_item":
      return indent + "1. " + richText(block.numbered_list_item?.rich_text);
    case "to_do":
      return indent + `- [${block.to_do?.checked ? "x" : " "}] ` + richText(block.to_do?.rich_text);
    case "quote":
      return indent + "> " + richText(block.quote?.rich_text);
    case "code": {
      const lang = block.code?.language || "";
      return `${indent}\`\`\`${lang}\n${richText(block.code?.rich_text)}\n${indent}\`\`\``;
    }
    case "divider":
      return indent + "---";
    case "image": {
      const img = block.image;
      const url = img?.type === "external" ? img.external?.url : img?.file?.url;
      return url ? indent + `![](${url})` : "";
    }
    default:
      return "";
  }
}

// ponytail: skips child_page/child_database when recursing (those are
// separate posts, not this page's body) and doesn't paginate rich_text >100
// items per block — fine for typical blog-post-sized Notion pages.
async function fetchPageMarkdownParts(blockId: string, token: string, depth = 0): Promise<string[]> {
  const children = await fetchAllChildren(blockId, token);
  const out: string[] = [];
  for (const block of children) {
    const text = blockToText(block, depth);
    if (text) out.push(text);
    if (block.has_children && block.type !== "child_page" && block.type !== "child_database") {
      out.push(...(await fetchPageMarkdownParts(block.id, token, depth + 1)));
    }
  }
  return out;
}

export async function fetchPageContent(pageId: string, token: string): Promise<string> {
  const parts = await fetchPageMarkdownParts(pageId, token);
  return parts.join("\n\n");
}
