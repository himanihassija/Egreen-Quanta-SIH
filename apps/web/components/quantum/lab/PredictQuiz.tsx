'use client';

import { useState } from 'react';
import { safeSimulate, type Circuit } from '@/lib/quantum/helpers';
import { CircuitView, Panel, ProbBars, Q, QButton } from './theme';
import { useProgress } from './progress';

interface CircuitQ { kind: 'circuit'; circuit: Circuit; options: number[][]; answer: number }
interface TextQ { kind: 'text'; prompt: string; options: string[]; answer: number; why: string }
type Question = CircuitQ | TextQ;

const CONCEPTS: Omit<TextQ, 'kind'>[] = [
  { prompt: 'A qubit in |+⟩ is measured. What do you get?', options: ['Always 0', 'Always 1', '0 or 1, 50/50', 'Both at once'], answer: 2, why: 'Measurement always gives ONE classical answer. |+⟩ gives 0 or 1 with equal odds.' },
  { prompt: 'What does applying H twice do?', options: ['Doubles the superposition', 'Nothing — H·H = I', 'Flips the qubit', 'Entangles it'], answer: 1, why: 'The two paths to |1⟩ cancel out: interference brings you back to where you started.' },
  { prompt: 'Which gate creates entanglement between two qubits?', options: ['H', 'X', 'CNOT', 'Z'], answer: 2, why: 'Single-qubit gates can’t entangle. CNOT (after a superposition) links two qubits.' },
  { prompt: 'Z applied to |0⟩ gives…', options: ['|1⟩', '−|0⟩', '|0⟩', '|+⟩'], answer: 2, why: 'Z only flips the sign of |1⟩. |0⟩ is untouched.' },
  { prompt: 'How many numbers describe the state of 3 qubits?', options: ['3', '6', '8', '9'], answer: 2, why: 'n qubits need 2ⁿ amplitudes. 2³ = 8 — this is why quantum states grow so fast.' },
  { prompt: 'Why can’t entanglement send messages faster than light?', options: ['It’s too slow', 'Each result is random', 'It only works nearby', 'It can, secretly'], answer: 1, why: 'Alice can’t choose her outcome, so she can’t encode a message in it.' },
  { prompt: 'Grover’s algorithm searches N items in about…', options: ['N steps', 'N/2 steps', '√N steps', 'log N steps'], answer: 2, why: 'Grover gives a quadratic speed-up: about (π/4)·√N oracle calls.' },
  { prompt: 'What is |ψ⟩ = α|0⟩ + β|1⟩ required to satisfy?', options: ['α + β = 1', '|α|² + |β|² = 1', 'α = β', 'α·β = 0'], answer: 1, why: 'Probabilities are |amplitude|², and they must add up to 1.' },
];

const SINGLE = ['h', 'x', 'z'] as const;

function randomCircuit(): Circuit {
  const qubits = Math.random() < 0.4 ? 1 : 2;
  const len = 1 + Math.floor(Math.random() * (qubits === 1 ? 3 : 3));
  const gates: Circuit['gates'] = [];
  for (let i = 0; i < len; i += 1) {
    if (qubits === 2 && Math.random() < 0.35) {
      const c = Math.random() < 0.5 ? 0 : 1;
      gates.push({ gate: 'cnot', qubit: c, target: 1 - c });
    } else {
      gates.push({ gate: SINGLE[Math.floor(Math.random() * 3)]!, qubit: Math.floor(Math.random() * qubits) });
    }
  }
  return { qubits, gates };
}

const key = (p: number[]) => p.map((x) => Math.round(x * 100)).join(',');

function makeQuestion(i: number): Question {
  if (i % 3 === 2) {
    const c = CONCEPTS[Math.floor(Math.random() * CONCEPTS.length)]!;
    return { kind: 'text', ...c };
  }
  for (let tries = 0; tries < 50; tries += 1) {
    const circuit = randomCircuit();
    const res = safeSimulate(circuit);
    if (!res) continue;
    const correct = res.probabilities;
    const seen = new Set([key(correct)]);
    const opts = [correct];
    let guard = 0;
    while (opts.length < 4 && guard < 200) {
      guard += 1;
      const other = safeSimulate({ qubits: circuit.qubits, gates: randomCircuit().gates.filter((g) => g.qubit < circuit.qubits && (g.target ?? 0) < circuit.qubits) });
      if (!other) continue;
      const k = key(other.probabilities);
      if (!seen.has(k)) {
        seen.add(k);
        opts.push(other.probabilities);
      }
    }
    if (opts.length < 3) continue;
    const order = opts.map((o, j) => ({ o, j, r: Math.random() })).sort((a, b) => a.r - b.r);
    return { kind: 'circuit', circuit, options: order.map((x) => x.o), answer: order.findIndex((x) => x.j === 0) };
  }
  return { kind: 'text', ...CONCEPTS[0]! };
}

