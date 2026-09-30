'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface Progress {
  xp: number;
  badges: string[];
  puzzles: Record<string, number>;
  bestStreak: number;
  flips: number;
  cardsSeen: string[];
  blochVisited: string[];
}

const EMPTY: Progress = { xp: 0, badges: [], puzzles: {}, bestStreak: 0, flips: 0, cardsSeen: [], blochVisited: [] };
const KEY = 'egreen-quanta-lab-progress';

export const BADGES: Array<{ id: string; name: string; icon: string; how: string }> = [
  { id: 'first-circuit', name: 'Hello, Qubit', icon: '🧪', how: 'Build your first circuit in the Sandbox' },
  { id: 'superposer', name: 'Superposer', icon: '🌗', how: 'Put a qubit into superposition' },
  { id: 'entangler', name: 'Entangler', icon: '🔗', how: 'Create an entangled state' },
  { id: 'bloch-tourist', name: 'Bloch Tourist', icon: '🌐', how: 'Visit all 6 poles of the Bloch sphere' },
  { id: 'coin-master', name: 'Law of Large Numbers', icon: '🪙', how: 'Measure 1,000 quantum coins' },
  { id: 'puzzler', name: 'Puzzler', icon: '🧩', how: 'Solve 5 circuit puzzles' },
  { id: 'grandmaster', name: 'Circuit Grandmaster', icon: '👑', how: 'Get 3 stars on every puzzle' },
  { id: 'spooky', name: 'Spooky Action', icon: '👻', how: 'Measure 20 entangled pairs' },
  { id: 'grover', name: 'Needle Finder', icon: '🔍', how: "Find the marked item with Grover's search" },
  { id: 'streak', name: 'Quantum Intuition', icon: '⚡', how: 'Get a 5-answer streak in Predict It' },
  { id: 'scholar', name: 'Scholar', icon: '📚', how: 'Flip all 12 gate cards' },
  { id: 'coder', name: 'Qiskit Coder', icon: '💻', how: 'Copy your circuit as Qiskit code' },
];

export const LEVELS = ['Classical Bit', 'Qubit Cadet', 'Superposer', 'Phase Shifter', 'Entangler', 'Quantum Wizard'];
export const levelOf = (xp: number) => Math.min(LEVELS.length - 1, Math.floor(xp / 120));

interface Ctx {
  progress: Progress;
  award: (xp: number, reason: string) => void;
  unlock: (badgeId: string) => void;
  update: (fn: (p: Progress) => Progress) => void;
  toast: { id: number; text: string } | null;
}

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const loaded = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setProgress({ ...EMPTY, ...(JSON.parse(raw) as Partial<Progress>) });
    } catch {
      // storage unavailable: progress just resets each visit
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [progress]);

  const flash = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), text });
    timer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const award = useCallback(
    (xp: number, reason: string) => {
      setProgress((p) => ({ ...p, xp: p.xp + xp }));
      flash(`+${xp} XP · ${reason}`);
    },
    [flash],
  );

  const unlock = useCallback(
    (badgeId: string) => {
      setProgress((p) => {
        if (p.badges.includes(badgeId)) return p;
        const b = BADGES.find((x) => x.id === badgeId);
        if (b) window.setTimeout(() => flash(`${b.icon} Badge unlocked: ${b.name} · +40 XP`), 0);
        return { ...p, badges: [...p.badges, badgeId], xp: p.xp + 40 };
      });
    },
    [flash],
  );

  const update = useCallback((fn: (p: Progress) => Progress) => setProgress(fn), []);

  return (
    <ProgressContext.Provider value={{ progress, award, unlock, update, toast }}>{children}</ProgressContext.Provider>
  );
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
