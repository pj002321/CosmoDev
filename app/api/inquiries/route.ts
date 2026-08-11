import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createInquiry, getInquiries } from "@/lib/inquiries";
import { isAdminEmail, ADMIN_EMAIL } from "@/lib/admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { title, content } = await req.json();
  if (typeof title !== "string" || !title.trim() || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요" }, { status: 400 });
  }

  const user = await currentUser();
  const senderName = user?.fullName || user?.username || "익명";
  const senderEmail = user?.emailAddresses[0]?.emailAddress ?? "";
  if (!senderEmail) {
    return NextResponse.json({ error: "이메일 정보를 확인할 수 없습니다" }, { status: 400 });
  }

  const inquiry = await createInquiry(userId, senderName, senderEmail, title.trim(), content.trim());

  await sendEmail(
    ADMIN_EMAIL,
    `[문의] ${inquiry.title}`,
    `<p><b>${inquiry.senderName}</b> (${inquiry.senderEmail})</p><p>${inquiry.content.replace(/\n/g, "<br>")}</p>`
  );

  return NextResponse.json({ inquiry });
}

export async function GET() {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!isAdminEmail(email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const inquiries = await getInquiries();
  return NextResponse.json({ inquiries });
}
