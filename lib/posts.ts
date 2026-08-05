import { sql } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  authorId: string;
  authorName: string;
};

export type PostInput = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  content: string;
};

type Row = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  author_id: string;
  author_name: string;
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
    SELECT slug, title, date, summary, tags, author_id, author_name
    FROM posts ORDER BY date DESC, created_at DESC
  `) as Row[];
  return rows.map(toMeta);
}

export async function getPostsByAuthor(authorId: string): Promise<PostMeta[]> {
  const rows = (await sql()`
    SELECT slug, title, date, summary, tags, author_id, author_name
    FROM posts WHERE author_id = ${authorId} ORDER BY date DESC, created_at DESC
  `) as Row[];
  return rows.map(toMeta);
}

export async function getPost(slug: string) {
  const rows = (await sql()`
    SELECT slug, title, date, summary, tags, author_id, author_name, content
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

export async function createPost(input: PostInput, authorId: string, authorName: string) {
  const slug = slugify(input.title, input.date);
  await sql()`
    INSERT INTO posts (slug, title, date, summary, tags, content, author_id, author_name)
    VALUES (${slug}, ${input.title}, ${input.date}, ${input.summary}, ${input.tags}, ${input.content}, ${authorId}, ${authorName})
  `;
  return slug;
}

export async function updatePost(slug: string, input: PostInput, authorId: string) {
  const rows = (await sql()`
    UPDATE posts SET title = ${input.title}, date = ${input.date}, summary = ${input.summary},
      tags = ${input.tags}, content = ${input.content}
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
