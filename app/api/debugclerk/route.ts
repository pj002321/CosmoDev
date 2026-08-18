export async function GET() {
  const res = await fetch(
    "https://clerk.cosmodev.calzykri.com/v1/environment?__clerk_api_version=2026-05-12&_clerk_js_version=6.29.0",
    {
      headers: {
        "Clerk-Secret-Key": process.env.CLERK_SECRET_KEY!,
        "Clerk-Proxy-Url": "https://cosmodev.calzykri.com/__clerk",
      },
    }
  );
  const text = await res.text();
  return new Response(JSON.stringify({ status: res.status, body: text.slice(0, 300) }), {
    headers: { "content-type": "application/json" },
  });
}
