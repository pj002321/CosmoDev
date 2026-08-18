import { fapiUrlFromPublishableKey } from "@clerk/backend/proxy";

// ponytail: @clerk/nextjs's createFrontendApiProxyHandlers() forwards every
// incoming header verbatim, including X-Forwarded-Host (Vercel/edge infra)
// and X-Clerk-Auth-* (set by our own clerkMiddleware in proxy.ts) — both
// confuse Clerk FAPI's instance-attribution check ("host_invalid") for
// custom-domain production instances. Forward only what Clerk's FAPI needs.
const PROXY_PATH = "/__clerk";
const FORWARDED_HEADERS = new Set([
  "accept",
  "accept-language",
  "content-type",
  "user-agent",
  "cookie",
  "origin",
  "referer",
]);

async function handler(request: Request) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!;
  const fapiUrl = process.env.CLERK_FAPI_URL || fapiUrlFromPublishableKey(publishableKey);

  const url = new URL(request.url);
  const targetPath = url.pathname.slice(PROXY_PATH.length) || "/";
  const target = new URL(`${fapiUrl}${targetPath}${url.search}`);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (FORWARDED_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY!);
  headers.set("Clerk-Proxy-Url", `${url.origin}${PROXY_PATH}`);

  if (url.searchParams.has("__debug")) {
    const debugHeaders = Object.fromEntries(headers.entries());
    debugHeaders["clerk-secret-key"] = "redacted";
    return new Response(
      JSON.stringify({ targetUrl: target.toString(), method: request.method, forwardedHeaders: debugHeaders }),
      { headers: { "content-type": "application/json" } }
    );
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD" && request.body !== null;
  const res = await fetch(target, {
    method: request.method,
    headers,
    redirect: "manual",
    ...(hasBody ? { body: request.body, duplex: "half" } : {}),
  } as RequestInit);

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  const location = responseHeaders.get("location");
  if (location) {
    const loc = new URL(location, fapiUrl);
    if (loc.host === new URL(fapiUrl).host) {
      responseHeaders.set("location", `${url.origin}${PROXY_PATH}${loc.pathname}${loc.search}`);
    }
  }

  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: responseHeaders });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
