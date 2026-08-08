import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ results: [] });

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return NextResponse.json({ error: "UNSPLASH_ACCESS_KEY가 설정되지 않았습니다" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12`,
    { headers: { Authorization: `Client-ID ${key}` } }
  );
  if (!res.ok) return NextResponse.json({ error: "검색에 실패했습니다" }, { status: 502 });

  const data = await res.json();
  const results = (data.results ?? []).map((p: {
    id: string;
    urls: { thumb: string; regular: string };
    alt_description: string | null;
    links: { download_location: string };
    user: { name: string; links: { html: string } };
  }) => ({
    id: p.id,
    thumb: p.urls.thumb,
    regular: p.urls.regular,
    alt: p.alt_description ?? "",
    downloadLocation: p.links.download_location,
    authorName: p.user.name,
    authorUrl: p.user.links.html,
  }));

  return NextResponse.json({ results });
}
