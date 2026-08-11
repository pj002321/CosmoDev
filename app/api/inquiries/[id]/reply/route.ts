import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getInquiry, replyToInquiry } from "@/lib/inquiries";
import { isAdminEmail } from "@/lib/admin";
import { sendEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!isAdminEmail(email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const { reply } = await req.json();
  if (typeof reply !== "string" || !reply.trim()) {
    return NextResponse.json({ error: "답변 내용을 입력해주세요" }, { status: 400 });
  }

  const inquiry = await getInquiry(Number(id));
  if (!inquiry) return NextResponse.json({ error: "not found" }, { status: 404 });

  await replyToInquiry(inquiry.id, reply.trim());

  await sendEmail(
    inquiry.senderEmail,
    `[답변] ${inquiry.title}`,
    `<p>문의하신 내용에 대한 답변입니다.</p><blockquote>${inquiry.content.replace(/\n/g, "<br>")}</blockquote><p>${reply.trim().replace(/\n/g, "<br>")}</p>`
  );

  return NextResponse.json({ ok: true });
}
