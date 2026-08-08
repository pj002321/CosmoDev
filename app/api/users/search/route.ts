import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ users: [] });

  const client = await clerkClient();
  const { data } = await client.users.getUserList({ query: q, limit: 8 });

  const users = data
    .filter((u) => u.id !== userId)
    .map((u) => ({
      id: u.id,
      name: u.fullName || u.username || u.emailAddresses[0]?.emailAddress || "익명",
      email: u.emailAddresses[0]?.emailAddress ?? "",
    }));

  return NextResponse.json({ users });
}
