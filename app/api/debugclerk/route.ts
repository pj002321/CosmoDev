export async function GET(request: Request) {
  const testHeaders = new Headers({
    "Clerk-Secret-Key": process.env.CLERK_SECRET_KEY!,
    "Clerk-Proxy-Url": "https://cosmodev.calzykri.com/__clerk",
  });
  const extra = request.headers.get("x-probe-extra");
  if (extra) testHeaders.set(extra, request.headers.get("x-probe-value") || "test");

  const res = await fetch(
    "https://clerk.cosmodev.calzykri.com/v1/environment?__clerk_api_version=2026-05-12&_clerk_js_version=6.29.0",
    { headers: testHeaders }
  );
  return new Response(JSON.stringify({ status: res.status, tried: extra }), {
    headers: { "content-type": "application/json" },
  });
}
