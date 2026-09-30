/**
 * Same-origin proxy for the reference shelf's PDFs.
 *
 * pdf.js needs the file on our origin (the publishers' hosts send no CORS
 * headers), and proxying keeps the PDFs out of the repo: nothing is copied,
 * the file is fetched from its original home and cached for a day.
 * Only the allow-listed sources below can be fetched.
 */
const SOURCES: Record<string, string> = {
  wong: 'https://www.thomaswong.net/introduction-to-classical-and-quantum-computing-1e4p.pdf',
  dewolf: 'https://arxiv.org/pdf/1907.09415',
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = SOURCES[id];
  if (!url) return new Response('Unknown book', { status: 404 });

  let upstream: Response;
  try {
    // Some hosts turn away requests without a browser-like user agent.
    // No Next.js data cache here: it caps entries at 2 MB and these PDFs are larger.
    upstream = await fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
        Accept: 'application/pdf,*/*',
      },
    });
  } catch (err) {
    return new Response(`Could not reach the book's host: ${String(err)}`, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(`The book's host answered ${upstream.status}`, { status: 502 });
  }
  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Cache-Control': 'public, max-age=86400',
  });
  const length = upstream.headers.get('content-length');
  if (length) headers.set('Content-Length', length);
  return new Response(upstream.body, { headers });
}
