import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {ease} from '../lib/anim';

/** Deterministic pseudo-random price series (seeded) — reused by every chart in the course. */
export const series = (n: number, seed = 1, start = 1.085, vol = 0.00012) => {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const out: number[] = [start];
  for (let i = 1; i < n; i++) out.push(out[i - 1] + (rnd() - 0.5) * 2 * vol + Math.sin(i / 9) * vol * 0.15);
  return out;
};

export type OHLC = {o: number; h: number; l: number; c: number};
export const toCandles = (p: number[], per = 5): OHLC[] => {
  const r: OHLC[] = [];
  for (let i = 0; i + per <= p.length; i += per) {
    const w = p.slice(i, i + per);
    r.push({o: w[0], c: w[w.length - 1], h: Math.max(...w), l: Math.min(...w)});
  }
  return r;
};

type Props = {
  w: number; h: number; bid: number[]; spread?: number; drawStart: number; drawDur?: number;
  showAsk?: number; bandOpacity?: number; candles?: OHLC[]; decimals?: number;
};

/** Line / dual bid-ask chart with animated stroke reveal and price-axis labels. */
export const PriceChart: React.FC<Props> = ({w, h, bid, spread = 0, drawStart, drawDur = 60, showAsk = 0, bandOpacity = 0, decimals = 5}) => {
  const f = useCurrentFrame();
  const ask = bid.map((v) => v + spread);
  const lo = Math.min(...bid) - spread * 0.6, hi = Math.max(...ask) + spread * 0.6;
  const x = (i: number) => (i / (bid.length - 1)) * (w - 160);
  const y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
  const path = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const band = path(ask) + bid.map((_, i) => bid.length - 1 - i).map((i) => `L${x(i).toFixed(1)},${y(bid[i]).toFixed(1)}`).join('') + 'Z';
  const p = ease(f, drawStart, drawDur);
  const L = 4000;
  const ticks = 5;
  return (
    <svg width={w} height={h} style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="bandg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={C.green} stopOpacity={0.5} />
          <stop offset="1" stopColor={C.red} stopOpacity={0.5} />
        </linearGradient>
        <clipPath id="reveal"><rect x={-10} y={-50} width={(w - 150) * p + 10} height={h + 100} /></clipPath>
      </defs>
      {Array.from({length: ticks}, (_, i) => {
        const v = lo + ((hi - lo) * i) / (ticks - 1);
        return (
          <g key={i} opacity={0.6 * p}>
            <line x1={0} x2={w - 160} y1={y(v)} y2={y(v)} stroke={C.faint} strokeDasharray="4 10" />
            <text x={w - 140} y={y(v) + 8} fill={C.dim} fontFamily={F.mono} fontSize={24}>{v.toFixed(decimals)}</text>
          </g>
        );
      })}
      <g clipPath="url(#reveal)">
        <path d={band} fill="url(#bandg)" opacity={bandOpacity} />
        <path d={path(bid)} fill="none" stroke={C.red} strokeWidth={4} strokeDasharray={L} strokeDashoffset={L * (1 - p) * 0} />
        <path d={path(ask)} fill="none" stroke={C.green} strokeWidth={4} opacity={showAsk} />
      </g>
    </svg>
  );
};
