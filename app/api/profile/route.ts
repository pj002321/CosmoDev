import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  setTagline,
  setBannerUrl,
  setBannerPosition,
  setWidgetPosition,
  setWidgetOrder,
  setWidgetLinks,
  setWidgetSocial,
  ALL_WIDGET_KEYS,
  type WidgetKey,
  type WidgetLink,
} from "@/lib/profiles";

function sanitizeLinks(links: unknown[]): WidgetLink[] {
  return links
    .filter(
      (l): l is WidgetLink =>
        !!l &&
        typeof (l as WidgetLink).label === "string" &&
        typeof (l as WidgetLink).url === "string" &&
        (l as WidgetLink).label.trim() !== "" &&
        /^https?:\/\//.test((l as WidgetLink).url.trim())
    )
    .slice(0, 10)
    .map((l) => ({ label: l.label.trim().slice(0, 20), url: l.url.trim().slice(0, 300) }));
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tagline, bannerUrl, bannerPosition, widgetPosition, widgetOrder, widgetLinks, widgetSocial } =
    await req.json();

  if (typeof bannerUrl === "string" && bannerUrl) {
    await setBannerUrl(userId, bannerUrl);
    return NextResponse.json({ ok: true });
  }

  if (typeof bannerPosition === "number") {
    await setBannerPosition(userId, Math.max(0, Math.min(100, Math.round(bannerPosition))));
    return NextResponse.json({ ok: true });
  }

  if (widgetPosition === "left" || widgetPosition === "right") {
    await setWidgetPosition(userId, widgetPosition);
    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(widgetOrder)) {
    const unique = new Set(widgetOrder);
    const valid =
      unique.size === widgetOrder.length && widgetOrder.every((k) => ALL_WIDGET_KEYS.includes(k));
    if (!valid) return NextResponse.json({ error: "invalid widget order" }, { status: 400 });
    await setWidgetOrder(userId, widgetOrder as WidgetKey[]);
    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(widgetLinks)) {
    await setWidgetLinks(userId, sanitizeLinks(widgetLinks));
    return NextResponse.json({ ok: true });
  }

  if (widgetSocial && typeof widgetSocial === "object") {
    const urlFields = ["x", "linkedin", "instagram", "youtube", "github"] as const;
    const cleaned: Record<string, unknown> = {};
    for (const field of urlFields) {
      const value = widgetSocial[field];
      if (typeof value === "string" && /^https?:\/\//.test(value.trim())) {
        cleaned[field] = value.trim().slice(0, 300);
      }
    }
    if (Array.isArray(widgetSocial.githubRepos)) {
      cleaned.githubRepos = sanitizeLinks(widgetSocial.githubRepos);
    }
    await setWidgetSocial(userId, cleaned);
    return NextResponse.json({ ok: true });
  }

  if (typeof tagline !== "string" || !tagline.trim()) {
    return NextResponse.json({ error: "invalid tagline" }, { status: 400 });
  }

  await setTagline(userId, tagline.trim().slice(0, 60));
  return NextResponse.json({ ok: true });
}
