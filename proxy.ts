import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedPage = createRouteMatcher(["/write(.*)"]);
const isProtectedApi = createRouteMatcher(["/api/posts(.*)", "/api/upload"]);

export default clerkMiddleware(async (auth, req) => {
  // ponytail: GET under /api/posts(.*) is read-only (post/comment listing) and
  // must stay public so logged-out visitors can view others' posts; only
  // mutating methods (POST/PUT/DELETE) need auth.
  if (isProtectedPage(req) || (isProtectedApi(req) && req.method !== "GET")) {
    const { userId } = await auth();
    if (!userId) {
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  // ponytail: /__clerk is Clerk's own Frontend API proxy tunnel — clerkMiddleware's
  // internal handshake call hits the same host_invalid bug our proxy route works
  // around, so it must never run on this path.
  matcher: ["/((?!_next|__clerk|.*\\..*).*)", "/(api|trpc)(.*)"],
};
