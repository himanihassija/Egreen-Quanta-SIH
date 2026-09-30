'use client';

import { useMemo, useState } from 'react';
import { Panel, Q } from './theme';
import { BADGES, LEVELS, levelOf, useProgress } from './progress';

const TERMS: Array<{ term: string; simple: string; deeper: string; tag: string }> = [
  { term: 'Qubit', simple: 'The quantum version of a bit.', deeper: 'Can be |0⟩, |1⟩, or a weighted blend of both at once until you measure it.', tag: 'basics' },
  { term: 'Superposition', simple: 'Being in several states at once.', deeper: 'A qubit α|0⟩ + β|1⟩ carries both possibilities; measurement picks one with probability |α|² or |β|².', tag: 'basics' },
  { term: 'Measurement', simple: 'Looking at a qubit — which forces it to choose.', deeper: 'Measurement returns a single classical bit and collapses the state. You only ever see one answer per run.', tag: 'basics' },
  { term: 'Amplitude', simple: 'A “how much” number for each possible answer.', deeper: 'Complex numbers whose squared size gives the probability. Unlike probabilities they can be negative and cancel.', tag: 'math' },
  { term: 'Phase', simple: 'The direction an amplitude points.', deeper: 'Invisible to a single measurement, but it controls how paths interfere — the secret ingredient of every quantum algorithm.', tag: 'math' },
  { term: 'Interference', simple: 'Amplitudes adding up or cancelling out.', deeper: 'Like waves: same phase reinforces, opposite phase cancels. Algorithms steer interference so wrong answers cancel.', tag: 'core' },
  { term: 'Entanglement', simple: 'Qubits whose results are linked.', deeper: 'An entangled state can’t be split into separate qubit states. Measuring one instantly tells you about the other.', tag: 'core' },
  { term: 'Bell state', simple: 'The simplest entangled pair.', deeper: '(|00⟩ + |11⟩)/√2, made with H then CNOT. Both qubits always agree.', tag: 'core' },
  { term: 'Ket |ψ⟩', simple: 'Notation for a quantum state.', deeper: 'Dirac notation. |0⟩ and |1⟩ are the basis states; |ψ⟩ is a general state.', tag: 'math' },
  { term: 'Bloch sphere', simple: 'A globe that shows one qubit’s state.', deeper: 'North pole |0⟩, south pole |1⟩, equator = equal superpositions. Gates are rotations of the globe.', tag: 'math' },
  { term: 'Quantum gate', simple: 'An operation on qubits.', deeper: 'A reversible (unitary) matrix. H, X, Z act on one qubit; CNOT and CZ act on two.', tag: 'basics' },
  { term: 'Collapse', simple: 'What measurement does to the state.', deeper: 'After measuring, the state becomes the basis state you observed. The superposition is gone.', tag: 'basics' },
  { term: 'Decoherence', simple: 'The environment “measuring” your qubit by accident.', deeper: 'Heat, light and vibration leak information out, destroying superposition. Why quantum computers are kept near absolute zero.', tag: 'hardware' },
  { term: 'Oracle', simple: 'A black box that recognises the answer.', deeper: 'In Grover and Deutsch–Jozsa, the oracle marks answers by flipping their phase.', tag: 'algorithms' },
  { term: 'Grover’s algorithm', simple: 'Quantum search.', deeper: 'Finds one marked item among N in about √N steps instead of N.', tag: 'algorithms' },
  { term: 'Shor’s algorithm', simple: 'Quantum factoring.', deeper: 'Factors large numbers exponentially faster than known classical methods — a threat to RSA encryption.', tag: 'algorithms' },
  { term: 'Deutsch–Jozsa', simple: 'The first “quantum wins” algorithm.', deeper: 'Tells if a function is constant or balanced with ONE question, where a classical computer may need many.', tag: 'algorithms' },
  { term: 'Shot', simple: 'One run of a circuit.', deeper: 'Real hardware is run thousands of times (shots) to estimate the probability distribution.', tag: 'hardware' },
  { term: 'Dilution refrigerator', simple: 'The golden “chandelier” fridge.', deeper: 'Cools superconducting qubits to ~15 millikelvin, colder than outer space.', tag: 'hardware' },
  { term: 'Qiskit', simple: 'IBM’s Python toolkit for quantum programs.', deeper: 'Lets you build circuits and run them on simulators or real IBM quantum hardware. Export from the Sandbox!', tag: 'tools' },
];

