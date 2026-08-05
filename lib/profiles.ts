import { sql } from "@/lib/db";

export async function getTagline(authorId: string): Promise<string | null> {
  const rows = (await sql()`
    SELECT tagline FROM profiles WHERE author_id = ${authorId} LIMIT 1
  `) as { tagline: string }[];
  return rows[0]?.tagline ?? null;
}

export async function setTagline(authorId: string, tagline: string): Promise<void> {
  await sql()`
    INSERT INTO profiles (author_id, tagline) VALUES (${authorId}, ${tagline})
    ON CONFLICT (author_id) DO UPDATE SET tagline = EXCLUDED.tagline
  `;
}
