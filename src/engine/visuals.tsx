import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {clamp, ease, inOut, pop} from '../lib/anim';
import {Glass, KineticWord, MaskText} from '../components/core';
import {Chart, Heading, R, VP, col, pathOf} from './kit';

const center: React.CSSProperties = {justifyContent: 'center', alignItems: 'center'};
const lineAt = (cue: VP['cue'], n: number, i: number, map?: number[]) => cue(map ? map[i] ?? n - 1 : Math.min(i, n - 1)) + (map ? 0 : Math.max(0, i - (n - 1)) * 40);

// ── Chapter opener ──
export const ChapterV: React.FC<VP & {num: number; title: string}> = ({num, title, accent, cue}) => {
  const f = useCurrentFrame();
  const s = ease(f, 0, 50);
  return (
    <AbsoluteFill style={{...center, flexDirection: 'column'}}>
      <div style={{fontFamily: F.display, fontWeight: 900, fontSize: 420, lineHeight: 1, color: 'transparent', WebkitTextStroke: `3px ${accent}`, opacity: 0.35 * s, position: 'absolute', transform: `scale(${1.25 - 0.25 * s})`, letterSpacing: '-0.05em'}}>
        {String(num).padStart(2, '0')}
      </div>
      <R at={4} k="fade"><div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 34, letterSpacing: '0.4em', color: accent}}>CHAPITRE {num}</div></R>
      <div style={{marginTop: 30, textAlign: 'center'}}>
        <MaskText start={cue(0) + 6} dur={34} style={{fontFamily: F.display, fontWeight: 800, fontSize: 110, color: C.white, letterSpacing: '-0.03em'}}>{title}</MaskText>
      </div>
      <div style={{marginTop: 30, height: 4, width: 600, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, transform: `scaleX(${ease(f, 20, 60)})`}} />
    </AbsoluteFill>
  );
};

// ── Cold-open intro: one kinetic word per narration line over a live chart ──
export const IntroV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const words: string[] = v.words;
  let k = 0;
  for (let i = 0; i < words.length; i++) if (f >= lineAt(cue, n, i, v.at)) k = i;
  const p = pathOf(['volatile', 'upbig', 'downbig', 'spike', 'up', 'wave'][k % 6], 120, 0.03, k + 2);
  return (
    <AbsoluteFill style={center}>
      <AbsoluteFill style={{opacity: 0.35, ...center}}>
        <Chart key={k} p={p} w={1800} h={800} at={lineAt(cue, n, k, v.at)} drawDur={70} accent={k % 2 ? C.red : accent} mode={k % 2 ? 'candles' : 'line'} per={4} />
      </AbsoluteFill>
      <div key={k} style={{transform: `scale(${1 + 0.04 * ease(f, lineAt(cue, n, k, v.at), 120)})`}}>
        <KineticWord text={words[k]} start={lineAt(cue, n, k, v.at)} size={k === words.length - 1 ? 170 : 200} stagger={2} color={k === words.length - 1 ? accent : C.white} />
      </div>
    </AbsoluteFill>
  );
};

// ── Big kinetic word + optional subline ──
export const KineticV: React.FC<VP> = ({v, cue, n, accent}) => (
  <AbsoluteFill style={{...center, flexDirection: 'column', gap: 30}}>
    <KineticWord text={v.w} start={cue(0) - 6} size={v.size ?? 190} stagger={3} color={col(v.c, accent)} />
    {v.sub ? <MaskText start={cue(Math.min(1, n - 1)) + (n > 1 ? 0 : 40)} style={{fontFamily: F.sans, fontWeight: 600, fontSize: 52, color: C.dim, textAlign: 'center', maxWidth: 1500}}>{v.sub}</MaskText> : null}
  </AbsoluteFill>
);

