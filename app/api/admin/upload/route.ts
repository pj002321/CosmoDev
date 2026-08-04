import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// ponytail: routes the file through our function, capped by Vercel's ~4.5MB
// request body limit. Switch to @vercel/blob/client direct upload if larger
// images are needed.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });
  }

  const blob = await put(`images/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
