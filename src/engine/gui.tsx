// Interface-style visuals: order simulator, leverage accounts, MT5 GUI, world sessions map, economic calendar.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {clamp, ease, inOut, pop} from '../lib/anim';
import {Glass} from '../components/core';
import {Chart, Heading, R, VP, col, pathOf} from './kit';

// ───────────── Order simulator ─────────────
type OCfg = {ctrl: number[]; levels: {y: number; label: string; c: string}[]; fill?: number; fillTxt?: string; exit?: number; exitTxt?: string; exitC?: string; trail?: boolean; fillY?: number; exitY?: number};
const ORDERS: Record<string, OCfg> = {
  market: {ctrl: [.5, .55, .48, .52, .5, .58, .62, .6, .7, .68, .75], levels: [], fill: .4, fillTxt: 'BUY exécuté au prix du marché'},
  buyLimit: {ctrl: [.75, .7, .72, .6, .55, .4, .32, .3, .38, .55, .65, .75], levels: [{y: .3, label: 'BUY LIMIT', c: 'green'}], fill: .62, fillTxt: 'Ordre exécuté'},
  sellLimit: {ctrl: [.25, .3, .28, .4, .45, .6, .68, .7, .62, .45, .35, .25], levels: [{y: .7, label: 'SELL LIMIT', c: 'red'}], fill: .62, fillTxt: 'Ordre exécuté'},
  buyStop: {ctrl: [.3, .35, .32, .4, .45, .5, .58, .64, .72, .78, .85], levels: [{y: .6, label: 'BUY STOP', c: 'green'}], fill: .63, fillTxt: 'Déclenché à la cassure'},
  sellStop: {ctrl: [.7, .65, .68, .6, .55, .5, .42, .36, .28, .22, .15], levels: [{y: .4, label: 'SELL STOP', c: 'red'}], fill: .63, fillTxt: 'Déclenché à la cassure'},
  stopLimit: {ctrl: [.3, .4, .5, .62, .72, .74, .66, .56, .6, .7, .8], levels: [{y: .7, label: 'STOP (déclencheur)', c: 'cyan'}, {y: .58, label: 'LIMIT (prix voulu)', c: 'green'}], fill: .7, fillTxt: 'Exécuté au prix limite', fillY: .58},
  stopLoss: {ctrl: [.6, .62, .58, .55, .5, .52, .44, .38, .3, .25, .2], levels: [{y: .6, label: 'ENTRÉE (BUY)', c: 'white'}, {y: .32, label: 'STOP LOSS', c: 'red'}], fill: 0.01, fillTxt: '', exit: .78, exitTxt: 'Position fermée — perte limitée', exitC: 'red', exitY: .32},
  takeProfit: {ctrl: [.35, .4, .38, .45, .5, .48, .58, .64, .72, .78, .84], levels: [{y: .35, label: 'ENTRÉE (BUY)', c: 'white'}, {y: .72, label: 'TAKE PROFIT', c: 'green'}], fill: 0.01, fillTxt: '', exit: .8, exitTxt: 'Position fermée — gain encaissé', exitC: 'green', exitY: .72},
  trailing: {ctrl: [.25, .32, .3, .42, .5, .48, .6, .7, .66, .76, .7, .6, .5], levels: [{y: .25, label: 'ENTRÉE (BUY)', c: 'white'}], trail: true, fill: 0.01, fillTxt: '', exit: .87, exitTxt: 'Stop suiveur touché', exitC: 'green'},
  slippage: {ctrl: [.75, .72, .74, .7, .68, .7, .66, .2, .22, .18, .2], levels: [{y: .5, label: 'STOP LOSS demandé', c: 'red'}], fill: 0.01, fillTxt: '', exit: .66, exitTxt: 'Exécuté plus bas : slippage', exitC: 'red', exitY: .2},
  partial: {ctrl: [.3, .35, .4, .38, .48, .55, .52, .62, .7, .68, .76], levels: [{y: .3, label: 'ENTRÉE 1,00 lot', c: 'white'}], fill: 0.01, fillTxt: '', exit: .62, exitTxt: '0,50 lot fermé · 0,50 lot reste ouvert', exitC: 'green'},
};

