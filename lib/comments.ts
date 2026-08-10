import { sql } from "@/lib/db";

export type Comment = {
  id: number;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

type Row = {
  id: number;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

function toComment(row: Row): Comment {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function getComments(slug: string): Promise<Comment[]> {
  const rows = (await sql()`
    SELECT id, author_id, author_name, content, created_at
    FROM comments WHERE post_slug = ${slug} ORDER BY created_at ASC
  `) as Row[];
  return rows.map(toComment);
}

export async function addComment(
  slug: string,
  authorId: string,
  authorName: string,
  content: string
): Promise<Comment> {
  const rows = (await sql()`
    INSERT INTO comments (post_slug, author_id, author_name, content)
    VALUES (${slug}, ${authorId}, ${authorName}, ${content})
    RETURNING id, author_id, author_name, content, created_at
  `) as Row[];
  return toComment(rows[0]);
}

export async function deleteComment(id: number, authorId: string): Promise<boolean> {
  const rows = (await sql()`
    DELETE FROM comments WHERE id = ${id} AND author_id = ${authorId} RETURNING id
  `) as { id: number }[];
  return rows.length > 0;
}
