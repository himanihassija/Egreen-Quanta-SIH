import { simulate, type Amplitude, type Circuit, type Gate, type GateName } from './simulator';

export type { Amplitude, Circuit, Gate, GateName };

/** Same physical state, ignoring global phase: |<a|b>|^2 ≈ 1. */
export function sameState(a: Amplitude[], b: Amplitude[], tol = 1e-6): boolean {
  if (a.length !== b.length) return false;
  let re = 0;
  let im = 0;
  for (let k = 0; k < a.length; k += 1) {
    const x = a[k]!;
    const y = b[k]!;
    // conj(x) * y
    re += x.re * y.re + x.im * y.im;
    im += x.re * y.im - x.im * y.re;
  }
  return Math.abs(re * re + im * im - 1) < tol * 10;
}

export function safeSimulate(circuit: Circuit) {
  try {
    return simulate(circuit);
  } catch {
    return null;
  }
}

export const ket = (index: number, qubits: number) => `|${index.toString(2).padStart(qubits, '0')}⟩`;

/** Human ket string, e.g. (|00⟩ + |11⟩)/√2. Ignores global phase. */
export function ketString(amps: Amplitude[], qubits: number): string {
  const terms = amps
    .map((a, k) => ({ a, k, m: Math.hypot(a.re, a.im) }))
    .filter((t) => t.m > 1e-6);
  if (terms.length === 0) return '0';
  // remove global phase using the first term
  const g = Math.atan2(terms[0]!.a.im, terms[0]!.a.re);
  const rot = terms.map((t) => {
    const ang = Math.atan2(t.a.im, t.a.re) - g;
    return { ...t, re: t.m * Math.cos(ang), im: t.m * Math.sin(ang) };
  });
  const equal = rot.every((t) => Math.abs(t.m - rot[0]!.m) < 1e-4);
  const coef = (re: number, im: number, withMag: boolean) => {
    const mag = Math.hypot(re, im);
    const ang = Math.atan2(im, re);
    const near = (x: number) => Math.abs(ang - x) < 1e-3 || Math.abs(ang - x - 2 * Math.PI) < 1e-3;
    let sign = '';
    if (near(0)) sign = '+';
    else if (near(Math.PI) || near(-Math.PI)) sign = '−';
    else if (near(Math.PI / 2)) sign = '+i';
    else if (near(-Math.PI / 2)) sign = '−i';
    if (sign && !withMag) return sign;
    const m = withMag ? mag.toFixed(2) : '';
    if (sign === '+i' || sign === '−i') return `${sign[0]}${m}i`;
    if (sign) return `${sign}${m}`;
    return `+${mag.toFixed(2)}e^{i${(ang / Math.PI).toFixed(2)}π}`;
  };
  if (equal) {
    const n = Math.round(1 / (rot[0]!.m * rot[0]!.m));
    const body = rot
      .map((t, i) => {
        const c = coef(t.re, t.im, false);
        const s = c.startsWith('−') ? ' − ' : ' + ';
        const iPart = c.includes('i') ? 'i' : '';
        return `${i === 0 ? (c.startsWith('−') ? '−' : '') : s}${iPart}${ket(t.k, qubits)}`;
      })
      .join('');
    if (n === 1) return body;
    const denom = Number.isInteger(Math.sqrt(n)) ? `${Math.sqrt(n)}` : `√${n}`;
    return `(${body})/${denom}`;
  }
  return rot
    .map((t, i) => {
      const c = coef(t.re, t.im, true);
      const txt = `${c}${ket(t.k, qubits)}`;
      return i === 0 ? txt.replace(/^\+/, '') : ` ${txt}`;
    })
    .join('');
}

/** Bloch vector of a single-qubit state α|0⟩ + β|1⟩. */
export function blochOf(alpha: Amplitude, beta: Amplitude) {
  // x = 2 Re(conj(α) β), y = 2 Im(conj(α) β), z = |α|² − |β|²
  const re = alpha.re * beta.re + alpha.im * beta.im;
  const im = alpha.re * beta.im - alpha.im * beta.re;
  return {
    x: 2 * re,
    y: 2 * im,
    z: alpha.re * alpha.re + alpha.im * alpha.im - (beta.re * beta.re + beta.im * beta.im),
  };
}

const QISKIT_NAME: Record<GateName, string> = {
  h: 'h', x: 'x', y: 'y', z: 'z', s: 's', sdg: 'sdg', t: 't', tdg: 'tdg',
  rx: 'rx', ry: 'ry', rz: 'rz', cnot: 'cx', cz: 'cz', swap: 'swap',
};

const angleText = (a = 0) => {
  const r = a / Math.PI;
  const fr: Record<string, string> = { '0.125': 'pi/8', '0.25': 'pi/4', '0.5': 'pi/2', '1': 'pi', '0.75': '3*pi/4' };
  return fr[String(Math.round(r * 1000) / 1000)] ?? a.toFixed(4);
};

/** Qiskit (Python) source for a circuit, ready to paste into a notebook. */
export function toQiskit(circuit: Circuit): string {
  const lines = [
    'from qiskit import QuantumCircuit',
    'from math import pi',
    '',
    `qc = QuantumCircuit(${circuit.qubits}, ${circuit.qubits})`,
  ];
  for (const g of circuit.gates) {
    const name = QISKIT_NAME[g.gate];
    if (g.target !== undefined) lines.push(`qc.${name}(${g.qubit}, ${g.target})`);
    else if (g.gate === 'rx' || g.gate === 'ry' || g.gate === 'rz') lines.push(`qc.${name}(${angleText(g.angle)}, ${g.qubit})`);
    else lines.push(`qc.${name}(${g.qubit})`);
  }
  lines.push(`qc.measure(range(${circuit.qubits}), range(${circuit.qubits}))`);
  lines.push('print(qc.draw())');
  lines.push('# Note: Qiskit prints bitstrings with q0 on the RIGHT; this lab shows q0 on the LEFT.');
  return lines.join('\n');
}

/** Draw `shots` samples from a probability distribution. */
export function sampleCounts(probs: number[], shots: number): number[] {
  const counts = new Array(probs.length).fill(0) as number[];
  for (let s = 0; s < shots; s += 1) {
    const r = Math.random();
    let c = 0;
    let k = 0;
    for (; k < probs.length; k += 1) {
      c += probs[k]!;
      if (r < c) break;
    }
    counts[Math.min(k, probs.length - 1)] += 1;
  }
  return counts;
}
