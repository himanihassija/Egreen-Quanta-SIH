'use client';

import { useEffect, useMemo, useState } from 'react';
import { ketString, safeSimulate, sameState, type Circuit, type GateName } from '@/lib/quantum/helpers';
import { simulate } from '@/lib/quantum/simulator';
import { CircuitView, Confetti, GateChip, Panel, ProbBars, Q, QButton, gateInfo } from './theme';
import { useProgress } from './progress';

interface Puzzle {
  id: string;
  title: string;
  story: string;
  qubits: number;
  allowed: GateName[];
  par: number;
  answer: Circuit['gates'];
  hint: string;
}

const PUZZLES: Puzzle[] = [
  { id: 'flip', title: 'Flip the switch', story: 'Turn |0⟩ into |1⟩.', qubits: 1, allowed: ['x', 'h', 'z'], par: 1, answer: [{ gate: 'x', qubit: 0 }], hint: 'Which gate is the quantum NOT?' },
  { id: 'coin', title: 'Spin the coin', story: 'Make a perfect 50/50 superposition |+⟩.', qubits: 1, allowed: ['x', 'h', 'z'], par: 1, answer: [{ gate: 'h', qubit: 0 }], hint: 'One gate creates superposition.' },
  { id: 'minus', title: 'The hidden minus', story: 'Build |−⟩ — same 50/50 odds, opposite phase.', qubits: 1, allowed: ['x', 'h', 'z'], par: 2, answer: [{ gate: 'h', qubit: 0 }, { gate: 'z', qubit: 0 }], hint: 'Superpose first, then flip the phase of |1⟩.' },
  { id: 'nox', title: 'NOT without X', story: 'Make |1⟩ — but X is broken today.', qubits: 1, allowed: ['h', 'z'], par: 3, answer: [{ gate: 'h', qubit: 0 }, { gate: 'z', qubit: 0 }, { gate: 'h', qubit: 0 }], hint: 'H · Z · H behaves like another famous gate…' },
  { id: 'two-coins', title: 'Two coins at once', story: 'Put 2 qubits in equal superposition of all 4 answers.', qubits: 2, allowed: ['h', 'x', 'cnot'], par: 2, answer: [{ gate: 'h', qubit: 0 }, { gate: 'h', qubit: 1 }], hint: 'Each qubit needs its own Hadamard.' },
  { id: 'bell', title: 'Spooky twins', story: 'Entangle two qubits: (|00⟩ + |11⟩)/√2.', qubits: 2, allowed: ['h', 'x', 'cnot'], par: 2, answer: [{ gate: 'h', qubit: 0 }, { gate: 'cnot', qubit: 0, target: 1 }], hint: 'Superposition on q0, then let q0 control q1.' },
  { id: 'anti', title: 'Opposites attract', story: 'Always-different twins: (|01⟩ + |10⟩)/√2.', qubits: 2, allowed: ['h', 'x', 'cnot'], par: 3, answer: [{ gate: 'h', qubit: 0 }, { gate: 'cnot', qubit: 0, target: 1 }, { gate: 'x', qubit: 1 }], hint: 'Make a Bell pair, then flip one side.' },
  { id: 'move', title: 'Teleport a 1', story: 'Make |01⟩ — without using X on q1.', qubits: 2, allowed: ['x', 'cnot'], par: 3, answer: [{ gate: 'x', qubit: 0 }, { gate: 'cnot', qubit: 0, target: 1 }, { gate: 'cnot', qubit: 1, target: 0 }], hint: 'X on q0, then two CNOTs pointing opposite ways.' },
  { id: 'phase-bell', title: 'Phase detective', story: 'Build (|00⟩ − |11⟩)/√2.', qubits: 2, allowed: ['h', 'x', 'z', 'cnot'], par: 3, answer: [{ gate: 'h', qubit: 0 }, { gate: 'z', qubit: 0 }, { gate: 'cnot', qubit: 0, target: 1 }], hint: 'Put a minus sign into q0’s superposition before entangling.' },
  { id: 'ghz', title: 'Three-way link', story: 'Entangle 3 qubits: (|000⟩ + |111⟩)/√2 (GHZ).', qubits: 3, allowed: ['h', 'x', 'cnot'], par: 3, answer: [{ gate: 'h', qubit: 0 }, { gate: 'cnot', qubit: 0, target: 1 }, { gate: 'cnot', qubit: 1, target: 2 }], hint: 'A Bell pair, then pass the link along.' },
];

const starsFor = (used: number, par: number) => (used <= par ? 3 : used <= par + 2 ? 2 : 1);

