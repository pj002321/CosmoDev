import { fapiUrlFromPublishableKey } from "@clerk/backend/proxy";

// ponytail: @clerk/nextjs's createFrontendApiProxyHandlers() always injects
// an X-Forwarded-Host header, which Clerk's FAPI rejects with "host_invalid"
// for custom-domain production instances. No option exists to disable it,
// so this reimplements the proxy without that header.
const PROXY_PATH = "/__clerk";
const STRIPPED_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-for",
]);

async function handler(request: Request) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!;
  const fapiUrl = process.env.CLERK_FAPI_URL || fapiUrlFromPublishableKey(publishableKey);

  const url = new URL(request.url);
  const targetPath = url.pathname.slice(PROXY_PATH.length) || "/";
  const target = new URL(`${fapiUrl}${targetPath}${url.search}`);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY!);
  headers.set("Clerk-Proxy-Url", `${url.origin}${PROXY_PATH}`);

  const hasBody = request.body !== null;
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