export const OrderV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const cfg = ORDERS[v.kind] ?? ORDERS.market;
  const p = pathOf(cfg.ctrl, 200, 0.012, 7);
  const W = 1500, Hh = 560, pad = 30, X0 = 210, Y0 = 280;
  const start = cue(Math.min(1, n - 1));
  const draw = v.draw ?? Math.max(240, cue(n - 1) - start + 60);
  const prog = interpolate(f, [start, start + draw], [0, 1], clamp);
  const X = (x: number) => X0 + pad + x * (W - 2 * pad);
  const Y = (y: number) => Y0 + Hh - pad - y * (Hh - 2 * pad);
  const at = (x: number) => p[Math.round(x * (p.length - 1))];
  const idx = Math.round(prog * (p.length - 1));
  // trailing stop: follows max(price) - distance, never moves down
  let trail = 0;
  if (cfg.trail) for (let i = 0; i <= idx; i++) trail = Math.max(trail, p[i] - 0.16);
  const marker = (x: number, y: number, txt: string, c: string) => {
    const o = prog >= x ? Math.min(1, pop(f, start + x * draw)) : 0;
    return o ? (
      <>
        <div style={{position: 'absolute', left: X(x) - 18, top: Y(y) - 18, width: 36, height: 36, borderRadius: 18, background: c, transform: `scale(${o})`, boxShadow: `0 0 30px ${c}`}} />
        {txt ? <div style={{position: 'absolute', left: X(x) - 300, width: 600, textAlign: 'center', top: Y(y) + (y > 0.5 ? 40 : -90), fontFamily: F.sans, fontWeight: 800, fontSize: 38, color: c, opacity: o, textShadow: `0 0 12px ${C.bg}`}}>{txt}</div> : null}
      </>
    ) : null;
  };
  return (
    <AbsoluteFill>
      <Heading text={v.h} accent={accent} at={0} />
      <div style={{position: 'absolute', left: X0, top: Y0}}>
        <Chart p={p} w={W} h={Hh} at={start} drawDur={draw} lin accent={accent} color={C.white} levels={cfg.levels.map((l) => ({...l, l: 0}))} cue={() => cue(0) + 20} />
      </div>
      {cfg.trail && idx > 2 ? (
        <div style={{position: 'absolute', left: X(0), width: X(prog) - X(0), top: Y(trail) - 2, height: 4, background: C.red, boxShadow: `0 0 14px ${C.red}`}}>
          <span style={{position: 'absolute', right: 0, top: 10, whiteSpace: 'nowrap', fontFamily: F.sans, fontWeight: 800, fontSize: 30, color: C.red}}>TRAILING STOP</span>
        </div>
      ) : null}
      {cfg.fill !== undefined && cfg.fillTxt !== undefined ? marker(cfg.fill, cfg.fillY ?? at(cfg.fill), cfg.fillTxt, C.green) : null}
      {cfg.exit !== undefined ? marker(cfg.exit, cfg.exitY ?? at(cfg.exit), cfg.exitTxt ?? '', col(cfg.exitC, accent)) : null}
      <div style={{position: 'absolute', left: X(prog) + 24, top: Y(at(prog)) - 26, opacity: prog > 0 && prog < 1 ? 1 : 0, fontFamily: F.mono, fontWeight: 700, fontSize: 32, color: C.bg, background: C.white, padding: '4px 12px', borderRadius: 8}}>
        {(1.08 + at(prog) * 0.01).toFixed(5)}
      </div>
    </AbsoluteFill>
  );
};

