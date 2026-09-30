'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ketString, safeSimulate, sampleCounts, toQiskit, type Circuit, type GateName } from '@/lib/quantum/helpers';
import { CircuitView, GATES, GateChip, Panel, PhaseWheels, ProbBars, Q, QButton } from './theme';
import { useProgress } from './progress';

const PRESETS: Array<{ name: string; circuit: Circuit }> = [
  { name: 'Superposition', circuit: { qubits: 1, gates: [{ gate: 'h', qubit: 0 }] } },
  { name: 'Bell pair', circuit: { qubits: 2, gates: [{ gate: 'h', qubit: 0 }, { gate: 'cnot', qubit: 0, target: 1 }] } },
  { name: 'GHZ (3 qubits)', circuit: { qubits: 3, gates: [{ gate: 'h', qubit: 0 }, { gate: 'cnot', qubit: 0, target: 1 }, { gate: 'cnot', qubit: 1, target: 2 }] } },
  { name: 'Interference (H·H)', circuit: { qubits: 1, gates: [{ gate: 'h', qubit: 0 }, { gate: 'h', qubit: 0 }] } },
  { name: 'Phase kick', circuit: { qubits: 1, gates: [{ gate: 'h', qubit: 0 }, { gate: 'z', qubit: 0 }, { gate: 'h', qubit: 0 }] } },
];

const ANGLES = [
  { label: 'π/4', v: Math.PI / 4 },
  { label: 'π/2', v: Math.PI / 2 },
  { label: 'π', v: Math.PI },
  { label: '3π/2', v: (3 * Math.PI) / 2 },
];