export function Glossary() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? TERMS.filter((t) => `${t.term} ${t.simple} ${t.deeper} ${t.tag}`.toLowerCase().includes(q)) : TERMS;
  }, [query]);

  return (
    <Panel title="Quantum dictionary" right={<span className="text-xs" style={{ color: Q.faint }}>{list.length} terms</span>}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search: entanglement, phase, Grover…"
        className="mb-4 w-full rounded-full px-4 py-2 text-sm outline-none"
        style={{ background: 'rgba(5,5,20,.7)', border: `1px solid ${Q.line}`, color: Q.text }}
      />
      <div className="grid gap-2 md:grid-cols-2">
        {list.map((t) => (
          <button
            key={t.term}
            type="button"
            onClick={() => setOpen(open === t.term ? null : t.term)}
            className="rounded-2xl p-3 text-left transition hover:-translate-y-0.5"
            style={{ background: open === t.term ? 'rgba(167,139,250,.16)' : 'rgba(139,92,246,.06)', border: `1px solid ${open === t.term ? Q.violet : Q.line}` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold" style={{ color: Q.text }}>{t.term}</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider" style={{ background: 'rgba(34,211,238,.1)', color: Q.cyan }}>{t.tag}</span>
            </div>
            <p className="mt-1 text-sm" style={{ color: Q.dim }}>{t.simple}</p>
            {open === t.term && <p className="qlab-pop mt-2 text-xs leading-relaxed" style={{ color: Q.faint }}>{t.deeper}</p>}
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function Badges() {
  const { progress } = useProgress();
  const lvl = levelOf(progress.xp);
  const into = progress.xp % 120;
  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Panel title="Your level">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-28 w-28 items-center justify-center rounded-full font-mono text-4xl font-bold"
            style={{ background: `conic-gradient(${Q.cyan} ${(into / 120) * 360}deg, rgba(139,92,246,.15) 0)`, color: Q.text }}>
            <div className="flex h-24 w-24 items-center justify-center rounded-full" style={{ background: Q.panelSolid }}>{lvl + 1}</div>
          </div>
          <div className="text-lg font-semibold" style={{ color: Q.text }}>{LEVELS[lvl]}</div>
          <div className="text-xs" style={{ color: Q.faint }}>{progress.xp} XP · {lvl < LEVELS.length - 1 ? `${120 - into} XP to ${LEVELS[lvl + 1]}` : 'max level!'}</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs" style={{ color: Q.faint }}>
            <div><b className="block text-base" style={{ color: Q.amber }}>{Object.keys(progress.puzzles).length}</b>puzzles</div>
            <div><b className="block text-base" style={{ color: Q.pink }}>{progress.flips}</b>qubits measured</div>
            <div><b className="block text-base" style={{ color: Q.green }}>{progress.bestStreak}</b>best streak</div>
          </div>
        </div>
      </Panel>
      <Panel title={`Badges · ${progress.badges.length}/${BADGES.length}`}>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {BADGES.map((b) => {
            const has = progress.badges.includes(b.id);
            return (
              <div key={b.id} className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: has ? 'rgba(52,211,153,.1)' : 'rgba(139,92,246,.05)', border: `1px solid ${has ? 'rgba(52,211,153,.45)' : Q.line}`, opacity: has ? 1 : 0.6 }}>
                <span className="text-2xl" style={{ filter: has ? 'none' : 'grayscale(1)' }}>{b.icon}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: Q.text }}>{b.name}</div>
                  <div className="text-[11px]" style={{ color: Q.faint }}>{b.how}</div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px]" style={{ color: Q.faint }}>Progress is saved in this browser.</p>
      </Panel>
    </div>
  );
}
