'use client';

import { useState } from 'react';
import { Panel, Q, QButton } from './theme';
import { useProgress } from './progress';

type Mode = 'bell' | 'anti' | 'independent';

const MODES: Array<{ id: Mode; label: string; circuit: string; note: string }> = [
  { id: 'bell', label: 'Entangled (Φ⁺)', circuit: 'H · CNOT', note: 'Alice and Bob ALWAYS agree — yet each result on its own is a random coin flip.' },
  { id: 'anti', label: 'Entangled (Ψ⁺)', circuit: 'H · CNOT · X', note: 'Alice and Bob ALWAYS disagree. Still perfectly correlated.' },
  { id: 'independent', label: 'Not entangled', circuit: 'H ⊗ H', note: 'Two separate coins: they agree only about half the time.' },
];

const DISTANCES = ['the same desk', 'different cities', 'Earth and Mars', 'opposite ends of the galaxy'];

export function EntanglementLab() {
  const [mode, setMode] = useState<Mode>('bell');
  const [pair, setPair] = useState<{ a: 0 | 1; b: 0 | 1; id: number } | null>(null);
  const [revealA, setRevealA] = useState(false);
  const [revealB, setRevealB] = useState(false);
  const [tally, setTally] = useState({ same: 0, diff: 0 });
  const [dist, setDist] = useState(2);
  const { unlock, award } = useProgress();

  function newPair() {
    const a: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
    const b: 0 | 1 = mode === 'bell' ? a : mode === 'anti' ? ((1 - a) as 0 | 1) : Math.random() < 0.5 ? 0 : 1;
    setPair({ a, b, id: Date.now() });
    setRevealA(false);
    setRevealB(false);
  }

  function measure(who: 'a' | 'b') {
    if (!pair) return;
    if (who === 'a') setRevealA(true);
    else setRevealB(true);
    const bothNow = (who === 'a' ? revealB : revealA) === true;
    if (bothNow) {
      setTally((t) => {
        const next = pair.a === pair.b ? { ...t, same: t.same + 1 } : { ...t, diff: t.diff + 1 };
        if (mode !== 'independent' && next.same + next.diff >= 20) window.setTimeout(() => unlock('spooky'), 0);
        return next;
      });
      award(1, 'Pair measured');
    }
  }

  function measureMany(n: number) {
    let same = 0;
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() < 0.5 ? 0 : 1;
      const b = mode === 'bell' ? a : mode === 'anti' ? 1 - a : Math.random() < 0.5 ? 0 : 1;
      if (a === b) same += 1;
    }
    setTally((t) => {
      const next = { same: t.same + same, diff: t.diff + n - same };
      if (mode !== 'independent' && next.same + next.diff >= 20) window.setTimeout(() => unlock('spooky'), 0);
      return next;
    });
    award(3, `Measured ${n} pairs`);
  }

  const total = tally.same + tally.diff;
  const info = MODES.find((m) => m.id === mode)!;

  const card = ({ who, name, value, shown }: { who: 'a' | 'b'; name: string; value: 0 | 1 | undefined; shown: boolean }) => (
    <div className="flex flex-col items-center gap-3">
      <span className="text-sm font-semibold" style={{ color: Q.dim }}>{name}</span>
      <div
        key={`${pair?.id}-${who}-${shown}`}
        className={shown ? 'qlab-pop' : ''}
        style={{
          width: 110, height: 140, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'ui-monospace, monospace', fontSize: shown ? 56 : 30, fontWeight: 700,
          background: shown ? (value ? `linear-gradient(160deg, ${Q.pink}, #7c3aed)` : `linear-gradient(160deg, ${Q.cyan}, #6366f1)`) : 'rgba(139,92,246,.1)',
          border: `1.5px solid ${shown ? 'transparent' : Q.line}`,
          color: shown ? '#0b0620' : Q.faint,
          boxShadow: shown ? `0 0 26px ${value ? Q.pink : Q.cyan}` : 'none',
        }}
      >
        {!pair ? '—' : shown ? value : '?'}
      </div>
      <QButton color={who === 'a' ? Q.cyan : Q.pink} disabled={!pair || shown} onClick={() => measure(who)}>Measure</QButton>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Panel title="Alice & Bob share a pair of qubits">
        <div className="mb-4 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <QButton key={m.id} color={m.id === 'independent' ? Q.violet : Q.green} primary={mode === m.id} onClick={() => { setMode(m.id); setPair(null); setTally({ same: 0, diff: 0 }); }}>
              {m.label}
            </QButton>
          ))}
        </div>
        <p className="mb-4 text-xs" style={{ color: Q.faint }}>
          Circuit: <span className="font-mono" style={{ color: Q.cyan }}>{info.circuit}</span> · Distance apart:{' '}
          <select value={dist} onChange={(e) => setDist(Number(e.target.value))} className="rounded-md px-1 py-0.5" style={{ background: '#12112e', color: Q.dim }}>
            {DISTANCES.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </p>

        <div className="relative flex items-center justify-around py-2">
          {card({ who: 'a', name: 'Alice', value: pair?.a, shown: revealA })}
          <div className="flex flex-1 flex-col items-center px-2">
            <div className="h-0.5 w-full" style={{ background: mode === 'independent' ? Q.line : `repeating-linear-gradient(90deg, ${Q.green} 0 8px, transparent 8px 14px)`, boxShadow: mode === 'independent' ? 'none' : `0 0 10px ${Q.green}` }} />
            <span className="mt-2 text-center text-[11px]" style={{ color: Q.faint }}>{DISTANCES[dist]}</span>
          </div>
          {card({ who: 'b', name: 'Bob', value: pair?.b, shown: revealB })}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <QButton primary color={Q.green} onClick={newPair}>✨ Create a new pair</QButton>
          <QButton onClick={() => measureMany(100)}>Measure 100 pairs</QButton>
        </div>
        {pair && revealA !== revealB && mode !== 'independent' && (
          <p className="qlab-pop mt-3 text-center text-sm" style={{ color: Q.green }}>
            {revealA ? 'Alice' : 'Bob'} measured — the other qubit’s answer is now fixed, even across {DISTANCES[dist]}. Predict it before you measure!
          </p>
        )}
      </Panel>

      <Panel title="Correlation scoreboard">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl p-3" style={{ background: 'rgba(52,211,153,.1)' }}>
            <div className="font-mono text-3xl font-bold" style={{ color: Q.green }}>{tally.same}</div>
            <div className="text-xs" style={{ color: Q.faint }}>same result</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(244,114,182,.1)' }}>
            <div className="font-mono text-3xl font-bold" style={{ color: Q.pink }}>{tally.diff}</div>
            <div className="text-xs" style={{ color: Q.faint }}>different result</div>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full" style={{ background: 'rgba(244,114,182,.35)' }}>
          <div className="qlab-bar h-full" style={{ width: `${total ? (tally.same / total) * 100 : 50}%`, background: Q.green }} />
        </div>
        <p className="mt-2 text-center font-mono text-xs" style={{ color: Q.dim }}>{total ? `${Math.round((tally.same / total) * 100)}% agree over ${total} pairs` : 'no pairs measured yet'}</p>
        <p className="mt-4 rounded-xl p-3 text-sm leading-relaxed" style={{ background: 'rgba(34,211,238,.07)', color: Q.dim }}>{info.note}</p>
        <p className="mt-3 text-xs leading-relaxed" style={{ color: Q.faint }}>
          Why can’t they use this to text each other faster than light? Because Alice can’t choose her result — it’s random. The correlation only shows up when they compare notes.
        </p>
      </Panel>
    </div>
  );
}
