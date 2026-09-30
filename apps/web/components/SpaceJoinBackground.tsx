/**
 * Animated space backdrop for the join screen: twinkling starfield, a slowly
 * rotating illustrated Earth, a big ATHENA title, a small "Powered by Egreen Quanta"
 * constellation, a soft cursor glow, and a synthesized click sound.
 *
 * Renders as a fixed, full-viewport layer behind whatever is passed as
 * `children` — the real join form (header / eco-glass panels / footer)
 * renders completely untouched in normal flow on top of it. Uses the
 * existing --font-display and --eco-* tokens from globals.css so it matches
 * the rest of the app, but adds nothing to globals.css itself — all styling
 * here is scoped under the `sjb-` prefix to avoid any class collisions.
 *
 * This background is intentionally always dark/space-themed regardless of
 * the site's light/dark theme toggle — a "light mode starfield" doesn't
 * make sense, so it does not read `data-eco-theme`.
 */

'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  driftSpeed: number;
  glow: boolean;
  tint: string;
}

const LAYER_CONFIG = [
  { density: 11000, rMin: 0.3, rMax: 0.7, alphaMin: 0.12, alphaMax: 0.32, speed: 0.006, glow: false },
  { density: 16000, rMin: 0.5, rMax: 1.1, alphaMin: 0.25, alphaMax: 0.55, speed: 0.015, glow: false },
  { density: 34000, rMin: 0.8, rMax: 1.7, alphaMin: 0.4, alphaMax: 0.8, speed: 0.03, glow: true },
];
const TINTS = ['255,255,255', '210,225,255', '255,240,220'];

