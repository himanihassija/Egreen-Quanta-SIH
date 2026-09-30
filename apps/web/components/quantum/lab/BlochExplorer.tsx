'use client';

import { useEffect, useRef, useState } from 'react';
import { blochOf, type Amplitude } from '@/lib/quantum/helpers';
import { GateChip, Panel, Q, QButton } from './theme';
import { useProgress } from './progress';

type C = Amplitude;
const c = (re: number, im = 0): C => ({ re, im });
const mul = (a: C, b: C): C => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const add = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im });
const S2 = Math.SQRT1_2;

const MATS: Record<string, [C, C, C, C]> = {
  x: [c(0), c(1), c(1), c(0)],
  y: [c(0), c(0, -1), c(0, 1), c(0)],
  z: [c(1), c(0), c(0), c(-1)],
  h: [c(S2), c(S2), c(S2), c(-S2)],
  s: [c(1), c(0), c(0), c(0, 1)],
  t: [c(1), c(0), c(0), c(S2, S2)],
};

const POLES = [
  { id: '0', label: '|0⟩', v: [0, 0, 1] },
  { id: '1', label: '|1⟩', v: [0, 0, -1] },
  { id: '+', label: '|+⟩', v: [1, 0, 0] },
  { id: '-', label: '|−⟩', v: [-1, 0, 0] },
  { id: '+i', label: '|+i⟩', v: [0, 1, 0] },
  { id: '-i', label: '|−i⟩', v: [0, -1, 0] },
];

// Camera: a little above the equator, turned so X comes toward the viewer-left.
const AZ = (-35 * Math.PI) / 180;
const EL = (18 * Math.PI) / 180;
const R = 120;
function proj(x: number, y: number, z: number) {
  const px = x * Math.cos(AZ) - y * Math.sin(AZ);
  const py = x * Math.sin(AZ) + y * Math.cos(AZ);
  return { sx: py * R, sy: -(z * Math.cos(EL) - px * Math.sin(EL)) * R, depth: px };
}

function ellipsePath(fn: (t: number) => [number, number, number]) {
  let d = '';
  for (let i = 0; i <= 64; i += 1) {
    const [x, y, z] = fn((i / 64) * Math.PI * 2);
    const p = proj(x, y, z);
    d += `${i === 0 ? 'M' : 'L'}${p.sx.toFixed(1)} ${p.sy.toFixed(1)} `;
  }
  return d;
}
const EQUATOR = ellipsePath((t) => [Math.cos(t), Math.sin(t), 0]);
const MERIDIAN_XZ = ellipsePath((t) => [Math.cos(t), 0, Math.sin(t)]);
const MERIDIAN_YZ = ellipsePath((t) => [0, Math.cos(t), Math.sin(t)]);