// ───────────── Leverage / margin multi-account simulator ─────────────
export const AccountsV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const accs: any[] = v.acc;
  const t0 = cue(Math.min(v.moveAt ?? 1, n - 1));
  const pipsNow = (v.move ?? -100) * interpolate(f, [t0, t0 + (v.moveDur ?? 360)], [0, 1], {...clamp, easing: (x) => x * x * (3 - 2 * x)});
  const rate = 1.08;
  return (
    <AbsoluteFill>
      <Heading text={v.h} accent={accent} at={0} top={60} />
      <div style={{position: 'absolute', top: 190, width: '100%', textAlign: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 44, color: pipsNow < 0 ? C.red : pipsNow > 0 ? C.green : C.dim}}>
        EUR/USD : {pipsNow >= 0 ? '▲ +' : '▼ −'}{Math.abs(pipsNow).toFixed(0)} pips
      </div>
      <div style={{position: 'absolute', top: 280, left: 80, right: 80, display: 'flex', gap: 28, justifyContent: 'center'}}>
        {accs.map((a, i) => {
          const lev = a.lev ?? 30;
          const notional = a.lots * 100000;               // EUR
          const margin = notional / lev;                   // EUR
          const cant = margin > a.bal;
          let pips = cant ? 0 : pipsNow;
          const pnlAt = (pp: number) => (a.lots * 10 * pp) / rate; // EUR
          // stop out at 50% margin level → position closed at that move
          const soPips = margin ? ((0.5 * margin - a.bal) * rate) / (a.lots * 10) : -1e9;
          const stopped = !cant && v.move < 0 && pips <= soPips;
          if (stopped) pips = soPips;
          const eq = a.bal + (cant ? 0 : pnlAt(pips));
          const ml = cant ? 0 : (eq / margin) * 100;
          const mc = ml < 100 ? C.red : C.green;
          return (
            <R key={i} at={cue(0) + 10 + i * 10} k="pop" style={{flex: 1, maxWidth: 560}}>
              <Glass glow={stopped || cant ? C.red : undefined} style={{padding: '30px 34px', position: 'relative', overflow: 'hidden', height: 600, boxSizing: 'border-box'}}>
                <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 48, color: C.white}}>{a.name}</div>
                <div style={{fontFamily: F.sans, fontSize: 30, fontWeight: 600, color: C.dim, marginTop: 4}}>{a.lots.toFixed(2)} lot · levier 1:{lev}</div>
                {[
                  ['Exposition', `${notional.toLocaleString('fr-FR')} €`, C.white],
                  ['Marge requise', `${margin.toLocaleString('fr-FR', {maximumFractionDigits: 2})} €`, cant ? C.red : C.white],
                  ['Equity', `${eq.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €`, eq < a.bal ? C.red : eq > a.bal ? C.green : C.white],
                ].map(([k, val, c]) => (
                  <div key={k as string} style={{display: 'flex', justifyContent: 'space-between', marginTop: 22, fontFamily: F.sans, fontSize: 34}}>
                    <span style={{color: C.dim, fontWeight: 600}}>{k}</span><span style={{fontFamily: F.mono, fontWeight: 700, color: c as string}}>{val}</span>
                  </div>
                ))}
                {!cant ? (
                  <div style={{marginTop: 30}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.sans, fontSize: 30, color: C.dim, fontWeight: 600}}><span>Margin Level</span><span style={{fontFamily: F.mono, color: mc}}>{ml.toFixed(0)} %</span></div>
                    <div style={{height: 22, background: 'rgba(255,255,255,0.06)', borderRadius: 11, marginTop: 10, position: 'relative'}}>
                      <div style={{height: '100%', width: `${Math.min(100, ml / 10)}%`, background: mc, borderRadius: 11, boxShadow: `0 0 20px ${mc}`}} />
                      <div style={{position: 'absolute', left: '5%', top: -8, bottom: -8, width: 3, background: C.red}} />
                    </div>
                    <div style={{fontFamily: F.sans, fontSize: 24, color: C.dim, marginTop: 8}}>▏Stop Out à 50 %</div>
                  </div>
                ) : null}
                {cant || stopped ? (
                  <div style={{position: 'absolute', left: 0, right: 0, bottom: 40, textAlign: 'center'}}>
                    <span style={{display: 'inline-block', transform: `rotate(-6deg) scale(${cant ? 1 : 0.8 + 0.2 * pop(f, f - 1)})`, border: `5px solid ${C.red}`, color: C.red, fontFamily: F.display, fontWeight: 900, fontSize: 46, padding: '8px 22px', borderRadius: 12}}>{cant ? 'MARGE INSUFFISANTE' : 'STOP OUT'}</span>
                  </div>
                ) : null}
              </Glass>
            </R>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ───────────── MetaTrader 5 simulated GUI ─────────────
const WIN = {x: 60, y: 60, w: 1800, h: 960};
const REG: Record<string, [number, number, number, number]> = {
  full: [0, 0, 1920, 1080],
  toolbar: [60, 96, 1800, 52],
  mw: [60, 150, 430, 420],
  nav: [60, 572, 430, 186],
  chart: [492, 150, 1368, 608],
  tf: [1120, 96, 740, 52],
  toolbox: [60, 760, 1800, 260],
  trade: [60, 800, 1800, 90],
  account: [60, 930, 1800, 50],
  dialog: [610, 230, 700, 560],
  volume: [640, 360, 640, 80],
  sltp: [640, 450, 640, 90],
  buttons: [640, 640, 640, 110],
  close: [1680, 840, 170, 50],
  history: [60, 980, 1800, 40],
};
const SYMS: [string, number, number][] = [['EURUSD', 1.085, 5], ['GBPUSD', 1.2712, 5], ['USDJPY', 151.42, 3], ['XAUUSD', 2385.4, 2], ['US500', 5280.5, 1], ['BTCUSD', 67250, 2], ['USOIL', 78.42, 2]];

export const MT5V: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const steps: any[] = v.steps;
  let k = 0;
  for (let i = 0; i < steps.length; i++) if (f >= cue(Math.min(i, n - 1)) - 20) k = i;
  const stepAt = (i: number) => cue(Math.min(i, n - 1)) - 20;
  const actFrame = (a: string) => { const i = steps.findIndex((s) => s.a === a); return i < 0 ? Infinity : stepAt(i) + 50; };
  const tOpen = actFrame('open'), tBuy = actFrame('buy'), tClose = actFrame('close'), tHist = actFrame('history');
  const dialog = f >= tOpen && f < tBuy;
  const hasPos = f >= tBuy && f < tClose;
  const closed = f >= tClose;
  const tick = (s: number) => Math.sin(f / 23 + s) * 0.00018 + Math.sin(f / 61 + s * 2) * 0.0003;
  const drift = (v.dir ?? 1) * 0.0025 * interpolate(f, [tBuy, tBuy + 900], [0, 1], clamp);
  const bid = 1.085 + tick(0) + drift;
  const open = 1.085 + tick(0) * 0 + 0.00012 + (Number.isFinite(tBuy) ? tickAt(tBuy) : 0);
  function tickAt(fr: number) { return Math.sin(fr / 23) * 0.00018 + Math.sin(fr / 61) * 0.0003; }
  const lots = 0.1;
  const closeBid = 1.085 + tickAt(tClose) + (v.dir ?? 1) * 0.0025 * interpolate(tClose, [tBuy, tBuy + 900], [0, 1], clamp);
  const profit = hasPos ? (bid - open) * 100000 * lots : 0;
  const realized = closed ? (closeBid - open) * 100000 * lots : 0;
  const bal = 1000 + realized;
  const margin = hasPos ? (lots * 100000 * open) / 30 : 0;
  const eq = bal + profit;
  // camera
  const tgt = (i: number) => REG[steps[i]?.f ?? 'full'] ?? REG.full;
  const cam = (r: number[]) => { const s = Math.min(2.2, 0.82 * 1920 / r[2], 0.78 * 1080 / r[3]); return {s: Math.max(1, s), cx: r[0] + r[2] / 2, cy: r[1] + r[3] / 2}; };
  const a = cam(tgt(Math.max(0, k - 1))), b = cam(tgt(k));
  const m = k === 0 ? 1 : inOut(f, stepAt(k), 50);
  const s = a.s + (b.s - a.s) * m, cx = a.cx + (b.cx - a.cx) * m, cy = a.cy + (b.cy - a.cy) * m;
  const tx = Math.max(1920 - 1920 * s, Math.min(0, 960 - cx * s)), ty = Math.max(1080 - 1080 * s, Math.min(0, 540 - cy * s));
  // cursor
  const cpt = (i: number) => { const r = tgt(i); const st = steps[i] ?? {}; return st.cur ?? [r[0] + r[2] * 0.55, r[1] + r[3] * 0.5]; };
  const c0 = cpt(Math.max(0, k - 1)), c1 = cpt(k);
  const cm = inOut(f, stepAt(k) + 10, 36);
  const cur = [c0[0] + (c1[0] - c0[0]) * cm, c0[1] + (c1[1] - c0[1]) * cm];
  const clickT = f - (stepAt(k) + 46);
  const txt = (t: string, sz = 22, c: string = C.white, w = 500) => <span style={{fontFamily: F.sans, fontSize: sz, color: c, fontWeight: w}}>{t}</span>;
  const panel: React.CSSProperties = {position: 'absolute', background: '#0B1017', border: '1px solid #1E2733', overflow: 'hidden'};
  const head = (t: string) => <div style={{height: 34, background: '#111824', borderBottom: '1px solid #1E2733', padding: '0 14px', display: 'flex', alignItems: 'center'}}>{txt(t, 20, C.dim, 700)}</div>;
  const chartP = pathOf('wave', 240, 0.03, 21);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${s})`, transformOrigin: '0 0'}}>
        <div style={{position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, background: '#070A0F', border: '1px solid #243041', borderRadius: 14, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.7)'}}>
          <div style={{height: 36, background: '#0E141D', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10}}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />)}
            <span style={{marginLeft: 16}}>{txt('MetaTrader 5 — Compte DÉMO · 1:30', 20, C.dim, 600)}</span>
          </div>
        </div>
        {/* toolbar */}
        <div style={{...panel, left: 60, top: 96, width: 1800, height: 52, display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px', boxSizing: 'border-box'}}>
          <div style={{background: accent, borderRadius: 8, padding: '6px 16px'}}>{txt('+ Nouvel ordre', 22, C.bg, 800)}</div>
          {txt('Algo Trading', 22, C.dim)}
          <div style={{marginLeft: 'auto', display: 'flex', gap: 14}}>{['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'].map((t) => <span key={t} style={{fontFamily: F.mono, fontSize: 22, color: t === 'H1' ? accent : C.dim, fontWeight: 700}}>{t}</span>)}</div>
        </div>
        {/* market watch */}
        <div style={{...panel, left: 60, top: 150, width: 430, height: 420}}>
          {head('MARKET WATCH')}
          <div style={{display: 'flex', padding: '8px 14px'}}>{txt('Symbole', 19, C.dim, 700)}<span style={{marginLeft: 'auto', width: 120, textAlign: 'right'}}>{txt('Bid', 19, C.dim, 700)}</span><span style={{width: 120, textAlign: 'right'}}>{txt('Ask', 19, C.dim, 700)}</span></div>
          {SYMS.map(([sy, px, d], i) => {
            const t = tick(i * 1.7) * (px / 1.085);
            const b2 = px + t + (i === 0 ? drift : 0);
            const up = Math.sin(f / 23 + i * 1.7) > 0;
            const spread = [0.00012, 0.00016, 0.016, 0.12, 0.4, 18, 0.03][i];
            return (
              <div key={sy} style={{display: 'flex', padding: '9px 14px', background: i === 0 ? `${accent}14` : 'transparent', borderTop: '1px solid #141B25'}}>
                {txt(sy, 22, C.white, 700)}
                <span style={{marginLeft: 'auto', width: 120, textAlign: 'right', fontFamily: F.mono, fontSize: 22, color: up ? '#4DA3FF' : C.red}}>{b2.toFixed(d)}</span>
                <span style={{width: 120, textAlign: 'right', fontFamily: F.mono, fontSize: 22, color: up ? '#4DA3FF' : C.red}}>{(b2 + spread).toFixed(d)}</span>
              </div>
            );
          })}
        </div>
        {/* navigator */}
        <div style={{...panel, left: 60, top: 572, width: 430, height: 186}}>
          {head('NAVIGATOR')}
          {['▸ Comptes', '▸ Indicateurs', '▸ Expert Advisors', '▸ Scripts'].map((t) => <div key={t} style={{padding: '6px 18px'}}>{txt(t, 22, C.white)}</div>)}
        </div>
        {/* chart */}
        <div style={{...panel, left: 492, top: 150, width: 1368, height: 608}}>
          <div style={{position: 'absolute', left: 16, top: 10}}>{txt('EURUSD, H1', 24, C.white, 700)}</div>
          <div style={{position: 'absolute', left: 10, top: 40}}><Chart p={chartP} w={1250} h={540} at={0} drawDur={1} accent={accent} mode="candles" per={5} /></div>
          <div style={{position: 'absolute', right: 0, top: 300 - (bid - 1.085) * 40000, background: C.red, padding: '2px 8px'}}><span style={{fontFamily: F.mono, fontSize: 20, color: C.white}}>{bid.toFixed(5)}</span></div>
          {hasPos ? <div style={{position: 'absolute', left: 0, right: 80, top: 312 - (open - 1.085) * 40000, borderTop: `2px dashed ${C.green}`}}><span style={{position: 'absolute', left: 10, top: -30}}>{txt(`buy ${lots.toFixed(2)}`, 20, C.green, 700)}</span></div> : null}
        </div>
        {/* toolbox */}
        <div style={{...panel, left: 60, top: 760, width: 1800, height: 260}}>
          <div style={{display: 'flex', height: 40, background: '#111824', alignItems: 'flex-end', gap: 4, padding: '0 10px'}}>
            {['Trade', 'Exposure', 'History', 'News', 'Journal'].map((t) => {
              const on = (t === 'History') === (f >= tHist);
              return <div key={t} style={{padding: '6px 20px', background: on ? '#0B1017' : 'transparent', borderRadius: '8px 8px 0 0'}}>{txt(t, 21, on ? C.white : C.dim, 700)}</div>;
            })}
          </div>
          <div style={{display: 'flex', padding: '8px 18px', gap: 0}}>
            {['Symbole', 'Type', 'Volume', 'Prix', 'S/L', 'T/P', 'Prix actuel', 'Profit'].map((h) => <span key={h} style={{flex: 1}}>{txt(h, 20, C.dim, 700)}</span>)}
          </div>
          {(f < tHist ? hasPos : closed) ? (
            <div style={{display: 'flex', padding: '8px 18px', background: '#111824', transform: `translateY(${(1 - Math.min(1, pop(f, f < tHist ? tBuy : tHist))) * 30}px)`}}>
              {['EURUSD', 'buy', lots.toFixed(2), open.toFixed(5), v.sl ?? '1.08250', v.tp ?? '1.08900', (f < tHist ? bid : closeBid).toFixed(5)].map((c, i) => <span key={i} style={{flex: 1, fontFamily: F.mono, fontSize: 21, color: i === 1 ? C.green : C.white}}>{c}</span>)}
              <span style={{flex: 1, fontFamily: F.mono, fontSize: 22, fontWeight: 800, color: (f < tHist ? profit : realized) >= 0 ? '#4DA3FF' : C.red}}>{(f < tHist ? profit : realized) >= 0 ? '+' : ''}{(f < tHist ? profit : realized).toFixed(2)}</span>
              {f < tHist ? <span style={{position: 'absolute', right: 30, background: '#2A1015', border: `1px solid ${C.red}`, borderRadius: 6, padding: '0 10px'}}>{txt('✕ Fermer', 20, C.red, 700)}</span> : null}
            </div>
          ) : null}
          <div style={{position: 'absolute', left: 18, right: 18, bottom: 54, display: 'flex', gap: 40, borderTop: '1px solid #1E2733', paddingTop: 12}}>
            {[['Balance', bal], ['Equity', eq], ['Margin', margin], ['Free Margin', eq - margin]].map(([k2, val]) => (
              <span key={k2 as string}>{txt(`${k2}: `, 22, C.dim, 700)}<span style={{fontFamily: F.mono, fontSize: 24, color: C.white, fontWeight: 700}}>{(val as number).toFixed(2)}</span></span>
            ))}
            <span>{txt('Margin Level: ', 22, C.dim, 700)}<span style={{fontFamily: F.mono, fontSize: 24, color: C.white, fontWeight: 700}}>{margin ? `${((eq / margin) * 100).toFixed(2)} %` : '—'}</span></span>
          </div>
        </div>
        {/* order dialog */}
        {dialog ? (
          <div style={{position: 'absolute', left: 610, top: 230, width: 700, height: 560, background: '#0E141D', border: `1px solid ${accent}66`, borderRadius: 16, boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 40px ${accent}22`, transform: `scale(${0.85 + 0.15 * Math.min(1, pop(f, tOpen))})`, opacity: Math.min(1, pop(f, tOpen)), padding: 30, boxSizing: 'border-box'}}>
            {txt('Ordre · EURUSD', 30, C.white, 800)}
            <div style={{marginTop: 20, display: 'flex', justifyContent: 'space-between'}}>{txt('Type', 24, C.dim, 600)}{txt('Exécution au marché', 24)}</div>
            <div style={{marginTop: 34, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>{txt('Volume', 24, C.dim, 600)}<span style={{fontFamily: F.mono, fontSize: 30, color: C.white, border: '1px solid #2A3646', padding: '6px 20px', borderRadius: 8}}>{lots.toFixed(2)}</span></div>
            <div style={{marginTop: 30, display: 'flex', gap: 30}}>
              <div style={{flex: 1}}>{txt('Stop Loss', 22, C.red, 700)}<div style={{fontFamily: F.mono, fontSize: 28, color: C.white, border: '1px solid #2A3646', padding: '6px 14px', borderRadius: 8, marginTop: 6}}>{f >= actFrame('sltp') ? v.sl ?? '1.08250' : '0.00000'}</div></div>
              <div style={{flex: 1}}>{txt('Take Profit', 22, C.green, 700)}<div style={{fontFamily: F.mono, fontSize: 28, color: C.white, border: '1px solid #2A3646', padding: '6px 14px', borderRadius: 8, marginTop: 6}}>{f >= actFrame('sltp') ? v.tp ?? '1.08900' : '0.00000'}</div></div>
            </div>
            <div style={{marginTop: 30, textAlign: 'center', fontFamily: F.mono, fontSize: 40, color: C.white}}>{bid.toFixed(5)} / {(bid + 0.00012).toFixed(5)}</div>
            <div style={{position: 'absolute', left: 30, right: 30, bottom: 30, display: 'flex', gap: 20}}>
              <div style={{flex: 1, background: '#C0303F', borderRadius: 10, padding: '18px 0', textAlign: 'center'}}>{txt('Sell by Market', 26, C.white, 800)}</div>
              <div style={{flex: 1, background: '#2F6FE0', borderRadius: 10, padding: '18px 0', textAlign: 'center'}}>{txt('Buy by Market', 26, C.white, 800)}</div>
            </div>
          </div>
        ) : null}
        {/* cursor */}
        <svg width={40} height={50} style={{position: 'absolute', left: cur[0], top: cur[1], filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))', transform: `scale(${1 / s})`, transformOrigin: '0 0'}}>
          <path d="M2 2 L2 38 L12 28 L19 44 L25 41 L18 26 L32 26 Z" fill={C.white} stroke={C.bg} strokeWidth={2} />
        </svg>
        {steps[k]?.a && clickT > 0 && clickT < 30 ? <div style={{position: 'absolute', left: cur[0] - 30, top: cur[1] - 30, width: 60, height: 60, borderRadius: 30, border: `3px solid ${accent}`, opacity: 1 - clickT / 30, transform: `scale(${0.5 + clickT / 20})`}} /> : null}
      </AbsoluteFill>
      {/* tooltip (screen space) */}
      {steps[k]?.tip ? (
        <div key={k} style={{position: 'absolute', top: 40, width: '100%', textAlign: 'center'}}>
          <R at={stepAt(k) + 30} k="pop"><span style={{display: 'inline-block', background: 'rgba(5,7,10,0.88)', border: `2px solid ${accent}`, borderRadius: 18, padding: '14px 30px', fontFamily: F.sans, fontWeight: 700, fontSize: 40, color: C.white, boxShadow: `0 0 40px ${accent}44`}}>{steps[k].tip}</span></R>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────── World map with trading sessions ─────────────
const LAND: [number, number][][] = [
  [[-168, 66], [-140, 70], [-95, 72], [-80, 62], [-60, 50], [-75, 35], [-80, 25], [-97, 18], [-105, 22], [-118, 32], [-125, 48], [-140, 58], [-160, 58]],
  [[-80, 10], [-60, 10], [-35, -6], [-40, -22], [-58, -38], [-70, -54], [-75, -40], [-72, -18], [-81, -4]],
  [[-10, 36], [0, 43], [-5, 48], [-2, 58], [10, 63], [25, 71], [40, 67], [40, 45], [28, 40], [20, 38], [10, 44], [3, 42]],
  [[-17, 21], [-10, 35], [10, 37], [32, 31], [43, 12], [51, 11], [40, -15], [32, -30], [20, -35], [13, -20], [9, 4], [-8, 5], [-17, 14]],
  [[40, 45], [40, 67], [70, 73], [110, 77], [140, 72], [180, 68], [160, 60], [140, 50], [130, 40], [122, 30], [110, 20], [105, 10], [100, 2], [95, 15], [80, 8], [72, 20], [60, 25], [50, 30], [35, 35]],
  [[114, -22], [130, -12], [142, -11], [153, -26], [146, -39], [135, -34], [115, -34]],
  [[130, 31], [140, 35], [142, 42], [141, 45], [139, 38]], [[-6, 50], [1, 51], [-2, 57], [-5, 58], [-5, 54]],
];
const inPoly = (x: number, y: number, P: [number, number][]) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const DOTS: [number, number][] = [];
for (let lat = 78; lat > -56; lat -= 3.2) for (let lon = -170; lon < 180; lon += 3.2) if (LAND.some((p) => inPoly(lon, lat, p))) DOTS.push([lon, lat]);
const SESS = [
  {k: 'sydney', name: 'SYDNEY', lon: 151, lat: -34, open: 23, close: 8, c: '#B57BFF'},
  {k: 'tokyo', name: 'TOKYO', lon: 139.7, lat: 35.7, open: 1, close: 10, c: '#FFB547'},
  {k: 'london', name: 'LONDRES', lon: -0.1, lat: 51.5, open: 9, close: 18, c: '#3EE6FF'},
  {k: 'newyork', name: 'NEW YORK', lon: -74, lat: 40.7, open: 14, close: 23, c: '#2BFF88'},
];

export const MapV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const seq: string[] = v.seq ?? ['all'];
  let k = 0;
  for (let i = 0; i < seq.length; i++) if (f >= cue(Math.min(i, n - 1))) k = i;
  const cur = seq[k];
  const P = (lon: number, lat: number) => [160 + ((lon + 170) / 350) * 1600, 120 + ((78 - lat) / 134) * 560];
  const on = (s: string) => cur === 'all' || cur === s || (cur === 'overlap' && (s === 'london' || s === 'newyork')) || (cur === 'asia' && (s === 'tokyo' || s === 'sydney'));
  const TL = {x: 260, y: 760, w: 1400};
  const hx = (h: number) => TL.x + (h / 24) * TL.w;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {DOTS.map(([lon, lat], i) => { const [x, y] = P(lon, lat); return <circle key={i} cx={x} cy={y} r={5} fill="rgba(255,255,255,0.16)" opacity={ease(f, i * 0.05, 20)} />; })}
        {SESS.map((s, i) => {
          const [x, y] = P(s.lon, s.lat);
          const a = on(s.k) ? 1 : 0.25;
          const pulse = (f / 50 + i * 0.3) % 1;
          return (
            <g key={s.k} opacity={ease(f, 20 + i * 10, 20) * a}>
              <circle cx={x} cy={y} r={14 + pulse * 70} fill="none" stroke={s.c} strokeWidth={3} opacity={1 - pulse} />
              <circle cx={x} cy={y} r={14} fill={s.c} style={{filter: `drop-shadow(0 0 16px ${s.c})`}} />
              <text x={x} y={y - 34} textAnchor="middle" fill={C.white} fontFamily={F.display} fontWeight={800} fontSize={38}>{s.name}</text>
            </g>
          );
        })}
        {/* 24h timeline, Paris time (winter) */}
        {Array.from({length: 25}, (_, h) => h).filter((h) => h % 3 === 0).map((h) => (
          <text key={h} x={hx(h)} y={TL.y + 250} textAnchor="middle" fill={C.dim} fontFamily={F.mono} fontSize={26}>{h}h</text>
        ))}
        {SESS.map((s, i) => {
          const y = TL.y + i * 52;
          const segs = s.open < s.close ? [[s.open, s.close]] : [[s.open, 24], [0, s.close]];
          const a = on(s.k) ? 1 : 0.22;
          return (
            <g key={s.k} opacity={a * ease(f, 30 + i * 12, 30)}>
              <text x={TL.x - 20} y={y + 30} textAnchor="end" fill={s.c} fontFamily={F.sans} fontWeight={700} fontSize={26}>{s.name}</text>
              {segs.map(([a0, b0], j) => <rect key={j} x={hx(a0)} y={y + 6} width={(hx(b0) - hx(a0)) * ease(f, 40 + i * 12, 40)} height={34} rx={8} fill={s.c} opacity={0.85} />)}
            </g>
          );
        })}
        {cur === 'overlap' ? <rect x={hx(14)} y={TL.y - 10} width={hx(18) - hx(14)} height={230} fill="none" stroke={C.white} strokeWidth={4} rx={10} strokeDasharray="10 8" /> : null}
        <text x={TL.x + TL.w} y={TL.y - 20} textAnchor="end" fill={C.dim} fontFamily={F.sans} fontSize={24} fontWeight={600}>Heure de Paris (hiver) · horaires indicatifs</text>
      </svg>
      {v.h ? <Heading text={v.h} accent={accent} at={0} top={24} /> : null}
    </AbsoluteFill>
  );
};