export function SpaceJoinBackground({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const atomRef = useRef<HTMLCanvasElement>(null);

  // Quantum atom: glowing core, streaked 3D orbitals and orbiting bokeh.
  useEffect(() => {
    const canvas = atomRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const STRAND_COLORS = ['255,255,255', '190,160,255', '120,220,255', '230,140,255', '170,255,200', '255,220,150'];
    const orbits = [
      { tiltX: 1.15, tiltZ: 0.35, r: 0.62, speed: 0.12, yaw: 0.32, strands: 7 },
      { tiltX: 1.2, tiltZ: -0.9, r: 0.55, speed: -0.09, yaw: -0.26, strands: 6 },
      { tiltX: 0.35, tiltZ: 1.35, r: 0.48, speed: 0.15, yaw: 0.4, strands: 6 },
      { tiltX: 1.35, tiltZ: 2.1, r: 0.78, speed: 0.06, yaw: -0.18, strands: 8 },
    ];

    interface Particle { a: number; r: number; tx: number; tz: number; sp: number; size: number; hue: string; }
    const particles: Particle[] = Array.from({ length: 220 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.1 + Math.pow(Math.random(), 1.6) * 0.8,
      tx: Math.random() * Math.PI,
      tz: Math.random() * Math.PI,
      sp: (Math.random() * 0.25 + 0.05) * (Math.random() < 0.5 ? -1 : 1),
      size: Math.random() < 0.15 ? 2.5 + Math.random() * 3 : 0.6 + Math.random() * 1.4,
      hue: ['150,140,255', '200,170,255', '120,190,255', '255,255,255'][Math.floor(Math.random() * 4)],
    }));

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + 'px';
      canvas!.style.height = h + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Point on a tilted circle, projected with a light perspective.
    function project(angle: number, radius: number, tx: number, tz: number, spin: number, yaw = 0) {
      let x = Math.cos(angle) * radius;
      let y = Math.sin(angle) * radius;
      let z = 0;
      const y1 = y * Math.cos(tx) - z * Math.sin(tx);
      const z1 = y * Math.sin(tx) + z * Math.cos(tx);
      y = y1; z = z1;
      const tz2 = tz + spin;
      const x2 = x * Math.cos(tz2) - y * Math.sin(tz2);
      const y2 = x * Math.sin(tz2) + y * Math.cos(tz2);
      x = x2; y = y2;
      if (yaw) {
        const x3 = x * Math.cos(yaw) + z * Math.sin(yaw);
        const z3 = -x * Math.sin(yaw) + z * Math.cos(yaw);
        x = x3; z = z3;
      }
      const persp = 1 / (1 - z / (radius * 4 + 1));
      return { x: x * persp, y: y * persp, z };
    }

    function draw(t: number) {
      const time = t / 1000;
      ctx!.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h * 0.46;
      const unit = Math.min(w * 1.1, h * 1.9) * 0.8;

      ctx!.globalCompositeOperation = 'lighter';

      const haze = ctx!.createRadialGradient(cx, cy, 0, cx, cy, unit * 0.75);
      haze.addColorStop(0, 'rgba(150,70,255,0.4)');
      haze.addColorStop(0.4, 'rgba(90,50,220,0.18)');
      haze.addColorStop(1, 'rgba(40,20,120,0)');
      ctx!.fillStyle = haze;
      ctx!.fillRect(0, 0, w, h);

      for (const [oi, o] of orbits.entries()) {
        const spin = time * o.speed;
        const yaw = time * o.yaw;
        const wobble = Math.sin(time * 0.35 + oi * 1.7) * 0.18;
        for (let s = 0; s < o.strands; s++) {
          const radius = unit * o.r * (1 + (s - o.strands / 2) * 0.012);
          const color = STRAND_COLORS[s % STRAND_COLORS.length];
          const tx = o.tiltX + wobble + s * 0.006;
          ctx!.lineWidth = s === 0 ? 1.8 : 1;
          ctx!.strokeStyle = `rgba(${color},0.2)`;
          ctx!.beginPath();
          for (let i = 0; i <= 120; i++) {
            const p = project((i / 120) * Math.PI * 2, radius, tx, o.tiltZ, spin, yaw);
            if (i === 0) ctx!.moveTo(cx + p.x, cy + p.y); else ctx!.lineTo(cx + p.x, cy + p.y);
          }
          ctx!.stroke();

          const head = time * (0.5 + s * 0.04) * Math.sign(o.speed || 1) + s * 0.3;
          const trail = 1.4;
          const steps = 40;
          for (let i = 0; i < steps; i++) {
            const a0 = head - trail * (1 - i / steps);
            const a1 = head - trail * (1 - (i + 1) / steps);
            const p0 = project(a0, radius, tx, o.tiltZ, spin, yaw);
            const p1 = project(a1, radius, tx, o.tiltZ, spin, yaw);
            const depth = p1.z > 0 ? 0.55 : 1;
            ctx!.strokeStyle = `rgba(${color},${((i / steps) * 1 * depth).toFixed(3)})`;
            ctx!.beginPath();
            ctx!.moveTo(cx + p0.x, cy + p0.y);
            ctx!.lineTo(cx + p1.x, cy + p1.y);
            ctx!.stroke();
          }
        }
      }

      for (const p of particles) {
        const q = project(p.a + time * p.sp, unit * p.r, p.tx, p.tz, time * 0.03);
        const alpha = p.size > 2.4 ? 0.3 : 0.9;
        const r = p.size * (q.z > 0 ? 0.8 : 1.15);
        const g = ctx!.createRadialGradient(cx + q.x, cy + q.y, 0, cx + q.x, cy + q.y, r * 2.2);
        g.addColorStop(0, `rgba(${p.hue},${alpha})`);
        g.addColorStop(1, `rgba(${p.hue},0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(cx + q.x, cy + q.y, r * 2.2, 0, Math.PI * 2);
        ctx!.fill();
      }

      for (let k = 0; k < 3; k++) {
        const rr = unit * (0.07 + k * 0.018);
        ctx!.strokeStyle = 'rgba(200,180,255,0.35)';
        ctx!.lineWidth = 0.9;
        ctx!.beginPath();
        for (let i = 0; i <= 60; i++) {
          const p = project((i / 60) * Math.PI * 2, rr, 1.1 + k * 0.7, k * 1.3, time * (0.8 + k * 0.3));
          if (i === 0) ctx!.moveTo(cx + p.x, cy + p.y); else ctx!.lineTo(cx + p.x, cy + p.y);
        }
        ctx!.stroke();
      }

      const pulse = 1 + Math.sin(time * 2) * 0.08;
      const coreR = unit * 0.075 * pulse;
      const core = ctx!.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.4);
      core.addColorStop(0, 'rgba(255,255,255,1)');
      core.addColorStop(0.18, 'rgba(235,215,255,0.95)');
      core.addColorStop(0.45, 'rgba(170,90,255,0.55)');
      core.addColorStop(1, 'rgba(110,40,220,0)');
      ctx!.fillStyle = core;
      ctx!.beginPath();
      ctx!.arc(cx, cy, coreR * 2.4, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Starfield: three depth layers, twinkling + slow drift.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let layers: Star[][] = [];
    let raf = 0;

    interface ShootingStar {
      x: number;
      y: number;
      vx: number;
      vy: number;
      len: number;
      life: number;
      maxLife: number;
    }
    let shootingStars: ShootingStar[] = [];
    let nextShootAt = 0;

    function maybeSpawnShootingStar(now: number) {
      if (now < nextShootAt) return;
      // next one somewhere between 1.2s and 3s from now — frequent, but staggered
      nextShootAt = now + 1200 + Math.random() * 1800;
      const fromLeft = Math.random() < 0.5;
      const startX = fromLeft ? -20 : canvas!.width + 20;
      const startY = Math.random() * canvas!.height * 0.5;
      const speed = 6 + Math.random() * 4;
      const angle = fromLeft ? (Math.PI / 6) : Math.PI - Math.PI / 6;
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 60 + Math.random() * 40,
        life: 0,
        maxLife: 60,
      });
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      layers = LAYER_CONFIG.map((cfg) => {
        const count = Math.floor((canvas!.width * canvas!.height) / cfg.density);
        const stars: Star[] = [];
        for (let i = 0; i < count; i++) {
          stars.push({
            x: Math.random() * canvas!.width,
            y: Math.random() * canvas!.height,
            r: Math.random() * (cfg.rMax - cfg.rMin) + cfg.rMin,
            baseAlpha: Math.random() * (cfg.alphaMax - cfg.alphaMin) + cfg.alphaMin,
            twinkleSpeed: Math.random() * 0.015 + 0.003,
            phase: Math.random() * Math.PI * 2,
            driftSpeed: cfg.speed * (Math.random() * 0.6 + 0.7),
            glow: cfg.glow && Math.random() < 0.1,
            tint: TINTS[Math.floor(Math.random() * TINTS.length)],
          });
        }
        return stars;
      });
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const stars of layers) {
        for (const s of stars) {
          const alpha = Math.max(0, s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * 0.22);
          if (s.glow) {
            const grad = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
            grad.addColorStop(0, `rgba(${s.tint},${alpha * 0.45})`);
            grad.addColorStop(1, `rgba(${s.tint},0)`);
            ctx!.beginPath();
            ctx!.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
            ctx!.fillStyle = grad;
            ctx!.fill();
          }
          ctx!.beginPath();
          ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${s.tint},${alpha})`;
          ctx!.fill();
          s.y += s.driftSpeed;
          if (s.y > canvas!.height) {
            s.y = 0;
            s.x = Math.random() * canvas!.width;
          }
        }
      }

      maybeSpawnShootingStar(t);
      shootingStars = shootingStars.filter((s) => s.life < s.maxLife);
      for (const s of shootingStars) {
        const progress = s.life / s.maxLife;
        const fadeAlpha = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;
        const tailX = s.x - s.vx * (s.len / 10);
        const tailY = s.y - s.vy * (s.len / 10);
        const grad = ctx!.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${0.9 * fadeAlpha})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(s.x, s.y);
        ctx!.lineTo(tailX, tailY);
        ctx!.stroke();
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Cursor glow: purely decorative, never intercepts clicks.
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    function move(e: MouseEvent) {
      glow!.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  // Click sound: a short synthesized blip — no audio file to host or load.
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    function playClick() {
      if (!audioCtx) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new Ctx();
      }
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
    document.addEventListener('click', playClick, { capture: true });
    return () => document.removeEventListener('click', playClick, { capture: true });
  }, []);

  return (
    <>
      <style>{`
        .sjb-stage {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background:
            radial-gradient(ellipse 60% 40% at 60% 5%, color-mix(in srgb, var(--eco-glow) 20%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse 120% 90% at 50% -10%, #0e1a42 0%, #080b1e 55%, #04050f 100%);
        }
        .sjb-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

        .sjb-title-wrap {
          position: absolute;
          top: 4%;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          pointer-events: none;
          width: 100%;
        }
        .sjb-title {
          font-family: var(--font-display), ui-sans-serif, system-ui, sans-serif;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          font-size: clamp(44px, 8.5vw, 96px);
          line-height: 0.95;
          color: #e4f0f7;
          text-shadow:
            1px 1px 0 var(--eco-glow),
            2px 2px 0 var(--eco-glow),
            3px 3px 0 color-mix(in srgb, var(--eco-glow) 55%, black),
            4px 5px 14px rgba(0,0,0,0.5);
        }
        .sjb-subtitle {
          margin-top: 8px;
          font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--eco-athena);
          opacity: 0.9;
        }

        .sjb-globe-wrap {
          position: absolute;
          bottom: -60%;
          left: 50%;
          transform: translateX(-50%);
          width: min(62vw, 950px);
          pointer-events: none;
        }
        .sjb-globe-wrap svg { width: 100%; height: auto; display: block; filter: drop-shadow(0 25px 45px rgba(0,0,0,0.5)); }
        .sjb-globe-land { animation: sjb-rotate 130s linear infinite; transform-origin: 200px 200px; }
        @keyframes sjb-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .sjb-constellation {
          position: absolute;
          bottom: 20px;
          left: 24px;
          z-index: 1;
          width: 190px;
          height: 90px;
          pointer-events: none;
          opacity: 0.75;
        }
        .sjb-clabel {
          font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          fill: #e4f0f7;
          opacity: 0.8;
        }
        .sjb-cline { stroke: rgba(228,240,247,0.4); stroke-width: 1; fill: none; }
        .sjb-cstar { fill: #ffffff; animation: sjb-ctwinkle 1.7s ease-in-out infinite; }
        .sjb-cstar.s2 { animation-delay: 0.25s; }
        .sjb-cstar.s3 { animation-delay: 0.5s; }
        .sjb-cstar.s4 { animation-delay: 0.75s; }
        .sjb-cstar.s5 { animation-delay: 1s; }
        @keyframes sjb-ctwinkle { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

        .sjb-cursor-glow {
          position: fixed;
          top: 0;
          left: 0;
          width: 26px;
          height: 26px;
          margin-left: -13px;
          margin-top: -13px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          background: radial-gradient(circle, color-mix(in srgb, var(--eco-glow) 85%, white) 0%, transparent 70%);
          mix-blend-mode: screen;
          will-change: transform;
        }

        .sjb-moon {
          animation: sjb-moon-drift 9s ease-in-out infinite;
          transform-origin: center;
        }
        .sjb-moon-2 { animation-duration: 12s; animation-delay: 0.6s; }
        @keyframes sjb-moon-drift {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .sjb-float-body {
          position: absolute;
          pointer-events: none;
        }
        .sjb-ringed-planet {
          top: 10%;
          left: 6%;
          width: 68px;
          animation: sjb-float-drift-a 14s ease-in-out infinite;
        }
        .sjb-rocky-moon {
          top: 14%;
          right: 8%;
          width: 54px;
          animation: sjb-float-drift-b 11s ease-in-out infinite;
        }
        .sjb-comet {
          top: 34%;
          right: 20%;
          width: 40px;
          animation: sjb-float-drift-c 8s ease-in-out infinite;
        }
        @keyframes sjb-float-drift-a {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(4deg); }
        }
        @keyframes sjb-float-drift-b {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
        }
        @keyframes sjb-float-drift-c {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          50% { transform: translate(-10px, 8px) rotate(-6deg); }
        }

        .sjb-content { position: relative; z-index: 1; }
      `}</style>

      <div className="sjb-stage">
        <canvas ref={canvasRef} className="sjb-canvas" />
        <canvas ref={atomRef} className="sjb-canvas" />

        <div className="sjb-title-wrap">
          <div className="sjb-title">ATHENA</div>
          <div className="sjb-subtitle">Your AI Quantum Lab</div>
        </div>

        <svg className="sjb-float-body sjb-ringed-planet" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="sjbRingedPlanet" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#e8c98a" />
              <stop offset="100%" stopColor="#9a6f3a" />
            </radialGradient>
          </defs>
          <ellipse cx="50" cy="50" rx="46" ry="12" fill="none" stroke="#e8c98a" strokeWidth={2.5} opacity={0.6} transform="rotate(-18 50 50)" />
          <circle cx="50" cy="50" r="26" fill="url(#sjbRingedPlanet)" stroke="#0a1c2c" strokeWidth={2} />
        </svg>

        <svg className="sjb-float-body sjb-rocky-moon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="sjbRockyMoon" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#e0a99a" />
              <stop offset="100%" stopColor="#8a4a3a" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="32" fill="url(#sjbRockyMoon)" stroke="#0a1c2c" strokeWidth={2.2} />
          <circle cx="38" cy="40" r="6" fill="rgba(20,20,30,0.2)" />
          <circle cx="60" cy="58" r="4" fill="rgba(20,20,30,0.18)" />
        </svg>

        <svg className="sjb-float-body sjb-comet" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sjbCometTail" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <path d="M85 15 L10 50" stroke="url(#sjbCometTail)" strokeWidth={4} strokeLinecap="round" />
          <circle cx="88" cy="12" r="5" fill="#ffffff" />
        </svg>

        <svg className="sjb-constellation" viewBox="0 0 190 90" xmlns="http://www.w3.org/2000/svg">
          <path className="sjb-cline" d="M14 20 L42 12 L70 26 L98 14 L120 28 L146 18" />
          <circle className="sjb-cstar s1" cx="14" cy="20" r="2.2" />
          <circle className="sjb-cstar s2" cx="42" cy="12" r="1.8" />
          <circle className="sjb-cstar s3" cx="70" cy="26" r="2.4" />
          <circle className="sjb-cstar s4" cx="98" cy="14" r="1.6" />
          <circle className="sjb-cstar s5" cx="120" cy="28" r="2" />
          <circle className="sjb-cstar s2" cx="146" cy="18" r="1.8" />
          <text x="8" y="52" className="sjb-clabel">POWERED BY</text>
          <text x="8" y="66" className="sjb-clabel" style={{ fontSize: 13, letterSpacing: '0.14em', opacity: 0.95 }}>EGREEN QUANTA</text>
        </svg>
      </div>

      <div ref={glowRef} className="sjb-cursor-glow" />

      <div className="sjb-content">{children}</div>
    </>
  );
}