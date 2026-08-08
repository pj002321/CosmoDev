import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Unsplash API guidelines require pinging download_location when a photo is used.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { downloadLocation } = await req.json();
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || typeof downloadLocation !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await fetch(downloadLocation, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
