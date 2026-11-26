import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {clamp} from '../lib/anim';
import {Background, Sfx, Soundtrack} from '../components/core';
import {KineticCaptions} from './Captions';
import * as V from './visuals';
import * as G from './gui';
import {MotionCtx, type VP} from './kit';

export type Ch = {id: string; num: number; title: string; accent: string; music: number; fps: number; total: number;
  beats: {v: any; from: number; dur: number}[]; segments: {id: string; beat: number; line: number; text: string; file?: string; from: number; dur: number; words?: number[]; audio?: {file: string; from: number; dur: number}}[]};

const MAP: Record<string, React.FC<any>> = {
  chapter: V.ChapterV, intro: V.IntroV, kinetic: V.KineticV, stat: V.StatV, list: V.ListV, term: V.TermV, compare: V.CompareV,
  chart: V.ChartV, calc: V.CalcV, bento: V.BentoV, bars: V.BarsV, split: V.SplitV, candle: V.CandleV, tf: V.TimeframesV,
  flow: V.FlowV, quiz: V.QuizV, fvg: V.FvgV, quote: V.QuoteV, order: G.OrderV, accounts: G.AccountsV, mt5: G.MT5V, map: G.MapV, calendar: G.CalendarV,
};
const XF = 18; // transition overlap (frames)

/** Beat container. Classic (ch1-9): blur/scale/slide. Modern (ch10+): mask wipe, 3D swing, zoom-through, push — no blur, slow camera push. */
const Shell: React.FC<{dur: number; children: React.ReactNode; kind: number; modern: boolean}> = ({dur, children, kind, modern}) => {
  const f = useCurrentFrame();
  const i = interpolate(f, [0, XF + (modern ? 6 : 0)], [0, 1], clamp);
  const o = interpolate(f, [dur - 2, dur + XF - 2], [0, 1], clamp);
  const ei = 1 - Math.pow(1 - i, 3), eo = o * o;
  if (!modern) {
    const dir = kind % 3;
    const tin = dir === 0 ? `scale(${0.92 + 0.08 * ei})` : dir === 1 ? `translateX(${(1 - ei) * 160}px)` : `translateY(${(1 - ei) * 120}px)`;
    const tout = `scale(${1 + 0.08 * eo}) translateX(${dir === 1 ? -eo * 160 : 0}px)`;
    const blur = (1 - ei) * 8 + eo * 8;
    return <AbsoluteFill style={{opacity: ei * (1 - eo), transform: `${tin} ${tout}`, filter: blur > 1 ? `blur(${blur.toFixed(0)}px)` : undefined}}>{children}</AbsoluteFill>;
  }
  const push = 1 + 0.035 * interpolate(f, [0, dur], [0, 1], clamp);
  const t = kind % 4;
  let tin = '', clip: string | undefined;
  if (t === 0) { clip = `inset(0 ${((1 - ei) * 100).toFixed(1)}% 0 0)`; tin = `translateX(${(1 - ei) * 60}px)`; }
  else if (t === 1) tin = `perspective(1600px) rotateY(${(1 - ei) * -28}deg) translateX(${(1 - ei) * 220}px)`;
  else if (t === 2) tin = `scale(${1.35 - 0.35 * ei})`;
  else { clip = `inset(${((1 - ei) * 100).toFixed(1)}% 0 0 0)`; tin = `translateY(${(1 - ei) * 90}px)`; }
  const tout = t === 2 ? `scale(${1 - 0.18 * eo})` : t === 1 ? `perspective(1600px) rotateY(${eo * 22}deg) translateX(${-eo * 200}px)` : `translateY(${-eo * 70}px) scale(${1 - 0.05 * eo})`;
  return <AbsoluteFill style={{opacity: Math.min(1, ei * 1.4) * (1 - eo), transform: `${tin} ${tout} scale(${push})`, clipPath: clip}}>{children}</AbsoluteFill>;
};

/** Slow drifting light particles (cheap: plain divs). */
const Particles: React.FC<{accent: string}> = ({accent}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: 26}, (_, i) => {
        const sx = (i * 733) % 1920, sy = (i * 389) % 1080, sp = 0.15 + ((i * 7) % 10) / 25;
        const x = (sx + f * sp * (i % 2 ? 1 : -1) + 1920) % 1920, y = (sy - f * sp * 0.6 + 1080 * 4) % 1080;
        const r = 2 + (i % 4);
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, background: i % 3 ? accent : '#FFFFFF', opacity: 0.12 + 0.12 * Math.sin(f / 40 + i)}} />;
      })}
    </AbsoluteFill>
  );
};

/** Minimal HUD: chapter tag + progress bar. */
const Hud: React.FC<{ch: Ch}> = ({ch}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [40, 80], [0, 1], clamp);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: o}}>
      <div style={{position: 'absolute', left: 48, top: 34, display: 'flex', alignItems: 'center', gap: 14, fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: '0.18em', color: 'rgba(244,247,250,0.55)'}}>
        <span style={{width: 10, height: 10, borderRadius: 5, background: ch.accent, boxShadow: `0 0 12px ${ch.accent}`}} />
        {`CH ${String(ch.num).padStart(2, '0')} · ${ch.title.toUpperCase()}`}
      </div>
      <div style={{position: 'absolute', left: 0, bottom: 0, height: 4, width: `${(f / ch.total) * 100}%`, background: ch.accent, opacity: 0.8}} />
    </AbsoluteFill>
  );
};

