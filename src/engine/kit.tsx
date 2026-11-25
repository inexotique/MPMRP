// Shared primitives for every chapter visual: reveal helpers, heading, price-path presets, chart engine.
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {clamp, ease, pop} from '../lib/anim';

export type VP = {v: any; cue: (k: number) => number; n: number; dur: number; accent: string};

export const col = (c: string | undefined, accent: string) =>
  !c ? C.white : c === 'green' ? C.green : c === 'red' ? C.red : c === 'accent' ? accent : c === 'dim' ? C.dim : c === 'cyan' ? C.cyan : c;

/** Element appearing at frame `at` — kinds: up (spring rise), pop (scale overshoot), fade, left/right (slide). */
export const R: React.FC<{at: number; k?: 'up' | 'pop' | 'fade' | 'left' | 'right'; style?: React.CSSProperties; children?: React.ReactNode}> = ({at, k = 'up', style, children}) => {
  const f = useCurrentFrame();
  const p = pop(f, at, {damping: 15, stiffness: 150});
  const o = interpolate(f, [at, at + 12], [0, 1], clamp);
  const tr = k === 'pop' ? `scale(${0.5 + 0.5 * p})` : k === 'left' ? `translateX(${(1 - p) * -120}px)` : k === 'right' ? `translateX(${(1 - p) * 120}px)` : k === 'fade' ? 'none' : `translateY(${(1 - p) * 70}px)`;
  return <div style={{opacity: o, transform: tr, ...style}}>{children}</div>;
};

/** Mask-reveal heading used at the top of most beats. */
export const Heading: React.FC<{text?: string; at?: number; accent: string; top?: number}> = ({text, at = 0, accent, top = 90}) => {
  const f = useCurrentFrame();
  if (!text) return null;
  const p = ease(f, at, 30);
  return (
    <div style={{position: 'absolute', top, width: '100%', textAlign: 'center'}}>
      <div style={{display: 'inline-block', overflow: 'hidden', paddingBottom: 8}}>
        <div style={{transform: `translateY(${(1 - p) * 110}%)`, fontFamily: F.display, fontWeight: 800, fontSize: 64, color: C.white, letterSpacing: '-0.02em'}}>{text}</div>
      </div>
      <div style={{height: 4, width: 120, margin: '6px auto 0', borderRadius: 2, background: accent, transform: `scaleX(${ease(f, at + 10, 30)})`, boxShadow: `0 0 20px ${accent}`}} />
    </div>
  );
};

// ───────────────────────── price paths ─────────────────────────
const CTRL: Record<string, number[]> = {
  up: [.15, .3, .25, .42, .38, .55, .5, .68, .62, .8, .76, .9],
  down: [.9, .75, .8, .62, .67, .5, .55, .38, .43, .25, .3, .12],
  range: [.35, .65, .38, .66, .36, .64, .37, .65, .35, .63, .4, .6],
  breakout: [.4, .55, .42, .56, .41, .55, .43, .56, .5, .7, .78, .9],
  pullback: [.15, .3, .45, .6, .7, .62, .55, .5, .6, .75, .85, .92],
  retest: [.35, .45, .38, .46, .4, .6, .7, .62, .5, .52, .68, .85],
  hhhl: [.15, .4, .28, .55, .42, .7, .55, .85, .7, .95],
  lhll: [.9, .65, .78, .5, .63, .35, .48, .2, .33, .08],
  reversal: [.2, .4, .35, .6, .55, .8, .85, .7, .6, .45, .3, .15],
  correction: [.1, .3, .5, .7, .9, .75, .65, .7, .8, .9],
  consolidation: [.2, .45, .5, .44, .52, .46, .51, .47, .5, .48, .7, .88],
  spike: [.5, .52, .49, .51, .5, .52, .5, .95, .3, .7, .55, .6],
  gap: [.3, .35, .32, .38, .36, .4, .75, .78, .72, .8, .77, .82],
  calm: [.48, .52, .49, .51, .5, .52, .49, .51, .5, .52, .5, .51],
  volatile: [.5, .85, .2, .8, .3, .9, .15, .75, .35, .95, .1, .6],
  flat: [.5, .5, .5, .5, .5, .5],
  upbig: [.1, .2, .35, .3, .5, .65, .6, .8, .95],
  downbig: [.9, .8, .65, .7, .5, .35, .4, .2, .05],
  wave: [.5, .7, .4, .75, .35, .7, .45, .65, .5],
  sr: [.3, .7, .32, .68, .31, .7, .3, .69, .32, .7],
};

/** Deterministic path from a preset: smooth interpolation + seeded micro-noise. Values in 0..1. */
export const pathOf = (name: string | number[], n = 180, noise = 0.025, seed = 3): number[] => {
  const c = Array.isArray(name) ? name : CTRL[name] ?? CTRL.up;
  let s = seed * 7919;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const out: number[] = [];
  let walk = 0;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * (c.length - 1);
    const a = Math.floor(x), b = Math.min(c.length - 1, a + 1), t = x - a;
    const e = t * t * (3 - 2 * t);
    walk = walk * 0.8 + (rnd() - 0.5) * noise;
    out.push(c[a] + (c[b] - c[a]) * e + walk);
  }
  return out;
};

export type Candle = {o: number; h: number; l: number; c: number};
export const candlesOf = (p: number[], per: number): Candle[] => {
  const r: Candle[] = [];
  for (let i = 0; i + per <= p.length; i += per) {
    const w = p.slice(i, i + per + 1);
    r.push({o: w[0], c: w[w.length - 1], h: Math.max(...w), l: Math.min(...w)});
  }
  return r;
};

