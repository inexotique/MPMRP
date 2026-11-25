import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {clamp, ease, pop} from '../lib/anim';
import type {Timing} from '../lib/timeline';

/** Deep black stage with slow animated gradient glow + subtle grid (parallax via camera props). */
export const Background: React.FC<{accent?: string; shiftX?: number}> = ({accent = C.green, shiftX = 0}) => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 140) * 120;
  const b = Math.cos(f / 170) * 90;
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at ${30 + a / 20}% ${35 + b / 20}%, ${accent}22, transparent 70%),
                       radial-gradient(800px 700px at ${75 - a / 25}% ${70 - b / 25}%, ${accent}0C, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.faint} 1px, transparent 1px), linear-gradient(90deg, ${C.faint} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          backgroundPosition: `${-shiftX * 0.3}px 0`,
          opacity: 0.12,
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75))'}} />
    </AbsoluteFill>
  );
};

/** Kinetic typography: per-letter staggered spring rise with blur→sharp. */
export const KineticWord: React.FC<{text: string; start: number; size?: number; color?: string; stagger?: number; weight?: number; spacing?: number}> = ({
  text, start, size = 220, color = C.white, stagger = 3, weight = 800, spacing = -0.04,
}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', fontFamily: F.display, fontWeight: weight, fontSize: size, letterSpacing: `${spacing}em`, color, lineHeight: 1}}>
      {[...text].map((ch, i) => {
        const p = pop(f, start + i * stagger, {damping: 12, stiffness: 120});
        const blur = interpolate(p, [0, 1], [18, 0], clamp);
        return (
          <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', transform: `translateY(${(1 - p) * size * 0.6}px) scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 1.4), filter: `blur(${blur}px)`}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** Mask reveal: text slides up from behind an invisible edge. */
export const MaskText: React.FC<{start: number; children: React.ReactNode; style?: React.CSSProperties; dur?: number}> = ({start, children, style, dur = 28}) => {
  const f = useCurrentFrame();
  const p = ease(f, start, dur);
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.08em', ...style}}>
      <div style={{transform: `translateY(${(1 - p) * 110}%)`}}>{children}</div>
    </div>
  );
};

/** Rolling numeric counter (fixed decimals, tabular mono digits). */
export const Counter: React.FC<{from: number; to: number; start: number; dur?: number; decimals?: number; prefix?: string; suffix?: string; style?: React.CSSProperties}> = ({
  from, to, start, dur = 40, decimals = 5, prefix = '', suffix = '', style,
}) => {
  const f = useCurrentFrame();
  const v = from + (to - from) * ease(f, start, dur);
  return <span style={{fontFamily: F.mono, fontVariantNumeric: 'tabular-nums', ...style}}>{prefix}{v.toFixed(decimals)}{suffix}</span>;
};

/** Glass card container (light glassmorphism, no heavy backdrop blur for render speed). */
export const Glass: React.FC<{style?: React.CSSProperties; glow?: string; children?: React.ReactNode}> = ({style, glow, children}) => (
  <div
    style={{
      background: `linear-gradient(160deg, rgba(255,255,255,0.08), ${C.glass})`,
      border: `1.5px solid ${glow ? glow + 'AA' : C.glassBorder}`,
      borderRadius: 36,
      boxShadow: glow ? `0 0 60px ${glow}44, inset 0 0 40px ${glow}14` : '0 30px 80px rgba(0,0,0,0.5)',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Synchronised subtitles from timing data (also exported as SRT by tts.py). */
export const Subtitles: React.FC<{timing: Timing}> = ({timing}) => {
  const f = useCurrentFrame();
  const s = timing.segments.find((x) => f >= x.from && f < x.from + x.dur + 12);
  if (!s) return null;
  const o = Math.min(ease(f, s.from, 10), 1 - ease(f, s.from + s.dur + 2, 10));
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 54}}>
      <div style={{opacity: o, background: 'rgba(0,0,0,0.62)', padding: '12px 28px', borderRadius: 14, fontFamily: F.sans, fontWeight: 500, fontSize: 40, color: C.white, maxWidth: 1500, textAlign: 'center'}}>
        {s.text}
      </div>
    </AbsoluteFill>
  );
};

/** Narration + music bed with automatic ducking under the voice. */
export const Soundtrack: React.FC<{timing: Timing; music?: string; musicVol?: number; duckVol?: number}> = ({timing, music = 'sfx/music_bed.wav', musicVol = 0.22, duckVol = 0.07}) => {
  const segs = timing.segments;
  const vol = (f: number) => {
    // distance (frames) to nearest active narration window → smooth 12-frame ramps
    let d = Infinity;
    for (const s of segs) {
      if (f >= s.from && f <= s.from + s.dur) { d = 0; break; }
      d = Math.min(d, Math.abs(f - s.from), Math.abs(f - (s.from + s.dur)));
    }
    const k = Math.min(1, d / 14);
    const fadeOut = interpolate(f, [timing.total - 70, timing.total], [1, 0], clamp);
    const fadeIn = interpolate(f, [0, 30], [0, 1], clamp);
    return (duckVol + (musicVol - duckVol) * k) * fadeIn * fadeOut;
  };
  return (
    <>
      <Audio src={staticFile(music)} volume={vol} loop />
      {segs.map((s) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.dur + 6}>
          <Audio src={staticFile(s.file)} volume={1} />
        </Sequence>
      ))}
    </>
  );
};

/** Declarative SFX list: [frame, name, volume]. */
export const Sfx: React.FC<{cues: [number, string, number?][]}> = ({cues}) => (
  <>
    {cues.map(([at, name, v], i) => (
      <Sequence key={i} from={Math.max(0, Math.round(at))} durationInFrames={120}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={v ?? 0.5} />
      </Sequence>
    ))}
  </>
);