export const Chapter: React.FC<{ch: Ch}> = ({ch}) => {
  const f = useCurrentFrame();
  const segsOf = (b: number) => ch.segments.filter((s) => s.beat === b);
  const sfx: [number, string, number?][] = [];
  const MOD: Record<string, string[]> = {
    list: ['click', 'pop'], bento: ['pop', 'click'], calc: ['type', 'click'], bars: ['sweep', 'tick'], chart: ['tick', 'pop'],
    compare: ['whoosh', 'pop'], order: ['click', 'tick'], stat: ['bass', 'pop'], kinetic: ['bass', 'pop'], quote: ['tick', 'pop'],
    term: ['pop', 'type'], fvg: ['bass', 'tick'], mt5: ['click', 'click'], calendar: ['ding', 'click'], map: ['pop', 'ding'], tf: ['whoosh', 'pop'],
    accounts: ['tick', 'bass'], split: ['whoosh', 'tick'], candle: ['pop', 'tick'], flow: ['pop', 'tick'],
  };
  const modernSfx = ch.num >= 10;
  ch.beats.forEach((b, bi) => {
    const t = b.v.t;
    if (modernSfx) {
      const segs = segsOf(bi);
      if (bi > 0) sfx.push([b.from - 8, bi % 2 ? 'whoosh' : 'sweep', 0.34]);
      if (t === 'chapter') { sfx.push([b.from - 90, 'riser', 0.3]); sfx.push([b.from + 4, 'impact', 0.6]); }
      if (t === 'quote' || t === 'stat' || t === 'kinetic') sfx.push([b.from + 10, 'bass', 0.4]);
      sfx.push([b.from + 14, 'pop', 0.16]);
      segs.forEach((sg, li) => {
        if (li === 0) return;
        const at = sg.from + Math.min(30, Math.round(sg.dur * 0.15));
        const pair = MOD[t] ?? ['pop', 'click'];
        const last = li === segs.length - 1;
        const name = t === 'calc' && last ? 'ding' : t === 'compare' && li === (b.v.r?.at ?? 1) ? 'whoosh' : pair[li % 2];
        sfx.push([at, name, name === 'pop' || name === 'tick' ? 0.22 : name === 'type' ? 0.28 : 0.32]);
        if (last && (t === 'list' || t === 'bento')) sfx.push([at + 30, 'validate', 0.22]);
      });
      return;
    }
    if (bi > 0) sfx.push([b.from - 6, t === 'chapter' ? 'sweep' : 'whoosh', 0.32]);
    if (t === 'chapter' || t === 'intro') sfx.push([b.from + 4, 'impact', 0.55]);
    segsOf(bi).forEach((s, li) => {
      if (li === 0) return;
      const at = s.from - b.from + Math.min(30, Math.round(s.dur * 0.15));
      const name = t === 'quiz' ? 'validate' : t === 'mt5' ? 'click' : t === 'calc' && li === segsOf(bi).length - 1 ? 'ding' : t === 'intro' ? 'bass' : 'pop';
      sfx.push([b.from + at, name, name === 'pop' ? 0.18 : 0.35]);
    });
    if (t === 'quiz') sfx.push([b.from + 70, 'tick', 0.25]);
  });
  const drift = Math.sin(f / 240) * 10;
  const modern = ch.num >= 10;
  return (
    <MotionCtx.Provider value={{variant: modern ? (ch.num % 3) + 1 : 0}}>
    <AbsoluteFill style={{background: C.bg}}>
      <Background accent={ch.accent} />
      {modern ? <Particles accent={ch.accent} /> : null}
      <AbsoluteFill style={{transform: `translate(${drift}px, ${Math.cos(f / 300) * 6}px) scale(${1.01 + 0.01 * Math.sin(f / 400)})`}}>
        {ch.beats.map((b, bi) => {
          const segs = segsOf(bi);
          const cue = (k: number) => { const sg = segs[Math.min(k, segs.length - 1)]; return (sg ? sg.from + (k === 0 ? 8 : Math.min(30, Math.round(sg.dur * 0.15))) : b.from) - b.from + (k > segs.length - 1 ? 60 : 0); };
          const Comp = MAP[b.v.t] ?? V.KineticV;
          const props: VP & {num: number; title: string} = {v: b.v, cue, n: segs.length, dur: b.dur, accent: ch.accent, num: ch.num, title: ch.title};
          return (
            <Sequence key={bi} from={b.from} durationInFrames={b.dur + XF} layout="none">
              <Shell dur={b.dur} kind={bi} modern={modern}><Comp {...props} /></Shell>
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <KineticCaptions segments={ch.segments} accent={ch.accent} topBeats={new Set(ch.beats.map((b, i) => (b.v.t === 'mt5' ? i : -1)))} />
      <Soundtrack timing={{id: ch.id, fps: ch.fps, total: ch.total, segments: ch.segments}} music={`sfx/music_${ch.music % 4}.wav`} />
      <Sfx cues={sfx} />
      {modern ? <Hud ch={ch} /> : null}
    </AbsoluteFill>
    </MotionCtx.Provider>
  );
};
