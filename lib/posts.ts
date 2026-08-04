import { put, list, del } from "@vercel/blob";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
};

export type PostInput = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  content: string;
};

function toDateString(date: unknown): string {
  return date instanceof Date ? date.toISOString().slice(0, 10) : String(date);
}

function pathnameFor(slug: string) {
  return `posts/${slug}.md`;
}

async function findBlob(slug: string) {
  const { blobs } = await list({ prefix: pathnameFor(slug), limit: 1 });
  return blobs.find((b) => b.pathname === pathnameFor(slug)) ?? null;
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const { blobs } = await list({ prefix: "posts/" });
  const posts = await Promise.all(
    blobs.map(async (blob) => {
      const raw = await (await fetch(blob.url, { cache: "no-store" })).text();
      const { data } = matter(raw);
      return {
        slug: blob.pathname.replace(/^posts\//, "").replace(/\.md$/, ""),
        title: data.title as string,
        date: toDateString(data.date),
        summary: (data.summary as string) ?? "",
        tags: (data.tags as string[]) ?? [],
      };
    })
  );
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string) {
  const blob = await findBlob(slug);
  if (!blob) return null;
  const raw = await (await fetch(blob.url, { cache: "no-store" })).text();
  const { data, content } = matter(raw);
  const processed = await remark().use(remarkGfm).use(html).process(content);
  return {
    slug,
    title: data.title as string,
    date: toDateString(data.date),
    summary: (data.summary as string) ?? "",
    tags: (data.tags as string[]) ?? [],
    content,
    contentHtml: processed.toString(),
  };
}

function toMarkdown(input: PostInput): string {
  return [
    "---",
    `title: ${JSON.stringify(input.title)}`,
    `date: ${input.date}`,
    `summary: ${JSON.stringify(input.summary)}`,
    `tags: [${input.tags.map((t) => JSON.stringify(t)).join(", ")}]`,
    "---",
    "",
    input.content,
  ].join("\n");
}

export function slugify(title: string, date: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const id = Math.random().toString(36).slice(2, 8);
  return base ? `${date}-${base}-${id}` : `${date}-${id}`;
}

export async function savePost(slug: string, input: PostInput) {
  await put(pathnameFor(slug), toMarkdown(input), {
    access: "public",
    contentType: "text/markdown",
    allowOverwrite: true,
  });
}

export async function deletePost(slug: string) {
  const blob = await findBlob(slug);
  if (blob) await del(blob.url);
}
