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

  const upstream = await fetch(url, { next: { revalidate: 86400 } });
  if (!upstream.ok || !upstream.body) {
    return new Response('Could not fetch the book', { status: 502 });
  }
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
