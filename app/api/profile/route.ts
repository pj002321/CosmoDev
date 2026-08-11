import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  setTagline,
  setBannerUrl,
  setBannerPosition,
  setWidgetPosition,
  setWidgetOrder,
  setWidgetLinks,
  DEFAULT_WIDGET_ORDER,
  type WidgetKey,
} from "@/lib/profiles";

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tagline, bannerUrl, bannerPosition, widgetPosition, widgetOrder, widgetLinks } = await req.json();

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
    const valid = widgetOrder.length === DEFAULT_WIDGET_ORDER.length &&
      DEFAULT_WIDGET_ORDER.every((k) => widgetOrder.includes(k));
    if (!valid) return NextResponse.json({ error: "invalid widget order" }, { status: 400 });
    await setWidgetOrder(userId, widgetOrder as WidgetKey[]);
    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(widgetLinks)) {
    const cleaned = widgetLinks
      .filter(
        (l) =>
          l &&
          typeof l.label === "string" &&
          typeof l.url === "string" &&
          l.label.trim() &&
          /^https?:\/\//.test(l.url.trim())
      )
      .slice(0, 10)
      .map((l) => ({ label: l.label.trim().slice(0, 20), url: l.url.trim().slice(0, 300) }));
    await setWidgetLinks(userId, cleaned);
    return NextResponse.json({ ok: true });
  }

  if (typeof tagline !== "string" || !tagline.trim()) {
    return NextResponse.json({ error: "invalid tagline" }, { status: 400 });
  }

  await setTagline(userId, tagline.trim().slice(0, 60));
  return NextResponse.json({ ok: true });
}