// ───────────── Economic calendar ─────────────
export const CalendarV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const rows: any[] = v.rows;
  let hl = -1;
  (v.hl ?? []).forEach((r: number, i: number) => { if (f >= cue(Math.min(i, n - 1))) hl = r; });
  const sp = v.spikeAt !== undefined ? cue(Math.min(v.spikeAt, n - 1)) : Infinity;
  return (
    <AbsoluteFill>
      <Heading text={v.h} accent={accent} at={0} top={50} />
      <div style={{position: 'absolute', top: 190, left: 160, right: 160}}>
        <Glass style={{padding: '14px 0', borderRadius: 24}}>
          <div style={{display: 'flex', padding: '10px 34px', fontFamily: F.sans, fontWeight: 700, fontSize: 26, color: C.dim}}>
            <span style={{width: 150}}>Heure</span><span style={{width: 130}}>Devise</span><span style={{flex: 1}}>Événement</span><span style={{width: 200}}>Impact</span>
          </div>
          {rows.map((r, i) => (
            <R key={i} at={6 + i * 6} k="left">
              <div style={{display: 'flex', alignItems: 'center', padding: '14px 34px', background: hl === i ? `${accent}22` : 'transparent', borderLeft: `6px solid ${hl === i ? accent : 'transparent'}`}}>
                <span style={{width: 150, fontFamily: F.mono, fontSize: 32, color: C.white}}>{r.t}</span>
                <span style={{width: 130, fontFamily: F.sans, fontWeight: 800, fontSize: 32, color: accent}}>{r.cur}</span>
                <span style={{flex: 1, fontFamily: F.sans, fontWeight: 600, fontSize: 34, color: C.white}}>{r.ev}</span>
                <span style={{width: 200, fontSize: 30, color: r.imp >= 3 ? C.red : r.imp === 2 ? '#FFB547' : C.dim, letterSpacing: 6}}>{'●'.repeat(r.imp)}{'○'.repeat(3 - r.imp)}</span>
              </div>
            </R>
          ))}
        </Glass>
      </div>
      {Number.isFinite(sp) ? (
        <div style={{position: 'absolute', left: 260, top: 640, opacity: ease(f, sp, 20)}}>
          <Chart p={pathOf('spike', 160, 0.01, 4)} w={1400} h={300} at={sp} drawDur={120} lin accent={accent} color={C.white} area={false} ann={[{x: 0.6, k: 'vline', text: 'ANNONCE', c: 'accent', l: 0}]} cue={() => sp + 60} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
