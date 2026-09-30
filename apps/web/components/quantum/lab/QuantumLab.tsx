'use client';

import { useState } from 'react';
import { Brain, BookOpen, Coins, FlaskConical, Globe, Library, Link2, Puzzle, Search, Trophy, Users } from 'lucide-react';
import type { Circuit } from '@/lib/quantum/helpers';
import { LAB_CSS, Q } from './theme';
import { LEVELS, ProgressProvider, levelOf, useProgress } from './progress';
import { Sandbox } from './Sandbox';
import { BlochExplorer } from './BlochExplorer';
import { QuantumCoin } from './QuantumCoin';
import { Puzzles } from './Puzzles';
import { EntanglementLab } from './EntanglementLab';
import { GroverGame } from './GroverGame';
import { PredictQuiz } from './PredictQuiz';
import { GateCards } from './GateCards';
import { Badges, Glossary } from './Glossary';

type TabId = 'class' | 'sandbox' | 'bloch' | 'coin' | 'puzzles' | 'entangle' | 'grover' | 'predict' | 'cards' | 'glossary' | 'badges';

const TABS: Array<{ id: TabId; label: string; icon: typeof Users; color: string; blurb: string }> = [
  { id: 'class', label: 'Live class', icon: Users, color: Q.green, blurb: 'The shared board your teacher drives' },
  { id: 'sandbox', label: 'Sandbox', icon: FlaskConical, color: Q.cyan, blurb: 'Build any circuit up to 4 qubits' },
  { id: 'bloch', label: 'Bloch sphere', icon: Globe, color: Q.pink, blurb: 'See one qubit rotate in 3D' },
  { id: 'coin', label: 'Quantum coin', icon: Coins, color: Q.amber, blurb: 'Measurement & probability' },
  { id: 'puzzles', label: 'Puzzles', icon: Puzzle, color: Q.violet, blurb: '10 levels, earn stars' },
  { id: 'entangle', label: 'Entanglement', icon: Link2, color: Q.green, blurb: 'Alice & Bob’s spooky pair' },
  { id: 'grover', label: 'Grover search', icon: Search, color: Q.cyan, blurb: 'Find the needle in √N steps' },
  { id: 'predict', label: 'Predict it', icon: Brain, color: Q.pink, blurb: 'Quick-fire intuition quiz' },
  { id: 'cards', label: 'Gate cards', icon: BookOpen, color: Q.indigo, blurb: 'Flashcards for every gate' },
  { id: 'glossary', label: 'Glossary', icon: Library, color: Q.violet, blurb: 'Every term, in plain English' },
  { id: 'badges', label: 'Badges', icon: Trophy, color: Q.amber, blurb: 'Your XP, level and badges' },
];

/** Pins the classroom's theme tokens so the live board matches the lab palette in any theme. */
const PINNED_TOKENS = {
  '--eco-athena': Q.cyan,
  '--eco-ink': '#0a0a1f',
  '--eco-ink-sunken': '#0c0b26',
  '--eco-ink-raised': '#17153d',
  '--eco-cream': Q.text,
  '--eco-cream-dim': Q.dim,
  '--eco-cream-faint': Q.faint,
  '--eco-rule': 'rgba(139, 92, 246, 0.3)',
  '--eco-green': Q.green,
  '--eco-amber': Q.amber,
} as React.CSSProperties;

function XpMeter() {
  const { progress } = useProgress();
  const lvl = levelOf(progress.xp);
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: Q.dim }} title={`${progress.xp} XP`}>
      <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: 'rgba(251,191,36,.14)', color: Q.amber }}>
        Lv {lvl + 1} · {LEVELS[lvl]}
      </span>
      <div className="h-2 w-24 overflow-hidden rounded-full" style={{ background: 'rgba(139,92,246,.18)' }}>
        <div className="qlab-bar h-full rounded-full" style={{ width: `${((progress.xp % 120) / 120) * 100}%`, background: `linear-gradient(90deg, ${Q.cyan}, ${Q.pink})` }} />
      </div>
      <span className="font-mono">{progress.xp} XP</span>
    </div>
  );
}

function Toast() {
  const { toast } = useProgress();
  if (!toast) return null;
  return (
    <div key={toast.id} className="qlab-pop pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold"
      style={{ background: 'linear-gradient(135deg, #22d3ee, #a78bfa)', color: '#07071a', boxShadow: '0 8px 30px rgba(167,139,250,.45)' }}>
      {toast.text}
    </div>
  );
}

function LabInner({ classBoard, live }: { classBoard: React.ReactNode; live: boolean }) {
  const [tab, setTab] = useState<TabId>(live ? 'class' : 'sandbox');
  const [seed, setSeed] = useState<Circuit | null>(null);
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div style={PINNED_TOKENS}>
      <style>{LAB_CSS}</style>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: Q.faint }}>
          <span style={{ color: active.color }}>●</span> {active.blurb}
        </p>
        <XpMeter />
      </div>

      <nav className="mb-5 flex gap-2 overflow-x-auto pb-2 xl:flex-wrap xl:overflow-visible" aria-label="Quantum Lab sections">
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="relative flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium transition"
              style={{
                color: on ? '#07071a' : Q.dim,
                background: on ? `linear-gradient(135deg, ${t.color}, color-mix(in srgb, ${t.color} 60%, #a78bfa))` : 'rgba(139,92,246,.08)',
                border: `1px solid ${on ? 'transparent' : Q.line}`,
                boxShadow: on ? `0 0 18px color-mix(in srgb, ${t.color} 45%, transparent)` : 'none',
              }}
            >
              <Icon size={16} strokeWidth={2.2} />
              {t.label}
              {t.id === 'class' && live && <span className="h-2 w-2 rounded-full" style={{ background: on ? '#07071a' : Q.green }} />}
            </button>
          );
        })}
      </nav>

      <div key={tab} className="qlab-pop">
        {tab === 'class' && <div className="qlab-panel">{classBoard}</div>}
        {tab === 'sandbox' && <Sandbox seed={seed} />}
        {tab === 'bloch' && <BlochExplorer />}
        {tab === 'coin' && <QuantumCoin />}
        {tab === 'puzzles' && <Puzzles />}
        {tab === 'entangle' && <EntanglementLab />}
        {tab === 'grover' && <GroverGame />}
        {tab === 'predict' && <PredictQuiz />}
        {tab === 'cards' && <GateCards onTry={(c) => { setSeed(c); setTab('sandbox'); }} />}
        {tab === 'glossary' && <Glossary />}
        {tab === 'badges' && <Badges />}
      </div>
      <Toast />
    </div>
  );
}

export function QuantumLab({ classBoard, live }: { classBoard: React.ReactNode; live: boolean }) {
  return (
    <ProgressProvider>
      <LabInner classBoard={classBoard} live={live} />
    </ProgressProvider>
  );
}
