export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const src = searchParams.get('src');
  if (!src) return new Response('Missing src', { status: 400 });

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return new Response('Invalid src', { status: 400 });
  }

  const allowedHosts = [
    'drive.google.com',
    'googleusercontent.com',
    'lh3.googleusercontent.com',
    'lh4.googleusercontent.com',
    'lh5.googleusercontent.com',
    'lh6.googleusercontent.com',
  ];
  const hostOk = allowedHosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  if (!hostOk) return new Response('Forbidden host', { status: 400 });

  const upstream = await fetch(url.toString(), {
    // Avoid sending referrers/cookies; rely on public sharing
    cache: 'no-store',
  });

  if (!upstream.ok) {
    return new Response(`Upstream error: ${upstream.status}`, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
  const buf = await upstream.arrayBuffer();

  return new Response(buf, {
    headers: {
      'Content-Type': contentType,
      // Cache at the edge/CDN for 1 hour
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
