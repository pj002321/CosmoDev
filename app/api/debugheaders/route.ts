const STRIPPED_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-for",
]);

export async function GET(request: Request) {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("Clerk-Secret-Key", "redacted-for-probe");
  headers.set("Clerk-Proxy-Url", "https://cosmodev.calzykri.com/__clerk");

  const res = await fetch("https://httpbin.org/headers", { headers });
  return new Response(await res.text(), { headers: { "content-type": "application/json" } });
}
