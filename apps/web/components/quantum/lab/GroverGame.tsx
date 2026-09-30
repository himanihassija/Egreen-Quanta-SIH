'use client';

import { useState } from 'react';
import { ket } from '@/lib/quantum/helpers';
import { Confetti, Panel, Q, QButton } from './theme';
import { useProgress } from './progress';

const ICONS = ['🍎', '🚀', '🎸', '🐱', '⚽', '🌵', '🎲', '🍩'];

export function GroverGame() {
  const [n, setN] = useState<2 | 3>(2);
  const N = 2 ** n;
  const [secret, setSecret] = useState(() => Math.floor(Math.random() * 4));
  const [amps, setAmps] = useState<number[]>(() => new Array(4).fill(0.5));
  const [log, setLog] = useState<string[]>(['H on every qubit → all boxes equally likely']);
  const [found, setFound] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const { award, unlock } = useProgress();

  const optimal = Math.max(1, Math.round((Math.PI / 4) * Math.sqrt(N)));
  const rounds = log.filter((l) => l.startsWith('Diffusion')).length;

  function reset(size: 2 | 3 = n) {
    const M = 2 ** size;
    setN(size);
    setSecret(Math.floor(Math.random() * M));
    setAmps(new Array(M).fill(1 / Math.sqrt(M)));
    setLog(['H on every qubit → all boxes equally likely']);
    setFound(null);
    setReveal(false);
  }

  function oracle() {
    setAmps((a) => a.map((v, i) => (i === secret ? -v : v)));
    setLog((l) => [...l, 'Oracle → secretly flips the sign of the marked box']);
  }

  function diffuse() {
    setAmps((a) => {
      const mean = a.reduce((s, v) => s + v, 0) / a.length;
      return a.map((v) => 2 * mean - v);
    });
    setLog((l) => [...l, 'Diffusion → reflects every amplitude about the average']);
  }

  function measure() {
    const probs = amps.map((v) => v * v);
    let r = Math.random();
    let k = 0;
    for (; k < probs.length - 1; k += 1) {
      r -= probs[k]!;
      if (r < 0) break;
    }
    setFound(k);
    setReveal(true);
    if (k === secret) {
      award(15, "Grover's search succeeded");
      unlock('grover');
    }
  }

  const maxAbs = Math.max(...amps.map(Math.abs), 0.001);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <Panel
        title={`Find the hidden item among ${N} boxes`}
        right={
          <div className="flex gap-1 text-xs">
            {([2, 3] as const).map((s) => (
              <button key={s} type="button" onClick={() => reset(s)} className="rounded-full px-2.5 py-1" style={{ background: n === s ? Q.cyan : 'rgba(139,92,246,.12)', color: n === s ? '#07071a' : Q.dim }}>
                {s} qubits
              </button>
            ))}
          </div>
        }
      >
        <div className="relative">
          {reveal && found === secret && <Confetti key={`g-${log.length}`} />}
          <div className="mb-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
            {amps.map((v, i) => {
              const h = (Math.abs(v) / maxAbs) * 70;
              const isFound = reveal && found === i;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="relative flex h-40 w-full flex-col items-center justify-center">
                    <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: Q.line }} />
                    <div
                      className="absolute w-3/5 rounded-md"
                      style={{
                        height: h,
                        bottom: v >= 0 ? '50%' : undefined,
                        top: v < 0 ? '50%' : undefined,
                        background: v >= 0 ? `linear-gradient(0deg, ${Q.violet}, ${Q.cyan})` : `linear-gradient(180deg, ${Q.pink}, #7c3aed)`,
                        transition: 'height .4s cubic-bezier(.3,.7,.2,1)',
                      }}
                    />
                  </div>
                  <div
                    className={`mt-1 flex h-12 w-full items-center justify-center rounded-xl text-2xl ${isFound ? 'qlab-pop' : ''}`}
                    style={{
                      background: isFound ? (found === secret ? 'rgba(52,211,153,.3)' : 'rgba(251,113,133,.25)') : 'rgba(139,92,246,.1)',
                      border: `1px solid ${isFound ? (found === secret ? Q.green : Q.red) : Q.line}`,
                    }}
                  >
                    {reveal && (i === secret || isFound) ? ICONS[i] : '📦'}
                  </div>
                  <span className="mt-1 font-mono text-[11px]" style={{ color: Q.faint }}>{ket(i, n)}</span>
                  <span className="font-mono text-[11px]" style={{ color: Q.dim }}>{Math.round(v * v * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mb-3 text-xs" style={{ color: Q.faint }}>Bars show amplitudes — below the line means a negative sign. Percent = probability.</p>
        <div className="flex flex-wrap gap-2">
          <QButton color={Q.pink} onClick={oracle} disabled={reveal}>① Oracle</QButton>
          <QButton color={Q.cyan} onClick={diffuse} disabled={reveal}>② Diffusion</QButton>
          <QButton primary color={Q.green} onClick={measure} disabled={reveal}>Measure</QButton>
          <QButton onClick={() => reset()}>New secret</QButton>
          <QButton color={Q.amber} onClick={() => setReveal(true)} disabled={reveal}>Peek 👀</QButton>
        </div>
        {reveal && found !== null && (
          <p className="qlab-pop mt-3 text-sm" style={{ color: found === secret ? Q.green : Q.red }}>
            {found === secret
              ? `Found it in ${rounds} Grover round${rounds === 1 ? '' : 's'}! A classical search could need up to ${N - 1} peeks.`
              : `Missed — measured ${ket(found, n)}. Try the optimal ${optimal} round${optimal === 1 ? '' : 's'} of Oracle → Diffusion.`}
          </p>
        )}
      </Panel>

      <Panel title="How it works">
        <ol className="mb-4 space-y-2 text-sm leading-relaxed" style={{ color: Q.dim }}>
          <li><b style={{ color: Q.pink }}>Oracle</b> marks the answer by flipping its sign. Probabilities don’t change — only the phase.</li>
          <li><b style={{ color: Q.cyan }}>Diffusion</b> flips everything about the average. The marked one was below average, so it shoots up.</li>
          <li>Repeat about <b style={{ color: Q.green }}>π/4 · √N = {optimal}</b> time{optimal === 1 ? '' : 's'}, then measure.</li>
        </ol>
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl p-3 font-mono text-[11px]" style={{ background: 'rgba(5,5,20,.7)', color: Q.faint }}>
          {log.map((l, i) => <div key={i}>{i}. {l}</div>)}
        </div>
        <p className="mt-3 text-xs" style={{ color: Q.faint }}>
          Try too many rounds and the answer starts shrinking again — quantum search overshoots!
        </p>
      </Panel>
    </div>
  );
}
