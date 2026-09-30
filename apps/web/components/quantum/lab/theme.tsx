'use client';

import type { Amplitude, Circuit, Gate, GateName } from '@/lib/quantum/helpers';
import { ket } from '@/lib/quantum/helpers';

/** Colour families: Hadamard cyan, Paulis pink, phases violet, rotations indigo, two-qubit emerald. */
export const Q = {
  bg: '#07071a',
  panel: 'rgba(20, 18, 48, 0.72)',
  panelSolid: '#12112e',
  line: 'rgba(139, 92, 246, 0.28)',
  text: '#eef2ff',
  dim: '#c7d2fe',
  faint: '#8b93b8',
  cyan: '#22d3ee',
  violet: '#a78bfa',
  pink: '#f472b6',
  indigo: '#818cf8',
  green: '#34d399',
  amber: '#fbbf24',
  red: '#fb7185',
};

export interface GateInfo {
  gate: GateName;
  label: string;
  name: string;
  color: string;
  twoQubit?: boolean;
  angle?: boolean;
  short: string;
  analogy: string;
  matrix: string[];
  bloch: string;
}

export const GATES: GateInfo[] = [
  { gate: 'h', label: 'H', name: 'Hadamard', color: Q.cyan, short: 'Makes an even superposition: |0⟩ → |+⟩, |1⟩ → |−⟩.', analogy: 'Spinning a coin on the table — it is neither heads nor tails until it lands.', matrix: ['1/√2  1/√2', '1/√2 −1/√2'], bloch: 'Swaps the Z and X axes (180° turn about the X+Z diagonal).' },
  { gate: 'x', label: 'X', name: 'Pauli-X (NOT)', color: Q.pink, short: 'Flips |0⟩ ↔ |1⟩. The quantum NOT gate.', analogy: 'Flipping a light switch.', matrix: ['0 1', '1 0'], bloch: '180° turn about the X axis.' },
  { gate: 'y', label: 'Y', name: 'Pauli-Y', color: Q.pink, short: 'Flips the bit AND adds an imaginary phase.', analogy: 'A flip with a twist.', matrix: ['0 −i', 'i  0'], bloch: '180° turn about the Y axis.' },
  { gate: 'z', label: 'Z', name: 'Pauli-Z', color: Q.pink, short: 'Leaves |0⟩ alone, flips the sign of |1⟩. Changes phase, not probability.', analogy: 'Turning a wave upside down — same height, opposite direction.', matrix: ['1  0', '0 −1'], bloch: '180° turn about the Z axis.' },
  { gate: 's', label: 'S', name: 'Phase (S)', color: Q.violet, short: 'Quarter turn of phase: |1⟩ → i|1⟩.', analogy: 'A clock hand moving 90°.', matrix: ['1 0', '0 i'], bloch: '90° turn about Z.' },
  { gate: 't', label: 'T', name: 'π/8 (T)', color: Q.violet, short: 'Eighth turn of phase: |1⟩ → e^{iπ/4}|1⟩. Key for universal computing.', analogy: 'A clock hand moving 45°.', matrix: ['1 0', '0 e^{iπ/4}'], bloch: '45° turn about Z.' },
  { gate: 'rx', label: 'Rx', name: 'X-rotation', color: Q.indigo, angle: true, short: 'Rotates the qubit by any angle θ about X.', analogy: 'A dimmer switch instead of on/off.', matrix: ['cos θ/2   −i sin θ/2', '−i sin θ/2  cos θ/2'], bloch: 'θ turn about X.' },
  { gate: 'ry', label: 'Ry', name: 'Y-rotation', color: Q.indigo, angle: true, short: 'Rotates about Y — tunes the odds of measuring 1.', analogy: 'Tilting a weighted coin.', matrix: ['cos θ/2  −sin θ/2', 'sin θ/2   cos θ/2'], bloch: 'θ turn about Y.' },
  { gate: 'rz', label: 'Rz', name: 'Z-rotation', color: Q.indigo, angle: true, short: 'Rotates the phase by θ about Z.', analogy: 'Winding a clock by any amount.', matrix: ['e^{−iθ/2}  0', '0  e^{iθ/2}'], bloch: 'θ turn about Z.' },
  { gate: 'cnot', label: '⊕', name: 'CNOT', color: Q.green, twoQubit: true, short: 'Flips the target only when the control is 1. Creates entanglement.', analogy: '"If Alice says yes, Bob flips his answer."', matrix: ['1 0 0 0', '0 1 0 0', '0 0 0 1', '0 0 1 0'], bloch: 'Not a single-qubit rotation — it links two qubits.' },
  { gate: 'cz', label: 'CZ', name: 'Controlled-Z', color: Q.green, twoQubit: true, short: 'Flips the sign only when both qubits are 1.', analogy: 'A secret handshake that only works when both say yes.', matrix: ['1 0 0  0', '0 1 0  0', '0 0 1  0', '0 0 0 −1'], bloch: 'Symmetric — either qubit can be the control.' },
  { gate: 'swap', label: '⇄', name: 'SWAP', color: Q.green, twoQubit: true, short: 'Exchanges the states of two qubits.', analogy: 'Two people swapping seats.', matrix: ['1 0 0 0', '0 0 1 0', '0 1 0 0', '0 0 0 1'], bloch: 'Moves a state from one wire to another.' },
];

