import { sql } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";

export type PostStatus = "draft" | "published";
export type PostVisibility = "public" | "private";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  authorId: string;
  authorName: string;
  views: number;
  status: PostStatus;
  visibility: PostVisibility;
};

export type PostInput = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  content: string;
  status: PostStatus;
  visibility: PostVisibility;
};

type Row = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  author_id: string;
  author_name: string;
  views: number;
  status: PostStatus;
  visibility: PostVisibility;
  content?: string;
};

function toMeta(row: Row): PostMeta {
  return {
    slug: row.slug,
    title: row.title,
    date: row.date,
    summary: row.summary,
    tags: row.tags,
    authorId: row.author_id,
    authorName: row.author_name,
    views: row.views,
    status: row.status,
    visibility: row.visibility,
  };
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

export function uniqueTags(posts: { tags: string[] }[]): string[] {
  return [...new Set(posts.flatMap((p) => p.tags))];
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const rows = (await sql()`
    SELECT slug, title, date, summary, tags, author_id, author_name, views, status, visibility
    FROM posts WHERE status = 'published' AND visibility = 'public'
    ORDER BY date DESC, created_at DESC
  `) as Row[];
  return rows.map(toMeta);
}

export async function getPostsByAuthor(authorId: string): Promise<PostMeta[]> {
  const rows = (await sql()`
    SELECT slug, title, date, summary, tags, author_id, author_name, views, status, visibility
    FROM posts WHERE author_id = ${authorId} ORDER BY date DESC, created_at DESC
  `) as Row[];
  return rows.map(toMeta);
}

export async function getPost(slug: string) {
  const rows = (await sql()`
    SELECT slug, title, date, summary, tags, author_id, author_name, views, status, visibility, content
    FROM posts WHERE slug = ${slug} LIMIT 1
  `) as Row[];
  const row = rows[0];
  if (!row) return null;
  return {
    ...toMeta(row),
    content: row.content ?? "",
    contentHtml: await renderMarkdown(row.content ?? ""),
  };
}

// ponytail: counts every page load, no dedup by viewer/session; switch to a
// per-viewer/day check (cookie or table) if inflated counts become a problem.
export async function incrementViews(slug: string): Promise<number> {
  const rows = (await sql()`
    UPDATE posts SET views = views + 1 WHERE slug = ${slug} RETURNING views
  `) as { views: number }[];
  return rows[0]?.views ?? 0;
}

export async function createPost(input: PostInput, authorId: string, authorName: string) {
  const slug = slugify(input.title, input.date);
  await sql()`
    INSERT INTO posts (slug, title, date, summary, tags, content, author_id, author_name, status, visibility)
    VALUES (${slug}, ${input.title}, ${input.date}, ${input.summary}, ${input.tags}, ${input.content}, ${authorId}, ${authorName}, ${input.status}, ${input.visibility})
  `;
  return slug;
}

export async function updatePost(slug: string, input: PostInput, authorId: string) {
  const rows = (await sql()`
    UPDATE posts SET title = ${input.title}, date = ${input.date}, summary = ${input.summary},
      tags = ${input.tags}, content = ${input.content}, status = ${input.status}, visibility = ${input.visibility}
    WHERE slug = ${slug} AND author_id = ${authorId}
    RETURNING slug
  `) as { slug: string }[];
  return rows.length > 0;
}

export async function deletePost(slug: string, authorId: string) {
  const rows = (await sql()`
    DELETE FROM posts WHERE slug = ${slug} AND author_id = ${authorId} RETURNING slug
  `) as { slug: string }[];
  return rows.length > 0;
}
