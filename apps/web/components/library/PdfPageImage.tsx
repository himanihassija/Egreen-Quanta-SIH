'use client';

import { useEffect, useRef, useState } from 'react';

// pdf.js 6 calls Map#getOrInsertComputed, which older browsers lack.
if (typeof Map !== 'undefined' && !('getOrInsertComputed' in Map.prototype)) {
  Object.defineProperty(Map.prototype, 'getOrInsertComputed', {
    configurable: true,
    writable: true,
    value: function <K, V>(this: Map<K, V>, key: K, compute: (k: K) => V): V {
      if (!this.has(key)) this.set(key, compute(key));
      return this.get(key) as V;
    },
  });
}

type PdfDoc = { getPage: (n: number) => Promise<any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
const docs = new Map<string, Promise<PdfDoc>>();

/** One shared pdf.js document per URL, loaded on first use. */
export function loadPdf(url: string): Promise<PdfDoc> {
  let doc = docs.get(url);
  if (!doc) {
    doc = (async () => {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
      return pdfjsLib.getDocument({ url }).promise as unknown as Promise<PdfDoc>;
    })();
    docs.set(url, doc);
    doc.catch(() => docs.delete(url));
  }
  return doc;
}

/**
 * Renders one PDF page only once it is actually on screen, so a 400-page
 * reference book costs a couple of canvases, not 400 images.
 */
export function PdfPageImage({ url, page }: { url: string; page: number }) {
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = holder.current;
    if (!el || visible) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisible(true);
        io.disconnect();
      }
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || src) return;
    let cancelled = false;
    let task: { promise: Promise<void>; cancel: () => void } | null = null;
    (async () => {
      try {
        const doc = await loadPdf(url);
        const p = await doc.getPage(page);
        const viewport = p.getViewport({ scale: 1.4 });
        // Render off-screen, then show it as an <img> exactly like uploaded PDF
        // pages, so the whole page scales to fit instead of being clipped.
        const c = document.createElement('canvas');
        c.width = Math.ceil(viewport.width);
        c.height = Math.ceil(viewport.height);
        const ctx = c.getContext('2d');
        if (!ctx || cancelled) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        task = p.render({ canvasContext: ctx, viewport });
        await task!.promise;
        if (!cancelled) setSrc(c.toDataURL('image/jpeg', 0.85));
      } catch {
        // A cancelled render (unmount / strict-mode re-run) is not a failure.
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [visible, src, url, page]);

  return (
    <div
      ref={holder}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Page ${page}`} className="pdf-canvas-img" />
      ) : (
        <span style={{ fontSize: 12, opacity: 0.6, color: '#333' }}>
          {failed ? 'Page failed to load' : `Loading page ${page}…`}
        </span>
      )}
    </div>
  );
}
