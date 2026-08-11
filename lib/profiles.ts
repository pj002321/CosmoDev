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

export async function getBannerUrl(authorId: string): Promise<string | null> {
  const rows = (await sql()`
    SELECT banner_url FROM profiles WHERE author_id = ${authorId} LIMIT 1
  `) as { banner_url: string | null }[];
  return rows[0]?.banner_url ?? null;
}

export async function setBannerUrl(authorId: string, bannerUrl: string): Promise<void> {
  await sql()`
    INSERT INTO profiles (author_id, tagline, banner_url) VALUES (${authorId}, '', ${bannerUrl})
    ON CONFLICT (author_id) DO UPDATE SET banner_url = EXCLUDED.banner_url
  `;
}

export async function getBannerPosition(authorId: string): Promise<number> {
  const rows = (await sql()`
    SELECT banner_position FROM profiles WHERE author_id = ${authorId} LIMIT 1
  `) as { banner_position: number }[];
  return rows[0]?.banner_position ?? 50;
}

export async function setBannerPosition(authorId: string, position: number): Promise<void> {
  await sql()`
    INSERT INTO profiles (author_id, tagline, banner_position) VALUES (${authorId}, '', ${position})
    ON CONFLICT (author_id) DO UPDATE SET banner_position = EXCLUDED.banner_position
  `;
}

export type WidgetKey = "recent" | "calendar" | "links";
export type WidgetPosition = "left" | "right";
export type WidgetLink = { label: string; url: string };

export const DEFAULT_WIDGET_ORDER: WidgetKey[] = ["recent", "calendar", "links"];

export async function getWidgetPosition(authorId: string): Promise<WidgetPosition> {
  const rows = (await sql()`
    SELECT widget_position FROM profiles WHERE author_id = ${authorId} LIMIT 1
  `) as { widget_position: WidgetPosition }[];
  return rows[0]?.widget_position ?? "right";
}

export async function setWidgetPosition(authorId: string, position: WidgetPosition): Promise<void> {
  await sql()`
    INSERT INTO profiles (author_id, tagline, widget_position) VALUES (${authorId}, '', ${position})
    ON CONFLICT (author_id) DO UPDATE SET widget_position = EXCLUDED.widget_position
  `;
}

export async function getWidgetOrder(authorId: string): Promise<WidgetKey[]> {
  const rows = (await sql()`
    SELECT widget_order FROM profiles WHERE author_id = ${authorId} LIMIT 1
  `) as { widget_order: WidgetKey[] }[];
  return rows[0]?.widget_order ?? DEFAULT_WIDGET_ORDER;
}

export async function setWidgetOrder(authorId: string, order: WidgetKey[]): Promise<void> {
  await sql()`
    INSERT INTO profiles (author_id, tagline, widget_order) VALUES (${authorId}, '', ${JSON.stringify(order)}::jsonb)
    ON CONFLICT (author_id) DO UPDATE SET widget_order = EXCLUDED.widget_order
  `;
}

export async function getWidgetLinks(authorId: string): Promise<WidgetLink[]> {
  const rows = (await sql()`
    SELECT widget_links FROM profiles WHERE author_id = ${authorId} LIMIT 1
  `) as { widget_links: WidgetLink[] }[];
  return rows[0]?.widget_links ?? [];
}

export async function setWidgetLinks(authorId: string, links: WidgetLink[]): Promise<void> {
  await sql()`
    INSERT INTO profiles (author_id, tagline, widget_links) VALUES (${authorId}, '', ${JSON.stringify(links)}::jsonb)
    ON CONFLICT (author_id) DO UPDATE SET widget_links = EXCLUDED.widget_links
  `;
}