export function PredictQuiz() {
  const [n, setN] = useState(0);
  const [q, setQ] = useState<Question>(() => makeQuestion(0));
  const [picked, setPicked] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const { progress, update, award, unlock } = useProgress();

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === q.answer;
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
    if (ok) {
      const next = streak + 1;
      setStreak(next);
      award(5 + Math.min(next, 5), next > 1 ? `Streak ×${next}` : 'Correct prediction');
      if (next >= 5) unlock('streak');
      if (next > progress.bestStreak) update((p) => ({ ...p, bestStreak: next }));
    } else {
      setStreak(0);
    }
  }

  function next() {
    const i = n + 1;
    setN(i);
    setQ(makeQuestion(i));
    setPicked(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <Panel title={q.kind === 'circuit' ? 'Predict the measurement' : 'Quantum concept check'}>
        {q.kind === 'circuit' ? (
          <>
            <p className="mb-3 text-sm" style={{ color: Q.dim }}>All qubits start at |0⟩. Which chart shows what you’d measure?</p>
            <CircuitView circuit={q.circuit} compact />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {q.options.map((o, i) => {
                const state = picked === null ? 'idle' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'idle';
                return (
                  <button key={i} type="button" onClick={() => pick(i)} className="rounded-2xl p-3 text-left transition hover:-translate-y-0.5"
                    style={{ border: `1.5px solid ${state === 'right' ? Q.green : state === 'wrong' ? Q.red : Q.line}`, background: state === 'right' ? 'rgba(52,211,153,.1)' : state === 'wrong' ? 'rgba(251,113,133,.1)' : 'rgba(139,92,246,.05)' }}>
                    <span className="mb-2 block text-xs font-semibold" style={{ color: Q.faint }}>Option {String.fromCharCode(65 + i)}</span>
                    <ProbBars probs={o} qubits={q.circuit.qubits} />
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-base" style={{ color: Q.text }}>{q.prompt}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, i) => {
                const state = picked === null ? 'idle' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'idle';
                return (
                  <button key={i} type="button" onClick={() => pick(i)} className="rounded-xl px-4 py-3 text-left text-sm transition hover:-translate-y-0.5"
                    style={{ color: Q.text, border: `1.5px solid ${state === 'right' ? Q.green : state === 'wrong' ? Q.red : Q.line}`, background: state === 'right' ? 'rgba(52,211,153,.12)' : state === 'wrong' ? 'rgba(251,113,133,.12)' : 'rgba(139,92,246,.05)' }}>
                    {o}
                  </button>
                );
              })}
            </div>
            {picked !== null && <p className="qlab-pop mt-3 text-sm" style={{ color: Q.dim }}>{q.why}</p>}
          </>
        )}
        {picked !== null && (
          <div className="mt-4 flex items-center gap-3">
            <span className="qlab-pop text-sm font-semibold" style={{ color: picked === q.answer ? Q.green : Q.red }}>
              {picked === q.answer ? '✓ Correct!' : '✗ Not quite — the green one is right.'}
            </span>
            <QButton primary color={Q.cyan} onClick={next}>Next →</QButton>
          </div>
        )}
      </Panel>

      <Panel title="Scoreboard">
        <div className="space-y-3 text-center">
          <div className="rounded-xl p-3" style={{ background: 'rgba(251,191,36,.1)' }}>
            <div className="font-mono text-4xl font-bold" style={{ color: Q.amber }}>⚡{streak}</div>
            <div className="text-xs" style={{ color: Q.faint }}>current streak</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(34,211,238,.08)' }}>
            <div className="font-mono text-2xl font-bold" style={{ color: Q.cyan }}>{score.right}/{score.total}</div>
            <div className="text-xs" style={{ color: Q.faint }}>this session</div>
          </div>
          <div className="text-xs" style={{ color: Q.faint }}>best streak ever: <b style={{ color: Q.text }}>{Math.max(progress.bestStreak, streak)}</b></div>
        </div>
      </Panel>
    </div>
  );
}
