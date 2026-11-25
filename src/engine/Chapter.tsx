import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {clamp} from '../lib/anim';
import {Background, Sfx, Soundtrack} from '../components/core';
import {KineticCaptions} from './Captions';
import * as V from './visuals';
import * as G from './gui';
import type {VP} from './kit';

export type Ch = {id: string; num: number; title: string; accent: string; music: number; fps: number; total: number;
  beats: {v: any; from: number; dur: number}[]; segments: {id: string; beat: number; line: number; text: string; file: string; from: number; dur: number}[]};

const MAP: Record<string, React.FC<any>> = {
  chapter: V.ChapterV, intro: V.IntroV, kinetic: V.KineticV, stat: V.StatV, list: V.ListV, term: V.TermV, compare: V.CompareV,
  chart: V.ChartV, calc: V.CalcV, bento: V.BentoV, bars: V.BarsV, split: V.SplitV, candle: V.CandleV, tf: V.TimeframesV,
  flow: V.FlowV, quiz: V.QuizV, quote: V.QuoteV, order: G.OrderV, accounts: G.AccountsV, mt5: G.MT5V, map: G.MapV, calendar: G.CalendarV,
};
const XF = 18; // transition overlap (frames)

/** Beat container: blur/scale/slide in, scale/blur out — the default seamless transition. */
const Shell: React.FC<{dur: number; children: React.ReactNode; kind: number}> = ({dur, children, kind}) => {
  const f = useCurrentFrame();
  const i = interpolate(f, [0, XF], [0, 1], clamp);
  const o = interpolate(f, [dur - 2, dur + XF - 2], [0, 1], clamp);
  const ei = 1 - Math.pow(1 - i, 3), eo = o * o;
  const dir = kind % 3; // vary entry direction: zoom / slide-left / slide-up
  const tin = dir === 0 ? `scale(${0.92 + 0.08 * ei})` : dir === 1 ? `translateX(${(1 - ei) * 160}px)` : `translateY(${(1 - ei) * 120}px)`;
  const tout = `scale(${1 + 0.08 * eo}) translateX(${dir === 1 ? -eo * 160 : 0}px)`;
  const blur = (1 - ei) * 14 + eo * 14;
  return <AbsoluteFill style={{opacity: ei * (1 - eo), transform: `${tin} ${tout}`, filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined}}>{children}</AbsoluteFill>;
};

export const Chapter: React.FC<{ch: Ch}> = ({ch}) => {
  const f = useCurrentFrame();
  const segsOf = (b: number) => ch.segments.filter((s) => s.beat === b);
  const sfx: [number, string, number?][] = [];
  ch.beats.forEach((b, bi) => {
    const t = b.v.t;
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
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Background accent={ch.accent} />
      <AbsoluteFill style={{transform: `translate(${drift}px, ${Math.cos(f / 300) * 6}px) scale(${1.01 + 0.01 * Math.sin(f / 400)})`}}>
        {ch.beats.map((b, bi) => {
          const segs = segsOf(bi);
          const cue = (k: number) => { const sg = segs[Math.min(k, segs.length - 1)]; return (sg ? sg.from + (k === 0 ? 8 : Math.min(30, Math.round(sg.dur * 0.15))) : b.from) - b.from + (k > segs.length - 1 ? 60 : 0); };
          const Comp = MAP[b.v.t] ?? V.KineticV;
          const props: VP & {num: number; title: string} = {v: b.v, cue, n: segs.length, dur: b.dur, accent: ch.accent, num: ch.num, title: ch.title};
          return (
            <Sequence key={bi} from={b.from} durationInFrames={b.dur + XF} layout="none">
              <Shell dur={b.dur} kind={bi}><Comp {...props} /></Shell>
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <KineticCaptions segments={ch.segments} accent={ch.accent} topBeats={new Set(ch.beats.map((b, i) => (b.v.t === 'mt5' ? i : -1)))} />
      <Soundtrack timing={{id: ch.id, fps: ch.fps, total: ch.total, segments: ch.segments}} music={`sfx/music_${ch.music % 4}.wav`} />
      <Sfx cues={sfx} />
    </AbsoluteFill>
  );
};
