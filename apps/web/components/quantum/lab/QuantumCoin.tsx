'use client';

import { useEffect, useRef, useState } from 'react';
import { sampleCounts } from '@/lib/quantum/helpers';
import { Panel, Q, QButton } from './theme';
import { useProgress } from './progress';

const PREP = [
  { label: '|0⟩', p1: 0, note: 'Always 0 — no superposition, no surprise.' },
  { label: '|+⟩  (H)', p1: 0.5, note: 'A perfect 50/50 quantum coin.' },
  { label: 'Ry(π/3)', p1: 0.25, note: 'A biased coin: 25% chance of 1.' },
  { label: '|1⟩', p1: 1, note: 'Always 1.' },
];

export function QuantumCoin() {
  const [p1, setP1] = useState(0.5);
  const [counts, setCounts] = useState<[number, number]>([0, 0]);
  const [last, setLast] = useState<0 | 1 | null>(null);
  const [spin, setSpin] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const { update, unlock, award } = useProgress();

  useEffect(() => () => window.clearInterval(timer.current), []);

  function record(add: [number, number]) {
    setCounts((c) => [c[0] + add[0], c[1] + add[1]]);
    const n = add[0] + add[1];
    update((p) => {
      const flips = p.flips + n;
      if (flips >= 1000 && p.flips < 1000) window.setTimeout(() => unlock('coin-master'), 0);
      return { ...p, flips };
    });
  }

  function flipOne() {
    const r = Math.random() < p1 ? 1 : 0;
    setSpin((s) => s + 1);
    window.setTimeout(() => setLast(r), 420);
    record(r ? [0, 1] : [1, 0]);
  }

  function flipMany(n: number) {
    window.clearInterval(timer.current);
    const batches = 10;
    let i = 0;
    timer.current = window.setInterval(() => {
      const size = Math.floor(n / batches) + (i < n % batches ? 1 : 0);
      const [a, b] = sampleCounts([1 - p1, p1], size);
      record([a ?? 0, b ?? 0]);
      i += 1;
      if (i >= batches) {
        window.clearInterval(timer.current);
        award(3, `Measured ${n} qubits`);
      }
    }, 70);
  }

  const total = counts[0] + counts[1];
  const obs = total ? counts[1] / total : 0;
  const theta = 2 * Math.asin(Math.sqrt(p1));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <Panel title="Prepare your quantum coin">
        <div className="mb-4 flex flex-wrap gap-2">
          {PREP.map((p) => (
            <QButton key={p.label} color={Q.cyan} primary={Math.abs(p1 - p.p1) < 1e-9} onClick={() => { setP1(p.p1); setCounts([0, 0]); setLast(null); }}>
              {p.label}
            </QButton>
          ))}
        </div>
        <label className="mb-1 block text-xs" style={{ color: Q.faint }}>
          Custom bias — Ry(θ) with θ = {Math.round((theta * 180) / Math.PI)}° → P(1) = {Math.round(p1 * 100)}%
        </label>
        <input type="range" min={0} max={100} value={Math.round(p1 * 100)} onChange={(e) => { setP1(Number(e.target.value) / 100); setCounts([0, 0]); }} className="w-full accent-[#a78bfa]" />

        <div className="my-6 flex justify-center" style={{ perspective: 600 }}>
          <div
            key={spin}
            className="qcoin flex h-28 w-28 items-center justify-center rounded-full font-mono text-4xl font-bold"
            style={{
              background: last === 1 ? `radial-gradient(circle at 35% 30%, #fbcfe8, ${Q.pink})` : `radial-gradient(circle at 35% 30%, #cffafe, ${Q.cyan})`,
              color: '#0b0620',
              boxShadow: `0 0 30px ${last === 1 ? Q.pink : Q.cyan}`,
              animation: spin ? 'qcoin-flip .45s ease-out' : undefined,
            }}
          >
            {last === null ? 'ψ' : last}
          </div>
        </div>
        <style>{`@keyframes qcoin-flip { from { transform: rotateY(0) scale(.9); } 60% { transform: rotateY(540deg) scale(1.1); } to { transform: rotateY(720deg) scale(1); } }`}</style>

        <div className="flex flex-wrap justify-center gap-2">
          <QButton primary color={Q.pink} onClick={flipOne}>Measure once</QButton>
          <QButton color={Q.pink} onClick={() => flipMany(100)}>×100</QButton>
          <QButton color={Q.pink} onClick={() => flipMany(1000)}>×1000</QButton>
          <QButton onClick={() => { setCounts([0, 0]); setLast(null); }}>Reset</QButton>
        </div>
      </Panel>

      <Panel title="What the statistics say">
        {[0, 1].map((k) => {
          const frac = total ? counts[k as 0 | 1] / total : 0;
          const exact = k === 1 ? p1 : 1 - p1;
          return (
            <div key={k} className="mb-4">
              <div className="mb-1 flex justify-between font-mono text-xs" style={{ color: Q.dim }}>
                <span>measured {k}: {counts[k as 0 | 1]}</span>
                <span>{Math.round(frac * 100)}% (theory {Math.round(exact * 100)}%)</span>
              </div>
              <div className="relative h-6 overflow-hidden rounded-full" style={{ background: 'rgba(139,92,246,.12)' }}>
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${exact * 100}%`, border: `1px dashed ${Q.amber}` }} />
                <div className="qlab-bar h-full rounded-full" style={{ width: `${frac * 100}%`, background: k ? Q.pink : Q.cyan }} />
              </div>
            </div>
          );
        })}
        <p className="rounded-xl p-3 text-sm leading-relaxed" style={{ background: 'rgba(34,211,238,.07)', color: Q.dim }}>
          {total === 0
            ? PREP.find((p) => Math.abs(p.p1 - p1) < 1e-9)?.note ?? 'Measure to see what happens.'
            : total < 50
              ? 'Few measurements = noisy results. One measurement tells you almost nothing about the state.'
              : `After ${total} measurements you’re within ${Math.abs(Math.round((obs - p1) * 1000) / 10)}% of the true probability. This is the Born rule: probability = |amplitude|².`}
        </p>
      </Panel>
    </div>
  );
}