export function Sandbox({ seed }: { seed?: Circuit | null }) {
  const [circuit, setCircuit] = useState<Circuit>(seed ?? { qubits: 2, gates: [] });
  const [wire, setWire] = useState(0);
  const [target, setTarget] = useState(1);
  const [angle, setAngle] = useState(Math.PI / 2);
  const [scrub, setScrub] = useState<number | null>(null);
  const [view, setView] = useState<'bars' | 'wheels'>('bars');
  const [counts, setCounts] = useState<number[] | null>(null);
  const [copied, setCopied] = useState(false);
  const shotTimer = useRef<number | undefined>(undefined);
  const { unlock, award } = useProgress();

  useEffect(() => {
    if (seed) setCircuit(seed);
  }, [seed]);

  useEffect(() => () => window.clearInterval(shotTimer.current), []);

  const upTo = scrub ?? circuit.gates.length;
  const result = useMemo(
    () => safeSimulate({ qubits: circuit.qubits, gates: circuit.gates.slice(0, upTo) }),
    [circuit, upTo],
  );

  useEffect(() => {
    if (!result || circuit.gates.length === 0) return;
    unlock('first-circuit');
    if (result.probabilities.filter((p) => p > 1e-6).length > 1) unlock('superposer');
    if (result.entangled) unlock('entangler');
  }, [result, circuit.gates.length, unlock]);

  function place(gate: GateName, two: boolean, withAngle: boolean) {
    setCounts(null);
    setScrub(null);
    setCircuit((c) => {
      if (two && (c.qubits < 2 || target === wire)) return c;
      if (c.gates.length >= 16) return c;
      const g = two ? { gate, qubit: wire, target } : withAngle ? { gate, qubit: wire, angle } : { gate, qubit: wire };
      return { ...c, gates: [...c.gates, g] };
    });
  }

  function setQubits(n: number) {
    setCounts(null);
    setScrub(null);
    setCircuit((c) => ({
      qubits: n,
      gates: c.gates.filter((g) => g.qubit < n && (g.target === undefined || g.target < n)),
    }));
    if (wire >= n) setWire(0);
    if (target >= n || target === wire) setTarget(n > 1 ? (wire + 1) % n : 0);
  }

  function runShots(total: number) {
    if (!result) return;
    window.clearInterval(shotTimer.current);
    const batches = 12;
    let done = 0;
    let acc = new Array(result.probabilities.length).fill(0) as number[];
    setCounts(acc);
    shotTimer.current = window.setInterval(() => {
      const size = Math.floor(total / batches) + (done < total % batches ? 1 : 0);
      const add = sampleCounts(result.probabilities, size);
      acc = acc.map((v, i) => v + (add[i] ?? 0));
      setCounts(acc);
      done += 1;
      if (done >= batches) window.clearInterval(shotTimer.current);
    }, 60);
  }

  async function copyQiskit() {
    try {
      await navigator.clipboard.writeText(toQiskit(circuit));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      unlock('coder');
    } catch {
      // clipboard blocked; the code is visible anyway
    }
  }

  const totalShots = counts?.reduce((a, b) => a + b, 0) ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      <div className="flex flex-col gap-4">
        <Panel
          title="Build a circuit"
          right={
            <div className="flex items-center gap-1 text-xs" style={{ color: Q.faint }}>
              qubits
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQubits(n)}
                  className="h-7 w-7 rounded-full font-mono"
                  style={{ background: circuit.qubits === n ? Q.cyan : 'rgba(139,92,246,.12)', color: circuit.qubits === n ? '#07071a' : Q.dim }}
                >
                  {n}
                </button>
              ))}
            </div>
          }
        >
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: Q.faint }}>
            <span>on wire</span>
            {Array.from({ length: circuit.qubits }, (_, q) => (
              <button key={q} type="button" onClick={() => setWire(q)} className="rounded-full px-2.5 py-1 font-mono"
                style={{ background: wire === q ? Q.violet : 'rgba(139,92,246,.12)', color: wire === q ? '#07071a' : Q.dim }}>
                q{q}
              </button>
            ))}
            {circuit.qubits > 1 && (
              <>
                <span className="ml-2">target</span>
                {Array.from({ length: circuit.qubits }, (_, q) => (
                  <button key={q} type="button" disabled={q === wire} onClick={() => setTarget(q)} className="rounded-full px-2.5 py-1 font-mono disabled:opacity-30"
                    style={{ background: target === q && q !== wire ? Q.green : 'rgba(52,211,153,.1)', color: target === q && q !== wire ? '#07071a' : Q.dim }}>
                    q{q}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="mb-2 flex flex-wrap gap-2">
            {GATES.map((g) => (
              <GateChip
                key={g.gate}
                gate={g.gate}
                size={40}
                onClick={() => place(g.gate, Boolean(g.twoQubit), Boolean(g.angle))}
                title={`${g.name} — ${g.short}`}
              />
            ))}
          </div>
          <div className="mb-3 flex items-center gap-2 text-xs" style={{ color: Q.faint }}>
            rotation angle θ
            {ANGLES.map((a) => (
              <button key={a.label} type="button" onClick={() => setAngle(a.v)} className="rounded-full px-2 py-0.5 font-mono"
                style={{ background: angle === a.v ? Q.indigo : 'rgba(129,140,248,.12)', color: angle === a.v ? '#07071a' : Q.dim }}>
                {a.label}
              </button>
            ))}
          </div>

          <CircuitView circuit={circuit} upTo={scrub ?? undefined} onRemove={(i) => { setScrub(null); setCounts(null); setCircuit((c) => ({ ...c, gates: c.gates.filter((_, j) => j !== i) })); }} />

          {circuit.gates.length > 0 && (
            <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: Q.faint }}>
              <span className="shrink-0">⏱ time travel</span>
              <input type="range" min={0} max={circuit.gates.length} value={upTo} onChange={(e) => setScrub(Number(e.target.value))} className="flex-1 accent-[#22d3ee]" />
              <span className="w-24 shrink-0 font-mono" style={{ color: Q.dim }}>after {upTo}/{circuit.gates.length}</span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <QButton onClick={() => { setScrub(null); setCircuit((c) => ({ ...c, gates: c.gates.slice(0, -1) })); }} disabled={circuit.gates.length === 0}>↶ Undo</QButton>
            <QButton onClick={() => { setScrub(null); setCounts(null); setCircuit((c) => ({ ...c, gates: [] })); }} disabled={circuit.gates.length === 0}>Clear</QButton>
            <span className="mx-1 w-px self-stretch" style={{ background: Q.line }} />
            {PRESETS.map((p) => (
              <QButton key={p.name} color={Q.cyan} onClick={() => { setScrub(null); setCounts(null); setWire(0); setTarget(1); setCircuit(p.circuit); }}>
                {p.name}
              </QButton>
            ))}
          </div>
        </Panel>

        <Panel
          title="Export to real quantum code"
          right={<QButton primary color={Q.green} onClick={() => void copyQiskit()} disabled={circuit.gates.length === 0}>{copied ? '✓ Copied' : 'Copy Qiskit'}</QButton>}
        >
          <pre className="max-h-44 overflow-auto rounded-xl p-3 font-mono text-[11px] leading-relaxed" style={{ background: 'rgba(5,5,20,.8)', color: Q.dim, border: `1px solid ${Q.line}` }}>
            {toQiskit(circuit)}
          </pre>
          <p className="mt-2 text-xs" style={{ color: Q.faint }}>Paste this into IBM Quantum or a Jupyter notebook to run it on a real quantum computer.</p>
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        <Panel
          title="Quantum state"
          right={
            <div className="flex gap-1 text-xs">
              {(['bars', 'wheels'] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)} className="rounded-full px-2.5 py-1"
                  style={{ background: view === v ? Q.violet : 'rgba(139,92,246,.12)', color: view === v ? '#07071a' : Q.dim }}>
                  {v === 'bars' ? 'Probabilities' : 'Phase wheels'}
                </button>
              ))}
            </div>
          }
        >
          {result ? (
            <>
              <p className="mb-3 break-words rounded-xl px-3 py-2 font-mono text-sm" style={{ background: 'rgba(34,211,238,.08)', color: Q.cyan }}>
                |ψ⟩ = {ketString(result.amplitudes, circuit.qubits)}
              </p>
              {view === 'bars' ? (
                <ProbBars probs={result.probabilities} qubits={circuit.qubits} />
              ) : (
                <>
                  <PhaseWheels amps={result.amplitudes} qubits={circuit.qubits} />
                  <p className="mt-2 text-xs" style={{ color: Q.faint }}>Arrow length = amplitude, direction = phase. Opposite arrows cancel — that is interference.</p>
                </>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: result.entangled ? 'rgba(52,211,153,.15)' : 'rgba(139,92,246,.12)', color: result.entangled ? Q.green : Q.faint }}>
                  {result.entangled ? '🔗 entangled' : 'not entangled'}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm" style={{ color: Q.faint }}>That circuit can’t be simulated.</p>
          )}
        </Panel>

        <Panel
          title="Measure it (shots)"
          right={
            <div className="flex gap-2">
              <QButton color={Q.pink} onClick={() => { runShots(100); award(2, 'Ran 100 shots'); }} disabled={!result}>100</QButton>
              <QButton color={Q.pink} onClick={() => { runShots(1000); award(3, 'Ran 1000 shots'); }} disabled={!result}>1000</QButton>
            </div>
          }
        >
          {counts && result ? (
            <>
              <ProbBars probs={counts.map((c) => (totalShots ? c / totalShots : 0))} qubits={circuit.qubits} compare={result.probabilities} />
              <p className="mt-2 text-xs" style={{ color: Q.faint }}>
                {totalShots} measurements. Dashed outline = exact probability. Each shot collapses the state to one answer.
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: Q.faint }}>A real quantum computer only gives one answer per run. Fire some shots to see the statistics appear.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