// ── Big number statement ──
export const StatV: React.FC<VP> = ({v, cue, accent}) => {
  const f = useCurrentFrame();
  const p = pop(f, cue(0));
  return (
    <AbsoluteFill style={{...center, flexDirection: 'column', gap: 24}}>
      <Heading text={v.h} accent={accent} at={0} />
      <div style={{fontFamily: F.display, fontWeight: 900, fontSize: v.size ?? 260, color: col(v.c, accent), transform: `scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p), letterSpacing: '-0.04em', textShadow: `0 0 60px ${col(v.c, accent)}55`}}>{v.n}</div>
      <R at={cue(Math.min(1, v.dl ?? 0)) + 10}><div style={{fontFamily: F.sans, fontSize: 48, fontWeight: 600, color: C.white, textAlign: 'center', maxWidth: 1400}}>{v.d}</div></R>
    </AbsoluteFill>
  );
};

// ── Progressive list ──
export const ListV: React.FC<VP> = ({v, cue, n, accent}) => {
  const items: any[] = v.items;
  const big = items.length <= 3;
  return (
    <AbsoluteFill>
      <Heading text={v.h} accent={accent} at={0} />
      <div style={{position: 'absolute', top: 250, left: 260, display: 'flex', flexDirection: 'column', gap: big ? 30 : 18, width: 1400}}>
        {items.map((it, i) => {
          const o = typeof it === 'string' ? {t: it} : it;
          return (
            <R key={i} at={lineAt(cue, n, i, v.at)} k="left">
              <Glass style={{padding: big ? '26px 40px' : '16px 34px', display: 'flex', alignItems: 'center', gap: 30, borderRadius: 24}}>
                <div style={{fontFamily: F.display, fontWeight: 800, fontSize: big ? 46 : 36, color: col(o.c, accent), minWidth: 60, textAlign: 'center'}}>{o.s ?? String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: big ? 46 : 38, color: C.white}}>{o.t}</div>
                  {o.d ? <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: big ? 34 : 30, color: C.dim, marginTop: 6}}>{o.d}</div> : null}
                </div>
              </Glass>
            </R>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Dictionary term card: EN word → FR translation + definition → visual example ──
export const TermV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const t1 = cue(Math.min(1, n - 1)) + (n > 1 ? 0 : 50);
  const t2 = cue(Math.min(2, n - 1)) + (n > 2 ? 0 : 90);
  const move = inOut(f, t1 - 10, 40);
  const hasEx = !!v.ex;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: interpolate(move, [0, 1], [400, 120]), textAlign: hasEx ? 'left' : 'center', paddingLeft: hasEx ? interpolate(move, [0, 1], [0, 140]) : 0, transition: 'none'}}>
        <div style={{display: 'inline-block', transform: `scale(${interpolate(move, [0, 1], [1.5, 1])})`, transformOrigin: hasEx ? 'left center' : 'center'}}>
          <KineticWord text={v.en} start={cue(0) - 4} size={120} stagger={2} color={C.white} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 290, left: hasEx ? 140 : 260, width: hasEx ? 760 : 1400, textAlign: hasEx ? 'left' : 'center'}}>
        <R at={t1}><div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 46, color: accent}}>{v.fr}</div></R>
        <R at={t1 + 14}><div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 42, lineHeight: 1.35, color: C.white, marginTop: 26}}>{v.def}</div></R>
      </div>
      {hasEx ? (
        <div style={{position: 'absolute', left: 980, top: 230}}>
          <R at={t2} k="pop">
            <Glass style={{padding: 24, width: 820, height: 560, boxSizing: 'border-box'}}>
              <Chart p={pathOf(v.ex.p ?? 'up', 160, 0.02, v.ex.seed ?? 4)} w={770} h={510} at={t2} drawDur={80} accent={accent} mode={v.ex.mode ?? 'line'} per={8} levels={(v.ex.levels ?? []).map((l: any) => ({...l, l: l.l ?? Math.min(2, n - 1)}))} ann={(v.ex.ann ?? []).map((a: any) => ({...a, l: a.l ?? Math.min(2, n - 1)}))} cue={(k) => cue(k) + (k >= n ? 90 : 20)} color={v.ex.c ? col(v.ex.c, accent) : undefined} />
            </Glass>
          </R>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── Split comparison (two universes) ──
export const CompareV: React.FC<VP> = ({v, cue, n, accent}) => {
  const sides = [v.l, v.r];
  return (
    <AbsoluteFill>
      <Heading text={v.h} accent={accent} at={0} />
      <div style={{position: 'absolute', top: 260, left: 120, right: 120, display: 'flex', gap: 60}}>
        {sides.map((s: any, si: number) => {
          const base = si === 0 ? 0 : (s.at ?? Math.min(n - 1, Math.ceil(n / 2)));
          const c = col(s.c, accent);
          return (
            <R key={si} at={cue(base)} k={si ? 'right' : 'left'} style={{flex: 1}}>
              <Glass glow={c} style={{padding: '40px 46px', minHeight: 560, boxSizing: 'border-box'}}>
                <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 62, color: c}}>{s.t}</div>
                {s.st ? <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 34, color: C.dim, marginTop: 6}}>{s.st}</div> : null}
                <div style={{marginTop: 30, display: 'flex', flexDirection: 'column', gap: 20}}>
                  {(s.items ?? []).map((it: string, i: number) => (
                    <R key={i} at={cue(Math.min(n - 1, base + (s.step ? i : 0))) + 14 + i * (s.step ? 0 : 10)}>
                      <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 38, color: C.white, display: 'flex', gap: 16}}><span style={{color: c}}>●</span>{it}</div>
                    </R>
                  ))}
                </div>
              </Glass>
            </R>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Chart scene ──
export const ChartV: React.FC<VP> = ({v, cue, n, accent}) => (
  <AbsoluteFill>
    <Heading text={v.h} accent={accent} at={0} />
    <div style={{position: 'absolute', left: 160, top: 250}}>
      <Chart p={pathOf(v.p ?? 'up', v.pts ?? 180, v.noise ?? 0.022, v.seed ?? 5)} w={1600} h={640} at={cue(0)} drawDur={v.draw ?? 110} accent={accent} mode={v.mode ?? 'line'} per={v.per ?? 6} levels={v.levels} ann={v.ann} cue={(k) => cue(Math.min(k, n - 1)) + (k > n - 1 ? 60 : 0)} color={v.c ? col(v.c, accent) : undefined} />
    </div>
    {v.side ? (
      <div style={{position: 'absolute', left: 190, top: 270}}>
        {(v.side as string[]).map((s, i) => <R key={i} at={cue(Math.min(i + 1, n - 1))}><div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 36, color: C.white, marginBottom: 12, background: 'rgba(0,0,0,0.6)', padding: '6px 16px', borderRadius: 12, display: 'inline-block'}}>{s}</div></R>)}
      </div>
    ) : null}
  </AbsoluteFill>
);

// ── Step-by-step calculation ──
export const CalcV: React.FC<VP> = ({v, cue, n, accent}) => {
  const rows: string[] = v.rows;
  const f = useCurrentFrame();
  const resAt = lineAt(cue, n, rows.length, v.at);
  const rp = pop(f, resAt);
  return (
    <AbsoluteFill style={{...center, flexDirection: 'column'}}>
      <Heading text={v.h} accent={accent} at={0} />
      {v.ctx ? <R at={cue(0)}><div style={{fontFamily: F.sans, fontSize: 36, fontWeight: 600, color: C.dim, marginBottom: 34, textAlign: 'center'}}>{v.ctx}</div></R> : null}
      <div style={{display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'center', marginTop: 60}}>
        {rows.map((r, i) => (
          <R key={i} at={lineAt(cue, n, i, v.at)}>
            <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: rows.length > 4 ? 46 : 56, color: C.white, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.glassBorder}`, padding: '12px 34px', borderRadius: 18}}>{r}</div>
          </R>
        ))}
      </div>
      {v.res ? (
        <div style={{marginTop: 46, opacity: Math.min(1, rp), transform: `scale(${0.6 + 0.4 * rp})`, fontFamily: F.display, fontWeight: 900, fontSize: 104, color: col(v.rc, accent), textShadow: `0 0 50px ${col(v.rc, accent)}55`, textAlign: 'center'}}>{v.res}</div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── Bento grid of tiles ──
export const BentoV: React.FC<VP> = ({v, cue, n, accent}) => {
  const tiles: any[] = v.tiles;
  const cols = v.cols ?? (tiles.length <= 4 ? 2 : tiles.length <= 6 ? 3 : 4);
  return (
    <AbsoluteFill>
      <Heading text={v.h} accent={accent} at={0} />
      <div style={{position: 'absolute', top: v.h ? 250 : 140, left: 130, right: 130, bottom: 190, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 26}}>
        {tiles.map((t, i) => (
          <R key={i} at={lineAt(cue, n, i, v.at)} k="pop" style={{gridColumn: t.wide ? 'span 2' : undefined, display: 'flex'}}>
            <Glass glow={t.c ? col(t.c, accent) : undefined} style={{flex: 1, padding: '28px 34px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 28}}>
              <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: col(t.c ?? 'accent', accent), letterSpacing: '0.12em'}}>{t.tag ?? ''}</div>
              <div>
                <div style={{fontFamily: F.display, fontWeight: 800, fontSize: tiles.length > 6 ? 46 : 56, color: C.white, lineHeight: 1.05}}>{t.k}</div>
                {t.d ? <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: tiles.length > 6 ? 28 : 32, color: C.dim, marginTop: 10, lineHeight: 1.3}}>{t.d}</div> : null}
              </div>
            </Glass>
          </R>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── Animated horizontal bars ──
export const BarsV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const items: any[] = v.items;
  const max = Math.max(...items.map((i) => Math.abs(i.v)));
  return (
    <AbsoluteFill>
      <Heading text={v.h} accent={accent} at={0} />
      <div style={{position: 'absolute', top: 280, left: 160, right: 160, display: 'flex', flexDirection: 'column', gap: 34}}>
        {items.map((it, i) => {
          const at = lineAt(cue, n, i, v.at);
          const p = ease(f, at, 50);
          const c = col(it.c, accent);
          return (
            <R key={i} at={at} k="left">
              <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
                <div style={{width: v.lw ?? 420, fontFamily: F.sans, fontWeight: 700, fontSize: 36, color: C.white}}>{it.label}</div>
                <div style={{flex: 1, height: 64, background: 'rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden'}}>
                  <div style={{height: '100%', width: `${(Math.abs(it.v) / max) * 100 * p}%`, background: `linear-gradient(90deg, ${c}55, ${c})`, borderRadius: 14, boxShadow: `0 0 30px ${c}66`}} />
                </div>
                <div style={{width: 380, fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: c, textAlign: 'right', whiteSpace: 'nowrap'}}>{it.txt}</div>
              </div>
            </R>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Buy vs Sell split screen on the same moving price ──
export const SplitV: React.FC<VP> = ({v, cue, accent}) => {
  const f = useCurrentFrame();
  const p = pathOf(v.p ?? 'reversal', 160, 0.015, 9);
  const prog = ease(f, cue(1), v.draw ?? 300);
  const idx = Math.floor(prog * (p.length - 1));
  const delta = (p[idx] - p[0]) * (v.scale ?? 100);
  const Side = ({buy}: {buy: boolean}) => {
    const pnl = buy ? delta : -delta;
    const c = pnl >= 0 ? C.green : C.red;
    return (
      <div style={{flex: 1, position: 'relative', borderRight: buy ? `1px solid ${C.glassBorder}` : 'none', paddingTop: 140}}>
        <R at={cue(0) + (buy ? 0 : 10)}><div style={{textAlign: 'center', fontFamily: F.display, fontWeight: 900, fontSize: 84, color: buy ? C.green : C.red}}>{buy ? '▲ BUY · LONG' : '▼ SELL · SHORT'}</div></R>
        <R at={cue(0) + 20}><div style={{textAlign: 'center', fontFamily: F.sans, fontWeight: 600, fontSize: 36, color: C.dim}}>{buy ? 'Gagne si le prix monte' : 'Gagne si le prix baisse'}</div></R>
        <div style={{position: 'absolute', top: 330, left: 60}}>
          <Chart p={p} w={820} h={380} at={cue(1)} drawDur={v.draw ?? 300} accent={accent} color={C.white} area={false} />
        </div>
        <div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center', opacity: ease(f, cue(1), 20)}}>
          <span style={{fontFamily: F.mono, fontWeight: 800, fontSize: 76, color: c}}>{pnl >= 0 ? '▲ +' : '▼ −'}{Math.abs(pnl).toFixed(2)} €</span>
          <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 32, color: c}}>{pnl >= 0 ? 'GAIN LATENT' : 'PERTE LATENTE'}</div>
        </div>
      </div>
    );
  };
  return <AbsoluteFill style={{flexDirection: 'row'}}><Side buy /><Side buy={false} /></AbsoluteFill>;
};

// ── Candle anatomy: line morphs into a candle, labels appear per narration line ──
export const CandleV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const bear = !!v.bear;
  const morph = inOut(f, cue(Math.min(1, n - 1)), 60);
  const cx = 960, top = 220, bot = 900;
  const H = 1, O = bear ? 0.72 : 0.3, Cc = bear ? 0.3 : 0.72, L = 0;
  const Y = (x: number) => bot - x * (bot - top);
  const raw = [O, 0.45, 0.2, L, 0.35, 0.6, 0.5, H, 0.85, Cc];
  const raw2 = bear ? [O, 0.85, H, 0.8, 0.6, 0.65, 0.4, L, 0.15, Cc] : raw;
  const pts = raw2.map((y, i) => `${cx - 300 + i * 66},${Y(y)}`).join(' ');
  const c = bear ? C.red : C.green;
  const labels: [string, number, string][] = v.labels ?? [['HIGH', H, 'Plus haut'], [bear ? 'OPEN' : 'CLOSE', bear ? O : Cc, bear ? 'Ouverture' : 'Clôture'], [bear ? 'CLOSE' : 'OPEN', bear ? Cc : O, bear ? 'Clôture' : 'Ouverture'], ['LOW', L, 'Plus bas']];
  return (
    <AbsoluteFill>
      <Heading text={v.h} accent={accent} at={0} top={60} />
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <polyline points={pts} fill="none" stroke={C.white} strokeWidth={5} opacity={1 - morph} strokeDasharray={3000} strokeDashoffset={3000 * (1 - ease(f, cue(0), 70))} />
        <g opacity={morph} transform={`translate(${cx} 0) scale(${0.6 + 0.4 * morph} 1) translate(${-cx} 0)`}>
          <line x1={cx} x2={cx} y1={Y(H)} y2={Y(L)} stroke={c} strokeWidth={8} />
          <rect x={cx - 90} width={180} y={Y(Math.max(O, Cc))} height={Math.abs(Y(O) - Y(Cc))} fill={c} rx={8} style={{filter: `drop-shadow(0 0 30px ${c}88)`}} />
        </g>
        {labels.map(([k, y, fr], i) => {
          const o = ease(f, lineAt(cue, n, i + 2, v.at), 24);
          return (
            <g key={k} opacity={o}>
              <line x1={cx + 110} x2={cx + 110 + 200 * o} y1={Y(y)} y2={Y(y)} stroke={C.dim} strokeWidth={2} strokeDasharray="6 6" />
              <text x={cx + 340} y={Y(y) + 4} fill={C.white} fontFamily={F.display} fontWeight={800} fontSize={44}>{k}</text>
              <text x={cx + 340} y={Y(y) + 44} fill={C.dim} fontFamily={F.sans} fontWeight={600} fontSize={30}>{fr}</text>
            </g>
          );
        })}
        {(() => {
          const o = ease(f, lineAt(cue, n, 6, v.at), 24);
          return (
            <g opacity={o} fontFamily={F.sans} fontWeight={700} fontSize={36}>
              <text x={cx - 130} y={(Y(O) + Y(Cc)) / 2 + 12} textAnchor="end" fill={c}>CORPS ⟶</text>
              <text x={cx - 30} y={(Y(H) + Y(Math.max(O, Cc))) / 2 + 12} textAnchor="end" fill={C.white}>MÈCHE ⟶</text>
              <text x={cx - 30} y={(Y(L) + Y(Math.min(O, Cc))) / 2 + 12} textAnchor="end" fill={C.white}>MÈCHE ⟶</text>
            </g>
          );
        })()}
      </svg>
    </AbsoluteFill>
  );
};

// ── Same move, several timeframes ──
export const TimeframesV: React.FC<VP> = ({v, cue, n, accent}) => {
  const p = pathOf('pullback', 240, 0.03, 12);
  const tfs: [string, number, number][] = v.tfs ?? [['M5', 4, 240], ['H1', 12, 240], ['D1', 40, 240]];
  // note: v.tfs lets a chapter show a top-down order (e.g. D1 → H4 → H1)
  return (
    <AbsoluteFill>
      <Heading text={v.h} accent={accent} at={0} />
      <div style={{position: 'absolute', top: 260, left: 80, right: 80, display: 'flex', gap: 30}}>
        {tfs.map(([tf, per], i) => (
          <R key={tf} at={lineAt(cue, n, i, v.at)} k="pop" style={{flex: 1}}>
            <Glass style={{padding: 20, height: 600, boxSizing: 'border-box'}}>
              <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 54, color: accent, marginLeft: 16}}>{tf}</div>
              <Chart p={p} w={520} h={470} at={lineAt(cue, n, i, v.at)} drawDur={80} accent={accent} mode="candles" per={per} />
            </Glass>
          </R>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── Supply / demand tug: buyers vs sellers with price needle ──
export const FlowV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const st: number[][] = v.states;
  let b = st[0][0], s = st[0][1];
  for (let i = 1; i < st.length; i++) {
    const p = inOut(f, lineAt(cue, n, i, v.at), 50);
    b = b + (st[i][0] - b) * p; s = s + (st[i][1] - s) * p;
  }
  const price = 100 + (b - s) * 0.6;
  const people = (k: number, c: string, flip: boolean) => Array.from({length: 12}, (_, i) => (
    <div key={i} style={{width: 44, height: 44, borderRadius: 22, background: i < k ? c : 'rgba(255,255,255,0.06)', boxShadow: i < k ? `0 0 18px ${c}88` : 'none', transform: `scale(${i < k ? 1 : 0.7})`, order: flip ? -i : i}} />
  ));
  return (
    <AbsoluteFill>
      <Heading text={v.h} accent={accent} at={0} />
      <div style={{position: 'absolute', top: 300, left: 150, right: 150, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{width: 520}}>
          <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 56, color: C.green}}>▲ ACHETEURS</div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 24}}>{people(Math.round(b / 100 * 12), C.green, false)}</div>
          <div style={{fontFamily: F.sans, fontSize: 32, color: C.dim, marginTop: 16}}>Demande</div>
        </div>
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: F.sans, fontSize: 34, color: C.dim, fontWeight: 600}}>PRIX</div>
          <div style={{fontFamily: F.mono, fontWeight: 800, fontSize: 110, color: price >= 100 ? C.green : C.red}}>{price.toFixed(1)} €</div>
          <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 60, color: price > 100.5 ? C.green : price < 99.5 ? C.red : C.dim}}>{price > 100.5 ? '▲ HAUSSE' : price < 99.5 ? '▼ BAISSE' : '● ÉQUILIBRE'}</div>
        </div>
        <div style={{width: 520, textAlign: 'right'}}>
          <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 56, color: C.red}}>VENDEURS ▼</div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 24, justifyContent: 'flex-end'}}>{people(Math.round(s / 100 * 12), C.red, true)}</div>
          <div style={{fontFamily: F.sans, fontSize: 32, color: C.dim, marginTop: 16}}>Offre</div>
        </div>
      </div>
      {v.note ? <div style={{position: 'absolute', top: 780, width: '100%', textAlign: 'center'}}><R at={cue(n - 1)}><span style={{fontFamily: F.sans, fontWeight: 600, fontSize: 40, color: C.white}}>{v.note}</span></R></div> : null}
    </AbsoluteFill>
  );
};