export const gateInfo = (g: GateName): GateInfo =>
  GATES.find((x) => x.gate === g) ?? { gate: g, label: g.toUpperCase(), name: g, color: Q.violet, short: '', analogy: '', matrix: [], bloch: '' };

export function GateChip({
  gate,
  size = 36,
  active = false,
  dim = false,
  onClick,
  title,
  label,
}: {
  gate: GateName;
  size?: number;
  active?: boolean;
  dim?: boolean;
  onClick?: () => void;
  title?: string;
  label?: string;
}) {
  const info = gateInfo(gate);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={title ?? `${info.name} — ${info.short}`}
      className="qlab-chip"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        color: '#fff',
        borderColor: info.color,
        background: `linear-gradient(145deg, color-mix(in srgb, ${info.color} 55%, transparent), color-mix(in srgb, ${info.color} 18%, transparent))`,
        boxShadow: active ? `0 0 0 2px ${info.color}, 0 0 16px ${info.color}` : `0 0 10px color-mix(in srgb, ${info.color} 35%, transparent)`,
        opacity: dim ? 0.3 : 1,
      }}
    >
      {label ?? info.label}
    </Tag>
  );
}

/** Wires + gates, laid out on an absolute grid so two-qubit connectors line up. */
export function CircuitView({
  circuit,
  upTo,
  onRemove,
  compact = false,
}: {
  circuit: Circuit;
  upTo?: number;
  onRemove?: (index: number) => void;
  compact?: boolean;
}) {
  const col = compact ? 40 : 50;
  const row = compact ? 40 : 50;
  const labelW = 44;
  const chip = compact ? 28 : 34;
  const width = labelW + Math.max(circuit.gates.length, 3) * col + 36;
  const height = circuit.qubits * row;
  return (
    <div className="qlab-circuit overflow-x-auto">
      <div className="relative" style={{ width, height, minWidth: '100%' }}>
        {Array.from({ length: circuit.qubits }, (_, q) => (
          <div key={q}>
            <span
              className="absolute font-mono text-xs"
              style={{ left: 6, top: q * row + row / 2 - 8, color: Q.faint }}
            >
              q{q}
            </span>
            <div
              className="qlab-wire absolute"
              style={{ left: labelW, right: 8, top: q * row + row / 2 }}
            />
          </div>
        ))}
        {circuit.gates.map((g: Gate, i) => {
          const x = labelW + i * col + col / 2;
          const dim = upTo !== undefined && i >= upTo;
          const info = gateInfo(g.gate);
          const click = onRemove ? () => onRemove(i) : undefined;
          const title = onRemove ? `${info.name} — click to remove` : undefined;
          if (g.target !== undefined) {
            const top = Math.min(g.qubit, g.target) * row + row / 2;
            const bottom = Math.max(g.qubit, g.target) * row + row / 2;
            return (
              <div key={i} style={{ opacity: dim ? 0.3 : 1 }}>
                <div className="absolute" style={{ left: x - 1, top, width: 2, height: bottom - top, background: info.color, boxShadow: `0 0 8px ${info.color}` }} />
                {g.gate === 'cnot' ? (
                  <>
                    <button type="button" onClick={click} title={title} className="qlab-dot absolute" style={{ left: x - 7, top: g.qubit * row + row / 2 - 7, background: info.color, boxShadow: `0 0 10px ${info.color}` }} />
                    <button type="button" onClick={click} title={title} className="qlab-target absolute" style={{ left: x - 13, top: g.target * row + row / 2 - 13, borderColor: info.color, color: info.color, boxShadow: `0 0 10px ${info.color}` }}>+</button>
                  </>
                ) : g.gate === 'cz' ? (
                  <>
                    <button type="button" onClick={click} title={title} className="qlab-dot absolute" style={{ left: x - 7, top: g.qubit * row + row / 2 - 7, background: info.color }} />
                    <button type="button" onClick={click} title={title} className="qlab-dot absolute" style={{ left: x - 7, top: g.target * row + row / 2 - 7, background: info.color }} />
                  </>
                ) : (
                  <>
                    <button type="button" onClick={click} title={title} className="absolute font-bold" style={{ left: x - 8, top: g.qubit * row + row / 2 - 12, color: info.color, fontSize: 18 }}>×</button>
                    <button type="button" onClick={click} title={title} className="absolute font-bold" style={{ left: x - 8, top: g.target * row + row / 2 - 12, color: info.color, fontSize: 18 }}>×</button>
                  </>
                )}
              </div>
            );
          }
          return (
            <div key={i} className="absolute" style={{ left: x - chip / 2, top: g.qubit * row + row / 2 - chip / 2 }}>
              <GateChip gate={g.gate} size={chip} dim={dim} onClick={click} title={title} />
            </div>
          );
        })}
        {circuit.gates.length === 0 && (
          <span className="absolute text-xs" style={{ left: labelW + 12, top: row / 2 - 20, color: Q.faint }}>
            tap a gate to place it
          </span>
        )}
      </div>
    </div>
  );
}