export function BlochExplorer() {
  const [state, setState] = useState<[C, C]>([c(1), c(0)]);
  const [shown, setShown] = useState({ x: 0, y: 0, z: 1 });
  const [history, setHistory] = useState<string[]>([]);
  const raf = useRef(0);
  const { update, unlock } = useProgress();

  const target = blochOf(state[0], state[1]);

  // Tween the arrow for 350 ms whenever the state changes; idle otherwise.
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const from = shown;
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 350);
      const e = 1 - Math.pow(1 - k, 3);
      const v = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, z: from.z + (target.z - from.z) * e };
      const n = Math.hypot(v.x, v.y, v.z) || 1;
      setShown({ x: v.x / n, y: v.y / n, z: v.z / n });
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.x, target.y, target.z]);

  useEffect(() => {
    const hit = POLES.find((p) => Math.hypot(p.v[0]! - target.x, p.v[1]! - target.y, p.v[2]! - target.z) < 1e-3);
    if (!hit) return;
    update((p) => {
      if (p.blochVisited.includes(hit.id)) return p;
      const visited = [...p.blochVisited, hit.id];
      if (visited.length === 6) window.setTimeout(() => unlock('bloch-tourist'), 0);
      return { ...p, blochVisited: visited };
    });
  }, [target.x, target.y, target.z, update, unlock]);

  function apply(g: keyof typeof MATS) {
    const m = MATS[g]!;
    const [a, b] = state;
    setState([add(mul(m[0], a), mul(m[1], b)), add(mul(m[2], a), mul(m[3], b))]);
    setHistory((h) => [...h.slice(-11), g.toUpperCase()]);
  }

  function setAngles(theta: number, phi: number) {
    setState([c(Math.cos(theta / 2)), c(Math.sin(theta / 2) * Math.cos(phi), Math.sin(theta / 2) * Math.sin(phi))]);
  }

  const theta = Math.acos(Math.max(-1, Math.min(1, target.z)));
  const phi = (Math.atan2(target.y, target.x) + 2 * Math.PI) % (2 * Math.PI);
  const tip = proj(shown.x, shown.y, shown.z);
  const p0 = Math.cos(theta / 2) ** 2;
  const fmt = (z: C) => `${z.re.toFixed(2)}${z.im >= 0 ? '+' : '−'}${Math.abs(z.im).toFixed(2)}i`;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Panel title="The Bloch sphere">
        <svg viewBox="-160 -160 320 320" className="mx-auto block w-full max-w-[380px]">
          <defs>
            <radialGradient id="qlabSphere" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="rgba(167,139,250,0.35)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.04)" />
            </radialGradient>
          </defs>
          <circle r={R} fill="url(#qlabSphere)" stroke="rgba(167,139,250,.55)" />
          <path d={EQUATOR} fill="none" stroke="rgba(34,211,238,.45)" strokeDasharray="4 4" />
          <path d={MERIDIAN_XZ} fill="none" stroke="rgba(167,139,250,.25)" />
          <path d={MERIDIAN_YZ} fill="none" stroke="rgba(167,139,250,.25)" />
          {POLES.map((p) => {
            const q = proj(p.v[0]!, p.v[1]!, p.v[2]!);
            return (
              <g key={p.id}>
                <circle cx={q.sx} cy={q.sy} r="3" fill={Q.dim} opacity={0.6} />
                <text x={q.sx * 1.14} y={q.sy * 1.14 + 4} textAnchor="middle" fontSize="12" fill={Q.dim} fontFamily="ui-monospace, monospace">{p.label}</text>
              </g>
            );
          })}
          <line x1="0" y1="0" x2={tip.sx} y2={tip.sy} stroke={Q.pink} strokeWidth="4" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${Q.pink})` }} />
          <circle cx={tip.sx} cy={tip.sy} r="8" fill={Q.pink} style={{ filter: `drop-shadow(0 0 8px ${Q.pink})` }} />
          <circle r="3.5" fill={Q.text} />
        </svg>
        <p className="mt-2 text-center font-mono text-sm" style={{ color: Q.cyan }}>
          |ψ⟩ = ({fmt(state[0])})|0⟩ + ({fmt(state[1])})|1⟩
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="w-12 font-mono text-xs" style={{ color: Q.dim }}>P(0)</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(139,92,246,.12)' }}>
            <div className="qlab-bar h-full rounded-full" style={{ width: `${p0 * 100}%`, background: `linear-gradient(90deg, ${Q.cyan}, ${Q.violet})` }} />
          </div>
          <span className="w-10 text-right font-mono text-xs" style={{ color: Q.dim }}>{Math.round(p0 * 100)}%</span>
        </div>
      </Panel>

      <div className="flex flex-col gap-4">
        <Panel title="Apply a gate — watch the arrow rotate">
          <div className="flex flex-wrap gap-2">
            {(['h', 'x', 'y', 'z', 's', 't'] as const).map((g) => (
              <GateChip key={g} gate={g} size={46} onClick={() => apply(g)} />
            ))}
          </div>
          <p className="mt-3 min-h-[1.25rem] font-mono text-xs" style={{ color: Q.faint }}>
            {history.length ? `|0⟩ → ${history.join(' → ')}` : 'Start at |0⟩ (north pole). Tap H to reach the equator.'}
          </p>
        </Panel>

        <Panel title="Steer it by hand">
          <label className="mb-1 block text-xs" style={{ color: Q.faint }}>θ (tilt from |0⟩ toward |1⟩): {Math.round((theta * 180) / Math.PI)}°</label>
          <input type="range" min={0} max={180} value={Math.round((theta * 180) / Math.PI)} onChange={(e) => setAngles((Number(e.target.value) * Math.PI) / 180, phi)} className="mb-3 w-full accent-[#f472b6]" />
          <label className="mb-1 block text-xs" style={{ color: Q.faint }}>φ (phase, around the equator): {Math.round((phi * 180) / Math.PI)}°</label>
          <input type="range" min={0} max={359} value={Math.round((phi * 180) / Math.PI)} onChange={(e) => setAngles(theta, (Number(e.target.value) * Math.PI) / 180)} className="w-full accent-[#22d3ee]" />
        </Panel>

        <Panel title="Jump to a famous state">
          <div className="flex flex-wrap gap-2">
            {POLES.map((p) => (
              <QButton key={p.id} color={Q.cyan} onClick={() => {
                const [x, y, z] = p.v as [number, number, number];
                setAngles(Math.acos(z), Math.atan2(y, x));
                setHistory([]);
              }}>{p.label}</QButton>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed" style={{ color: Q.faint }}>
            North = |0⟩, south = |1⟩. Anywhere on the equator is a 50/50 superposition — the point you’re on (the phase) is what makes interference possible.
          </p>
        </Panel>
      </div>
    </div>
  );
}