export function Puzzles() {
  const [idx, setIdx] = useState(0);
  const puzzle = PUZZLES[idx]!;
  const [gates, setGates] = useState<Circuit['gates']>([]);
  const [wire, setWire] = useState(0);
  const [target, setTarget] = useState(1);
  const [solved, setSolved] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const { progress, update, award, unlock } = useProgress();

  const goal = useMemo(() => simulate({ qubits: puzzle.qubits, gates: puzzle.answer }), [puzzle]);
  const mine = useMemo(() => safeSimulate({ qubits: puzzle.qubits, gates }), [puzzle.qubits, gates]);

  useEffect(() => {
    setGates([]);
    setWire(0);
    setTarget(1);
    setSolved(null);
    setShowHint(false);
  }, [idx]);

  useEffect(() => {
    if (solved !== null || !mine || gates.length === 0) return;
    if (!sameState(mine.amplitudes, goal.amplitudes)) return;
    const stars = starsFor(gates.length, puzzle.par);
    setSolved(stars);
    award(10 * stars, `${puzzle.title} solved`);
    update((p) => {
      const puzzles = { ...p.puzzles, [puzzle.id]: Math.max(stars, p.puzzles[puzzle.id] ?? 0) };
      const count = Object.keys(puzzles).length;
      if (count >= 5) window.setTimeout(() => unlock('puzzler'), 0);
      if (count === PUZZLES.length && Object.values(puzzles).every((s) => s === 3)) window.setTimeout(() => unlock('grandmaster'), 0);
      return { ...p, puzzles };
    });
  }, [mine, goal, gates.length, solved, puzzle, award, update, unlock]);

  function place(g: GateName) {
    if (solved !== null) return;
    const two = Boolean(gateInfo(g).twoQubit);
    if (two && (puzzle.qubits < 2 || wire === target)) return;
    setGates((gs) => [...gs, two ? { gate: g, qubit: wire, target } : { gate: g, qubit: wire }]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <Panel title="Levels">
        <ol className="flex flex-row flex-wrap gap-2 lg:flex-col">
          {PUZZLES.map((p, i) => {
            const stars = progress.puzzles[p.id] ?? 0;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setIdx(i)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition"
                  style={{ background: i === idx ? 'rgba(167,139,250,.22)' : 'rgba(139,92,246,.06)', color: Q.text, border: `1px solid ${i === idx ? Q.violet : 'transparent'}` }}
                >
                  <span>{i + 1}. {p.title}</span>
                  <span style={{ color: Q.amber, letterSpacing: 1 }}>{'★'.repeat(stars)}<span style={{ color: Q.faint }}>{'★'.repeat(3 - stars)}</span></span>
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>

      <div className="relative flex flex-col gap-4">
        {solved !== null && <Confetti key={`${puzzle.id}-${solved}`} />}
        <Panel title={`Level ${idx + 1}: ${puzzle.title}`} right={<span className="text-xs" style={{ color: Q.faint }}>par {puzzle.par} gate{puzzle.par > 1 ? 's' : ''}</span>}>
          <p className="mb-1 text-base" style={{ color: Q.text }}>{puzzle.story}</p>
          <p className="mb-4 font-mono text-sm" style={{ color: Q.amber }}>target: {ketString(goal.amplitudes, puzzle.qubits)}</p>

          {puzzle.qubits > 1 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: Q.faint }}>
              on wire
              {Array.from({ length: puzzle.qubits }, (_, q) => (
                <button key={q} type="button" onClick={() => setWire(q)} className="rounded-full px-2.5 py-1 font-mono" style={{ background: wire === q ? Q.violet : 'rgba(139,92,246,.12)', color: wire === q ? '#07071a' : Q.dim }}>q{q}</button>
              ))}
              {puzzle.allowed.includes('cnot') && (
                <>
                  <span className="ml-2">CNOT target</span>
                  {Array.from({ length: puzzle.qubits }, (_, q) => (
                    <button key={q} type="button" disabled={q === wire} onClick={() => setTarget(q)} className="rounded-full px-2.5 py-1 font-mono disabled:opacity-30" style={{ background: target === q && q !== wire ? Q.green : 'rgba(52,211,153,.1)', color: target === q && q !== wire ? '#07071a' : Q.dim }}>q{q}</button>
                  ))}
                </>
              )}
            </div>
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            {puzzle.allowed.map((g) => (
              <GateChip key={g} gate={g} size={44} onClick={() => place(g)} />
            ))}
          </div>

          <CircuitView circuit={{ qubits: puzzle.qubits, gates }} onRemove={solved === null ? (i) => setGates((gs) => gs.filter((_, j) => j !== i)) : undefined} />

          <div className="mt-3 flex flex-wrap gap-2">
            <QButton onClick={() => setGates((g) => g.slice(0, -1))} disabled={gates.length === 0 || solved !== null}>↶ Undo</QButton>
            <QButton onClick={() => { setGates([]); setSolved(null); }}>Restart</QButton>
            <QButton color={Q.amber} onClick={() => setShowHint(true)}>💡 Hint</QButton>
            {solved !== null && idx < PUZZLES.length - 1 && (
              <QButton primary color={Q.green} onClick={() => setIdx(idx + 1)}>Next level →</QButton>
            )}
          </div>
          {showHint && <p className="mt-3 text-sm" style={{ color: Q.amber }}>💡 {puzzle.hint}</p>}
        </Panel>

        <Panel title={solved !== null ? `Solved! ${'★'.repeat(solved)}` : 'Your state vs the target'}>
          {solved !== null ? (
            <p className="qlab-pop mb-3 text-sm" style={{ color: Q.green }}>
              {solved === 3 ? 'Perfect — you matched par!' : `Solved in ${gates.length} gates. Can you do it in ${puzzle.par}?`}
            </p>
          ) : null}
          {mine && <ProbBars probs={mine.probabilities} qubits={puzzle.qubits} compare={goal.probabilities} />}
          <p className="mt-2 text-xs" style={{ color: Q.faint }}>
            Dashed outline = target. Careful: matching bars isn’t enough when the phase differs (look at level 3).
          </p>
        </Panel>
      </div>
    </div>
  );
}
