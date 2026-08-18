export async function GET() {
  const res = await fetch("https://httpbin.org/headers", {
    headers: { "X-Test-Marker": "probe" },
  });
  return new Response(await res.text(), { headers: { "content-type": "application/json" } });
}
