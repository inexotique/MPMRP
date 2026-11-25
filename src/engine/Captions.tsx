// Motion-design captions: words pop in one by one with the voice, key terms highlighted in the chapter accent.
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {clamp, pop} from '../lib/anim';
import pron from '../../content/pronunciation.json';

type Seg = {text: string; from: number; dur: number; beat: number};
const TERMS = new Set(Object.keys(pron).flatMap((k) => k.toLowerCase().split(' ')));
const isKey = (w: string) => {
  const c = w.replace(/[.,:;!?…«»()"]/g, '');
  return /\d/.test(c) || /[€$%]/.test(c) || (c.length > 1 && c === c.toUpperCase() && /[A-Z]/.test(c)) || TERMS.has(c.toLowerCase().replace(/^(l'|d')/, ''));
};

/** Split a line into chunks of ≤ maxW words, preferring breaks after punctuation. */
const chunk = (words: string[], maxW = 6) => {
  const out: number[][] = [];
  let cur: number[] = [];
  words.forEach((w, i) => {
    cur.push(i);
    const punct = /[.,:;!?…]$/.test(w);
    if (cur.length >= maxW || (punct && cur.length >= 3) || i === words.length - 1) { out.push(cur); cur = []; }
  });
  return out;
};

export const KineticCaptions: React.FC<{segments: Seg[]; accent: string; topBeats: Set<number>}> = ({segments, accent, topBeats}) => {
  const f = useCurrentFrame();
  const s = segments.find((x) => f >= x.from - 4 && f < x.from + x.dur + 14);
  if (!s) return null;
  const words = s.text.split(/\s+/).filter(Boolean);
  // word timing: proportional to length, voice starts ~0.12 s into the clip
  const weights = words.map((w) => w.length + 2.5);
  const tot = weights.reduce((a, b) => a + b, 0);
  const lead = 7, span = Math.max(1, s.dur - lead - 6);
  let acc = 0;
  const start = weights.map((w) => { const t = s.from + lead + (acc / tot) * span; acc += w; return t; });
  const chunks = chunk(words);
  let ci = 0;
  chunks.forEach((c, i) => { if (f >= start[c[0]] - 3) ci = i; });
  const cur = chunks[ci];
  const endFade = interpolate(f, [s.from + s.dur + 2, s.from + s.dur + 14], [1, 0], clamp);
  const top = topBeats.has(s.beat);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: top ? 150 : undefined, bottom: top ? undefined : 58, display: 'flex', justifyContent: 'center', pointerEvents: 'none'}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 16px', maxWidth: 1500, opacity: endFade}}>
        {cur.map((wi) => {
          const p = pop(f, start[wi] - 2, {damping: 13, stiffness: 190, mass: 0.6});
          const key = isKey(words[wi]);
          const active = f >= start[wi] && (wi === words.length - 1 || f < start[wi + 1]);
          return (
            <span key={`${ci}-${wi}`} style={{
              display: 'inline-block', position: 'relative', fontFamily: F.display, fontWeight: key ? 900 : 700, fontSize: key ? 54 : 50, letterSpacing: '-0.01em',
              color: key ? accent : C.white, opacity: Math.min(1, p * 1.3), transform: `translateY(${(1 - p) * 26}px) scale(${0.85 + 0.15 * p + (active ? 0.04 : 0)})`,
              filter: `blur(${Math.max(0, (1 - p) * 6).toFixed(1)}px)`,
              textShadow: key ? `0 0 24px ${accent}88, 0 3px 14px rgba(0,0,0,0.9)` : '0 3px 14px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)',
            }}>
              {words[wi]}
              {key ? <span style={{position: 'absolute', left: 0, right: 0, bottom: -4, height: 5, borderRadius: 3, background: accent, transform: `scaleX(${interpolate(f, [start[wi], start[wi] + 14], [0, 1], clamp)})`, transformOrigin: 'left'}} /> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
};
