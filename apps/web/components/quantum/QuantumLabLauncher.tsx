'use client';

import { useEffect, useState } from 'react';

/**
 * Round atom button that opens the Quantum Lab as a full-screen panel.
 *
 * The lab used to live as a tab inside the classroom menu drawer; it is the
 * main feature, so it gets its own button next to the teacher tools bag (or
 * in the same corner on the student page, which has no bag).
 *
 * The opening animation is CSS only (transform / opacity / one clip-path
 * reveal) and runs once per open, so it costs nothing while the lab is in
 * use. The lab itself is only mounted while the panel is open.
 */

const BOOT_LINES = ['initialising qubits |00⟩', 'loading state-vector simulator', 'calibrating gates H · X · CNOT'];

function AtomIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <g className="qll-orbits">
        <ellipse cx="16" cy="16" rx="13" ry="5" stroke="currentColor" strokeWidth="1.6" />
        <ellipse cx="16" cy="16" rx="13" ry="5" stroke="currentColor" strokeWidth="1.6" transform="rotate(60 16 16)" />
        <ellipse cx="16" cy="16" rx="13" ry="5" stroke="currentColor" strokeWidth="1.6" transform="rotate(-60 16 16)" />
      </g>
      <circle cx="16" cy="16" r="2.6" fill="currentColor" />
    </svg>
  );
}

export function QuantumLabLauncher({
  children,
  offsetLeft = '1.25rem',
  live = false,
}: {
  /** The lab content (QuantumPlayground). Rendered only while open. */
  children: React.ReactNode;
  /** Left position of the button; the teacher page shifts it past the tools bag. */
  offsetLeft?: string;
  /** Shows a small pulse dot when the class has a lab session running. */
  live?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [firing, setFiring] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function launch() {
    setFiring(true);
    window.setTimeout(() => setFiring(false), 600);
    setOpen(true);
  }

  return (
    <>
      <style>{`
        .qll-btn {
          position: fixed;
          top: 1.25rem;
          z-index: 30;
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #a78bfa;
          background: color-mix(in srgb, #a78bfa 16%, transparent);
          color: #c4b5fd;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .qll-btn:hover { transform: scale(1.06); box-shadow: 0 0 14px 2px rgba(167,139,250,0.45); }
        .qll-btn:active { transform: scale(0.92); }
        .qll-btn .qll-orbits { transform-origin: 16px 16px; animation: qll-spin 9s linear infinite; }
        .qll-btn[data-firing='true'] .qll-orbits { animation: qll-spin 0.6s cubic-bezier(.2,.8,.3,1) 1; }
        @keyframes qll-spin { to { transform: rotate(360deg); } }
        .qll-ripple {
          position: absolute;
          inset: -2px;
          border-radius: 9999px;
          border: 2px solid #c4b5fd;
          pointer-events: none;
          animation: qll-ripple 0.6s ease-out forwards;
        }
        @keyframes qll-ripple { from { transform: scale(1); opacity: 0.9; } to { transform: scale(2.2); opacity: 0; } }
        .qll-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: #34d399;
          box-shadow: 0 0 0 2px #0b0b14;
          animation: qll-blink 1.6s ease-in-out infinite;
        }
        @keyframes qll-blink { 50% { opacity: 0.35; } }

        .qll-panel {
          position: fixed;
          inset: 0;
          z-index: 45;
          display: flex;
          flex-direction: column;
          background:
            linear-gradient(rgba(167,139,250,0.06) 1px, transparent 1px) 0 0 / 32px 32px,
            linear-gradient(90deg, rgba(167,139,250,0.06) 1px, transparent 1px) 0 0 / 32px 32px,
            #07071a;
          color: var(--eco-cream);
          clip-path: circle(0 at var(--qll-x) 3rem);
          animation: qll-reveal 0.45s cubic-bezier(.3,.7,.2,1) forwards;
        }
        @keyframes qll-reveal { to { clip-path: circle(150% at var(--qll-x) 3rem); } }
        .qll-scan {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #c4b5fd, transparent);
          opacity: 0;
          pointer-events: none;
          animation: qll-scan 0.7s ease-in 0.2s 1;
        }
        @keyframes qll-scan { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }
        .qll-boot {
          position: absolute;
          left: 50%;
          top: 42%;
          transform: translateX(-50%);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 13px;
          color: #c4b5fd;
          pointer-events: none;
          animation: qll-fade-out 0.25s ease 0.95s forwards;
        }
        .qll-boot div { opacity: 0; animation: qll-line 0.2s ease forwards; }
        .qll-boot div::after { content: '  ✓'; color: #34d399; }
        @keyframes qll-line { to { opacity: 1; } }
        @keyframes qll-fade-out { to { opacity: 0; visibility: hidden; } }
        .qll-body {
          opacity: 0;
          transform: translateY(10px);
          animation: qll-body-in 0.3s ease 1.05s forwards;
        }
        @keyframes qll-body-in { to { opacity: 1; transform: translateY(0); } }
        .qll-back {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.9rem;
          border-radius: 9999px;
          border: 1px solid rgba(167,139,250,0.5);
          color: #ddd6fe;
          font-size: 0.85rem;
          font-weight: 600;
          transition: background 0.15s ease;
        }
        .qll-back:hover { background: rgba(167,139,250,0.15); }
        @media (prefers-reduced-motion: reduce) {
          .qll-panel, .qll-body { animation-duration: 0.01s; animation-delay: 0s; }
          .qll-scan, .qll-boot { display: none; }
          .qll-btn .qll-orbits { animation: none; }
        }
      `}</style>

      <button
        type="button"
        className="qll-btn"
        style={{ left: offsetLeft }}
        data-firing={firing}
        onClick={launch}
        aria-label="Open Quantum Lab"
        title="Quantum Lab"
      >
        <AtomIcon />
        {firing && <span className="qll-ripple" />}
        {live && !open && <span className="qll-dot" />}
      </button>

      {open && (
        <div
          className="qll-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Quantum Lab"
          style={{ '--qll-x': `calc(${offsetLeft} + 1.75rem)` } as React.CSSProperties}
        >
          <div className="qll-scan" />
          <div className="qll-boot" aria-hidden>
            {BOOT_LINES.map((line, i) => (
              <div key={line} style={{ animationDelay: `${0.3 + i * 0.2}s` }}>
                &gt; {line}
              </div>
            ))}
          </div>

          <div className="qll-body flex min-h-0 flex-1 flex-col">
            <header className="flex items-center gap-4 border-b border-[rgba(167,139,250,0.2)] px-5 py-3">
              <button type="button" className="qll-back" onClick={() => setOpen(false)}>
                <span aria-hidden>←</span> Back to class
              </button>
              <div className="flex items-center gap-2 text-[#ddd6fe]">
                <AtomIcon />
                <h2 className="eco-display text-xl">Quantum Lab</h2>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-7xl p-5">{children}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
