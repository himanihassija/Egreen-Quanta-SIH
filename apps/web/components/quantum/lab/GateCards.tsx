'use client';

import { useState } from 'react';
import type { Circuit } from '@/lib/quantum/helpers';
import { GATES, GateChip, Q } from './theme';
import { useProgress } from './progress';

export function GateCards({ onTry }: { onTry: (c: Circuit) => void }) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const { progress, update, unlock } = useProgress();

  function flip(g: string) {
    setFlipped((f) => ({ ...f, [g]: !f[g] }));
    if (!progress.cardsSeen.includes(g)) {
      update((p) => {
        if (p.cardsSeen.includes(g)) return p;
        const seen = [...p.cardsSeen, g];
        if (seen.length >= GATES.length) window.setTimeout(() => unlock('scholar'), 0);
        return { ...p, cardsSeen: seen };
      });
    }
  }

  return (
    <div>
      <style>{`
        .qcard { perspective: 900px; height: 250px; }
        .qcard-inner { position: relative; width: 100%; height: 100%; transition: transform .5s cubic-bezier(.3,.7,.2,1); transform-style: preserve-3d; }
        .qcard[data-flipped='true'] .qcard-inner { transform: rotateY(180deg); }
        .qcard-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 18px; border: 1px solid ${Q.line}; padding: 14px; display: flex; flex-direction: column; }
        .qcard-back { transform: rotateY(180deg); }
      `}</style>
      <p className="mb-3 text-sm" style={{ color: Q.faint }}>
        Tap a card to flip it. {progress.cardsSeen.length}/{GATES.length} studied.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {GATES.map((g) => (
          <div key={g.gate} className="qcard" data-flipped={Boolean(flipped[g.gate])}>
            <div className="qcard-inner">
              <button
                type="button"
                onClick={() => flip(g.gate)}
                className="qcard-face items-center justify-center gap-3 text-center"
                style={{ background: `radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, ${g.color} 22%, transparent), rgba(18,17,46,.9))` }}
              >
                <GateChip gate={g.gate} size={64} />
                <span className="text-base font-semibold" style={{ color: Q.text }}>{g.name}</span>
                <span className="text-xs" style={{ color: Q.faint }}>{g.twoQubit ? 'two-qubit gate' : g.angle ? 'rotation gate' : 'single-qubit gate'}{progress.cardsSeen.includes(g.gate) ? ' · ✓' : ''}</span>
              </button>
              <div className="qcard-face qcard-back gap-2 text-left" style={{ background: 'rgba(14,13,38,.97)' }}>
                <button type="button" onClick={() => flip(g.gate)} className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: g.color }}>{g.name}</span>
                  <span className="text-xs" style={{ color: Q.faint }}>↺ flip</span>
                </button>
                <p className="text-xs leading-relaxed" style={{ color: Q.dim }}>{g.short}</p>
                <pre className="rounded-lg px-2 py-1 font-mono text-[11px] leading-snug" style={{ background: 'rgba(5,5,20,.7)', color: Q.cyan }}>{g.matrix.join('\n')}</pre>
                <p className="text-[11px] leading-snug" style={{ color: Q.faint }}>🧠 {g.analogy}</p>
                <button
                  type="button"
                  onClick={() => onTry({ qubits: g.twoQubit ? 2 : 1, gates: g.twoQubit ? [{ gate: 'h', qubit: 0 }, { gate: g.gate, qubit: 0, target: 1 }] : g.angle ? [{ gate: g.gate, qubit: 0, angle: Math.PI / 2 }] : [{ gate: g.gate, qubit: 0 }] })}
                  className="mt-auto self-start rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: g.color, color: '#07071a' }}
                >
                  Try it in the Sandbox →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
