import { sql } from "@/lib/db";

export async function getLikeState(slug: string, userId: string | null) {
  const rows = (await sql()`
    SELECT count(*)::int AS count,
      ${userId}::text IS NOT NULL AND bool_or(user_id = ${userId}::text) AS liked
    FROM likes WHERE post_slug = ${slug}
  `) as { count: number; liked: boolean | null }[];
  return { count: rows[0]?.count ?? 0, liked: rows[0]?.liked ?? false };
}

export async function getLikeCounts(slugs: string[]): Promise<Record<string, number>> {
  if (slugs.length === 0) return {};
  const rows = (await sql()`
    SELECT post_slug, count(*)::int AS count FROM likes
    WHERE post_slug = ANY(${slugs}) GROUP BY post_slug
  `) as { post_slug: string; count: number }[];
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.post_slug] = row.count;
  return counts;
}

export async function toggleLike(slug: string, userId: string) {
  const deleted = (await sql()`
    DELETE FROM likes WHERE post_slug = ${slug} AND user_id = ${userId} RETURNING post_slug
  `) as { post_slug: string }[];

  if (deleted.length === 0) {
    await sql()`
      INSERT INTO likes (post_slug, user_id) VALUES (${slug}, ${userId})
      ON CONFLICT DO NOTHING
    `;
  }

  return getLikeState(slug, userId);
}