// ── Quiz: question, countdown ring, answer reveal ──
export const QuizV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const ans = cue(Math.min(1, n - 1));
  const q0 = cue(0);
  const think = interpolate(f, [q0 + 60, ans], [0, 1], clamp);
  const shown = f >= ans;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 90, width: '100%', textAlign: 'center'}}>
        <R at={0} k="pop"><span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 34, letterSpacing: '0.3em', color: accent}}>QUIZ · {v.num}</span></R>
      </div>
      <div style={{position: 'absolute', top: 180, left: 200, right: 200, textAlign: 'center'}}>
        <MaskText start={q0} style={{fontFamily: F.display, fontWeight: 800, fontSize: 62, color: C.white, lineHeight: 1.15}}>{v.q}</MaskText>
      </div>
      <div style={{position: 'absolute', top: 400, left: 260, right: 260, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28}}>
        {(v.opts as string[]).map((o, i) => {
          const ok = i === v.a;
          const g = shown ? (ok ? C.green : undefined) : undefined;
          return (
            <R key={i} at={q0 + 30 + i * 8} k="pop">
              <Glass glow={g} style={{padding: '26px 34px', opacity: shown && !ok ? 0.35 : 1, transform: `scale(${shown && ok ? 1 + 0.04 * pop(f, ans) : 1})`, display: 'flex', gap: 22, alignItems: 'center'}}>
                <span style={{fontFamily: F.display, fontWeight: 800, fontSize: 44, color: g ?? accent}}>{shown && ok ? '✓' : 'ABCD'[i]}</span>
                <span style={{fontFamily: F.sans, fontWeight: 600, fontSize: 40, color: C.white}}>{o}</span>
              </Glass>
            </R>
          );
        })}
      </div>
      {!shown ? (
        <svg width={160} height={160} style={{position: 'absolute', left: 880, top: 760, opacity: f > q0 + 60 ? 1 : 0}}>
          <circle cx={80} cy={80} r={64} stroke="rgba(255,255,255,0.12)" strokeWidth={10} fill="none" />
          <circle cx={80} cy={80} r={64} stroke={accent} strokeWidth={10} fill="none" strokeDasharray={402} strokeDashoffset={402 * think} transform="rotate(-90 80 80)" strokeLinecap="round" />
          <text x={80} y={98} textAnchor="middle" fill={C.white} fontFamily={F.mono} fontWeight={700} fontSize={50}>{Math.max(0, Math.ceil((ans - f) / 60))}</text>
        </svg>
      ) : (
        <div style={{position: 'absolute', top: 780, left: 200, right: 200, textAlign: 'center'}}>
          <R at={ans + 20}><span style={{fontFamily: F.sans, fontWeight: 600, fontSize: 40, color: C.white}}>{v.why}</span></R>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Text-only quote / statement with word-by-word reveal. */
export const QuoteV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const words = (v.q as string).split(' ');
  const t0 = cue(0), t1 = cue(n - 1) + 60;
  return (
    <AbsoluteFill style={center}>
      <div style={{maxWidth: 1500, textAlign: 'center', fontFamily: F.display, fontWeight: 800, fontSize: v.size ?? 84, lineHeight: 1.2, letterSpacing: '-0.02em'}}>
        {words.map((w, i) => {
          const at = t0 + ((t1 - t0) * i) / words.length;
          const o = interpolate(f, [at, at + 14], [0.12, 1], clamp);
          const hl = (v.hl ?? []).includes(i);
          return <span key={i} style={{opacity: o, color: hl ? accent : C.white}}>{w} </span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Fair Value Gap anatomy: 3-candle imbalance, zone between candle 1 extreme and candle 3 extreme ──
const FVG_BULL = [[.30, .40, .27, .36], [.36, .39, .29, .33], [.33, .43, .31, .40], [.40, .45, .37, .42], [.42, .72, .41, .70], [.70, .73, .58, .66], [.66, .75, .63, .71], [.71, .74, .62, .68], [.68, .78, .65, .74]];
export const FvgV: React.FC<VP> = ({v, cue, n, accent}) => {
  const f = useCurrentFrame();
  const bear = !!v.bear;
  const cs = FVG_BULL.map(([o, h, l, c]) => (bear ? [1 - o, 1 - l, 1 - h, 1 - c] : [o, h, l, c]));
  const z0 = bear ? 1 - .58 : .45, z1 = bear ? 1 - .45 : .58;
  const X0 = 360, W = 1200, top = 230, H = 600;
  const Y = (y: number) => top + H - y * H;
  const cw = W / cs.length;
  const hl = ease(f, cue(Math.min(1, n - 1)), 30);
  const zone = ease(f, cue(Math.min(2, n - 1)), 40);
  const zc = bear ? C.red : C.green;
  return (
    <AbsoluteFill>
      <Heading text={v.h} accent={accent} at={0} top={60} />
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <rect x={X0 + 3 * cw} width={(W - 3 * cw) * zone} y={Y(z1)} height={Y(z0) - Y(z1)} fill={zc} opacity={0.2} />
        {zone > 0.01 ? <>
          <line x1={X0 + 3 * cw} x2={X0 + 3 * cw + (W - 3 * cw) * zone} y1={Y(z0)} y2={Y(z0)} stroke={zc} strokeWidth={3} strokeDasharray="12 8" />
          <line x1={X0 + 3 * cw} x2={X0 + 3 * cw + (W - 3 * cw) * zone} y1={Y(z1)} y2={Y(z1)} stroke={zc} strokeWidth={3} strokeDasharray="12 8" />
          <text x={X0 + W + 30} y={(Y(z0) + Y(z1)) / 2 + 16} fill={zc} fontFamily={F.display} fontWeight={900} fontSize={52} opacity={zone}>FVG</text>
          <text x={X0 + W + 30} y={Y(z0) + (bear ? -14 : 40)} fill={C.dim} fontFamily={F.sans} fontWeight={600} fontSize={26} opacity={zone}>{bear ? 'plus haut bougie 3' : 'plus haut bougie 1'}</text>
          <text x={X0 + W + 30} y={Y(z1) + (bear ? 40 : -14)} fill={C.dim} fontFamily={F.sans} fontWeight={600} fontSize={26} opacity={zone}>{bear ? 'plus bas bougie 1' : 'plus bas bougie 3'}</text>
        </> : null}
        {cs.map(([o, h, l, c], i) => {
          const p = ease(f, cue(0) + i * 6, 20);
          const up = c >= o, col2 = up ? C.green : C.red;
          const x = X0 + i * cw + cw / 2;
          const dim = hl > 0 && (i < 3 || i > 5) ? 1 - 0.65 * hl : 1;
          return (
            <g key={i} opacity={p * dim} transform={`translate(0 ${(1 - p) * 30})`}>
              <line x1={x} x2={x} y1={Y(h)} y2={Y(l)} stroke={col2} strokeWidth={4} />
              <rect x={x - cw * 0.3} width={cw * 0.6} y={Y(Math.max(o, c))} height={Math.max(4, Math.abs(Y(o) - Y(c)))} fill={col2} rx={3} />
              {i >= 3 && i <= 5 ? <text x={x} y={top + H + 50} textAnchor="middle" fill={C.white} fontFamily={F.sans} fontWeight={800} fontSize={30} opacity={hl}>{i - 2}</text> : null}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