/** Gradient probability bars with ket labels. */
export function ProbBars({
  probs,
  qubits,
  compare,
  highlight,
}: {
  probs: number[];
  qubits: number;
  compare?: number[];
  highlight?: number | null;
}) {
  return (
    <div className="space-y-1.5">
      {probs.map((p, k) => (
        <div key={k} className="flex items-center gap-2">
          <span className="w-14 shrink-0 font-mono text-xs" style={{ color: highlight === k ? Q.green : Q.dim }}>
            {ket(k, qubits)}
          </span>
          <div className="relative h-4 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(139,92,246,0.12)' }}>
            {compare && (
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(compare[k] ?? 0) * 100}%`, border: `1px dashed ${Q.amber}` }} />
            )}
            <div
              className="qlab-bar h-full rounded-full"
              style={{ width: `${p * 100}%`, background: highlight === k ? Q.green : `linear-gradient(90deg, ${Q.cyan}, ${Q.violet}, ${Q.pink})` }}
            />
          </div>
          <span className="w-11 shrink-0 text-right font-mono text-xs" style={{ color: Q.dim }}>
            {Math.round(p * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

/** One little clock per basis state: arrow length = amplitude, angle = phase. */
export function PhaseWheels({ amps, qubits }: { amps: Amplitude[]; qubits: number }) {
  return (
    <div className="flex flex-wrap gap-3">
      {amps.map((a, k) => {
        const m = Math.hypot(a.re, a.im);
        const ang = Math.atan2(a.im, a.re);
        const hue = ((ang * 180) / Math.PI + 360) % 360;
        const col = m < 1e-6 ? Q.faint : `hsl(${(190 + hue) % 360} 90% 65%)`;
        return (
          <div key={k} className="flex flex-col items-center gap-1" title={`amplitude ${m.toFixed(2)}, phase ${Math.round((ang * 180) / Math.PI)}°`}>
            <svg width="46" height="46" viewBox="-23 -23 46 46">
              <circle r="20" fill="rgba(139,92,246,0.08)" stroke={Q.line} />
              <circle r={20 * m} fill={`color-mix(in srgb, ${col} 25%, transparent)`} />
              {m > 1e-6 && (
                <line x1="0" y1="0" x2={20 * m * Math.cos(ang)} y2={-20 * m * Math.sin(ang)} stroke={col} strokeWidth="2.5" strokeLinecap="round" />
              )}
            </svg>
            <span className="font-mono text-[11px]" style={{ color: Q.dim }}>{ket(k, qubits)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Panel({ title, children, right }: { title?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="qlab-panel">
      {(title || right) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-sm font-semibold tracking-wide" style={{ color: Q.text }}>{title}</h3>}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function QButton({
  children,
  onClick,
  primary = false,
  disabled = false,
  color = Q.violet,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  color?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="qlab-btn"
      style={
        primary
          ? { background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, ${Q.pink}))`, borderColor: 'transparent', color: '#0b0620' }
          : { borderColor: `color-mix(in srgb, ${color} 55%, transparent)`, color: Q.text }
      }
    >
      {children}
    </button>
  );
}

/** Global lab styles. Rendered once by the lab shell. */
export const LAB_CSS = `
  .qlab-chip { display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid; border-radius: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; transition: transform .12s ease, box-shadow .12s ease, opacity .2s ease; }
  button.qlab-chip:hover { transform: translateY(-2px) scale(1.06); }
  button.qlab-chip:active { transform: scale(.92); }
  .qlab-wire { height: 2px; background: linear-gradient(90deg, rgba(34,211,238,.55), rgba(167,139,250,.55), rgba(244,114,182,.4)); border-radius: 2px; }
  .qlab-circuit { border: 1px solid ${Q.line}; border-radius: 14px; background: radial-gradient(120% 140% at 0% 0%, rgba(34,211,238,.07), transparent 55%), rgba(10,9,30,.75); padding: 6px 4px; }
  .qlab-dot { width: 14px; height: 14px; border-radius: 9999px; }
  .qlab-target { width: 26px; height: 26px; border-radius: 9999px; border: 2px solid; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; line-height: 1; background: #0b0a24; }
  .qlab-bar { transition: width .35s cubic-bezier(.3,.7,.2,1); }
  .qlab-panel { border: 1px solid ${Q.line}; border-radius: 18px; background: ${Q.panel}; padding: 16px; }
  .qlab-btn { display: inline-flex; align-items: center; gap: .35rem; border: 1px solid; border-radius: 9999px; padding: .4rem .9rem; font-size: .8rem; font-weight: 600; transition: transform .12s ease, filter .12s ease, background .12s ease; background: rgba(139,92,246,.08); }
  .qlab-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.12); background-color: rgba(139,92,246,.16); }
  .qlab-btn:active:not(:disabled) { transform: scale(.96); }
  .qlab-btn:disabled { opacity: .4; cursor: not-allowed; }
  .qlab-pop { animation: qlab-pop .35s cubic-bezier(.3,1.6,.5,1); }
  @keyframes qlab-pop { from { transform: scale(.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .qlab-confetti { position: absolute; left: 50%; top: 40%; width: 8px; height: 8px; border-radius: 2px; pointer-events: none; animation: qlab-burst .9s ease-out forwards; }
  @keyframes qlab-burst { to { transform: translate(var(--dx), var(--dy)) rotate(260deg); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .qlab-pop, .qlab-confetti { animation: none; } .qlab-bar { transition: none; } }
`;

const CONFETTI_COLORS = [Q.cyan, Q.violet, Q.pink, Q.green, Q.amber];

/** A one-shot burst of 18 CSS particles. Mount it with a changing key. */
export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const d = 90 + (i % 3) * 40;
        return (
          <span
            key={i}
            className="qlab-confetti"
            style={{
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              ['--dx' as string]: `${Math.cos(a) * d}px`,
              ['--dy' as string]: `${Math.sin(a) * d}px`,
            }}
          />
        );
      })}
    </div>
  );
}
