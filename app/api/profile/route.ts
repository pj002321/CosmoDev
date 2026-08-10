import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { setTagline, setBannerUrl, setBannerPosition } from "@/lib/profiles";

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tagline, bannerUrl, bannerPosition } = await req.json();

  if (typeof bannerUrl === "string" && bannerUrl) {
    await setBannerUrl(userId, bannerUrl);
    return NextResponse.json({ ok: true });
  }

  if (typeof bannerPosition === "number") {
    await setBannerPosition(userId, Math.max(0, Math.min(100, Math.round(bannerPosition))));
    return NextResponse.json({ ok: true });
  }

  if (typeof tagline !== "string" || !tagline.trim()) {
    return NextResponse.json({ error: "invalid tagline" }, { status: 400 });
  }

  await setTagline(userId, tagline.trim().slice(0, 60));
  return NextResponse.json({ ok: true });
}