type Ann = {l?: number; x: number; text?: string; c?: string; k?: 'dot' | 'vline' | 'arrow'; dy?: number};
type Lvl = {y: number; y2?: number; label?: string; c?: string; l?: number};

/** Chart engine: line or candles, progressive reveal, horizontal levels/zones, point annotations. */
export const Chart: React.FC<{
  p: number[]; w: number; h: number; at: number; drawDur?: number; mode?: 'line' | 'candles'; per?: number; accent: string;
  levels?: Lvl[]; ann?: Ann[]; cue?: (k: number) => number; area?: boolean; color?: string; upTo?: number; lin?: boolean;
}> = ({p, w, h, at, drawDur = 90, mode = 'line', per = 6, accent, levels = [], ann = [], cue = () => 0, area = true, color, upTo = 1, lin = false}) => {
  const f = useCurrentFrame();
  const prog = (lin ? interpolate(f, [at, at + drawDur], [0, 1], clamp) : ease(f, at, drawDur)) * upTo;
  const lo = 0, hi = 1, pad = 30;
  const X = (i: number, n: number) => pad + (i / (n - 1)) * (w - 2 * pad);
  const Y = (v: number) => h - pad - ((v - lo) / (hi - lo)) * (h - 2 * pad);
  const stroke = color ?? accent;
  const n = p.length;
  const lastI = Math.max(1, Math.floor(prog * (n - 1)));
  const pts = p.slice(0, lastI + 1).map((v, i) => `${X(i, n).toFixed(1)},${Y(v).toFixed(1)}`);
  const id = `g${Math.round(w + h + p[0] * 1000)}`;
  return (
    <svg width={w} height={h} style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={stroke} stopOpacity={0.28} /><stop offset="1" stopColor={stroke} stopOpacity={0} /></linearGradient>
      </defs>
      {[0.2, 0.4, 0.6, 0.8].map((g) => <line key={g} x1={pad} x2={w - pad} y1={Y(g)} y2={Y(g)} stroke="rgba(255,255,255,0.06)" />)}
      {levels.map((L, i) => {
        const o = ease(f, cue(L.l ?? 0), 24);
        const c = col(L.c, accent);
        return (
          <g key={i} opacity={o}>
            {L.y2 !== undefined ? <rect x={pad} width={(w - 2 * pad) * o} y={Y(Math.max(L.y, L.y2))} height={Math.abs(Y(L.y) - Y(L.y2))} fill={c} opacity={0.16} /> : null}
            <line x1={pad} x2={pad + (w - 2 * pad) * o} y1={Y(L.y)} y2={Y(L.y)} stroke={c} strokeWidth={3} strokeDasharray="14 10" />
            {L.label ? <text x={w - pad} y={Y(L.y) - 14} textAnchor="end" fill={c} fontFamily={F.sans} fontWeight={700} fontSize={30}>{L.label}</text> : null}
          </g>
        );
      })}
      {mode === 'line' ? (
        <>
          {area ? <polygon points={`${X(0, n)},${h - pad} ${pts.join(' ')} ${X(lastI, n)},${h - pad}`} fill={`url(#${id})`} /> : null}
          <polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" style={{filter: `drop-shadow(0 0 10px ${stroke}88)`}} />
          <circle cx={X(lastI, n)} cy={Y(p[lastI])} r={10} fill={stroke} style={{filter: `drop-shadow(0 0 14px ${stroke})`}} />
        </>
      ) : (
        candlesOf(p, per).map((c, i, arr) => {
          const cp = interpolate(prog * arr.length - i, [0, 1], [0, 1], clamp);
          if (cp <= 0) return null;
          const cw = (w - 2 * pad) / arr.length;
          const x = pad + i * cw + cw / 2;
          const up = c.c >= c.o;
          const cc = up ? C.green : C.red;
          const top = Y(Math.max(c.o, c.c)), bot = Y(Math.min(c.o, c.c));
          return (
            <g key={i} opacity={cp} transform={`translate(0 ${(1 - cp) * 20})`}>
              <line x1={x} x2={x} y1={Y(c.h)} y2={Y(c.l)} stroke={cc} strokeWidth={3} />
              <rect x={x - cw * 0.32} width={cw * 0.64} y={top} height={Math.max(3, bot - top)} fill={up ? cc : C.bg} stroke={cc} strokeWidth={3} rx={2} />
            </g>
          );
        })
      )}
      {ann.map((a, i) => {
        const at2 = cue(a.l ?? 0);
        const o = pop(f, at2);
        const idx = Math.round(a.x * (n - 1));
        const x = X(idx, n), y = Y(p[idx]);
        const c = col(a.c, accent);
        const dy = a.dy ?? -70;
        return (
          <g key={i} opacity={Math.min(1, o)}>
            {a.k === 'vline' ? <line x1={x} x2={x} y1={pad} y2={h - pad} stroke={c} strokeWidth={3} strokeDasharray="8 8" /> : <circle cx={x} cy={y} r={14 * o} fill="none" stroke={c} strokeWidth={5} />}
            {a.text ? (
              <text x={x} y={(a.k === 'vline' ? pad + 10 : y) + dy} textAnchor="middle" fill={c} fontFamily={F.sans} fontWeight={800} fontSize={34} style={{paintOrder: 'stroke', stroke: C.bg, strokeWidth: 8}}>{a.text}</text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
