import { clerkFrontendApiProxy } from "@clerk/nextjs/server";

// ponytail: Vercel injects x-forwarded-host for every request; Clerk's FAPI
// rejects proxied requests that carry it for custom-domain prod instances
// (host_invalid), so strip it and let Clerk-Proxy-Url (set internally) carry
// that info instead.
function handler(request: Request) {
  const headers = new Headers(request.headers);
  headers.delete("x-forwarded-host");
  const stripped = new Request(request, { headers });
  return clerkFrontendApiProxy(stripped);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
