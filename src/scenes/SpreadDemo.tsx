import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {clamp, ease, inOut, mix, pop} from '../lib/anim';
import {makeCues, type Timing} from '../lib/timeline';
import {Background, Counter, Glass, KineticWord, MaskText, Sfx, Soundtrack, Subtitles} from '../components/core';
import {PriceChart, series} from '../components/chart';
import timingJson from '../generated/demo_spread.json';

const timing = timingJson as Timing;
const BID = 1.085, ASK = 1.0852;

const PriceCard: React.FC<{side: 'bid' | 'ask'; start: number; hl: number; x: number}> = ({side, start, hl, x}) => {
  const f = useCurrentFrame();
  const p = pop(f, start);
  const isBid = side === 'bid';
  const col = isBid ? C.red : C.green;
  const h = ease(f, hl, 20);
  return (
    <div style={{position: 'absolute', left: x, top: 270, transform: `translateY(${(1 - p) * 220}px) scale(${0.85 + 0.15 * p + 0.04 * h}) rotateX(${(1 - p) * 35}deg)`, opacity: p, transformOrigin: 'center bottom'}}>
      <Glass glow={h > 0.01 ? col : undefined} style={{width: 620, height: 340, padding: '38px 48px', boxSizing: 'border-box'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.sans, fontSize: 34, color: C.dim, fontWeight: 600}}>
          <span>EUR / USD</span>
          <span style={{color: col, opacity: 0.4 + 0.6 * h}}>{isBid ? '▼ SELL · VENDRE' : '▲ BUY · ACHETER'}</span>
        </div>
        <div style={{fontFamily: F.display, fontSize: 64, fontWeight: 800, color: C.white, marginTop: 22, letterSpacing: '-0.02em'}}>{isBid ? 'BID' : 'ASK'}</div>
        <Counter from={isBid ? 1.08 : 1.081} to={isBid ? BID : ASK} start={hl} dur={36} style={{fontSize: 96, fontWeight: 700, color: h > 0.5 ? col : C.white}} />
      </Glass>
    </div>
  );
};

export const SpreadDemo: React.FC = () => {
  const f = useCurrentFrame();
  const {at} = makeCues(timing);

  // ── Phase timings driven entirely by narration cues ──
  const titleUp = inOut(f, at('s2'), 40);              // SPREAD shrinks & moves up
  const calcIn = at('s6');
  const toChart = inOut(f, at('s7') - 10, 50);         // cards morph away → chart
  const closing = inOut(f, at('s9') - 6, 36);

  // virtual camera: slow drift + punch-in on calculation + push into chart band
  const camScale = 1 + 0.03 * Math.sin(f / 120) + 0.06 * inOut(f, calcIn + 160, 60) * (1 - toChart) + 0.12 * inOut(f, at('s8'), 70) * (1 - closing);
  const camX = Math.sin(f / 200) * 12;

  const sep = ease(f, at('s5'), 40);                   // glowing gap line
  const res = pop(f, calcIn + 200);                    // "= 2 pips"
  const chartPrices = series(120, 4, BID, 0.00009);

  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Background shiftX={f} />
      <AbsoluteFill style={{transform: `scale(${camScale}) translateX(${camX}px)`, perspective: 1600}}>

        {/* 1 ─ Kinetic title, then shared-element move to top */}
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: (1 - closing) * (1 - toChart)}}>
          <div style={{transform: `translateY(${mix(0, -390, titleUp)}px) scale(${mix(1, 0.32, titleUp)})`}}>
            <KineticWord text="SPREAD" start={at('s1') - 8} size={260} stagger={4} />
            <div style={{height: 6, marginTop: 10, background: `linear-gradient(90deg, transparent, ${C.green}, transparent)`, transform: `scaleX(${ease(f, at('s1') + 20, 40)})`, opacity: 1 - titleUp}} />
          </div>
        </AbsoluteFill>

        {/* 2 ─ Bid / Ask cards (fly out & fade when the chart takes over) */}
        <AbsoluteFill style={{opacity: 1 - toChart, transform: `translateY(${-toChart * 80}px) scale(${1 - toChart * 0.15})`, filter: `blur(${toChart * 12}px)`}}>
          <PriceCard side="bid" start={at('s2', 70)} hl={at('s3')} x={220} />
          <PriceCard side="ask" start={at('s2', 80)} hl={at('s4')} x={1080} />
          {/* glowing spread bracket */}
          <svg width={1920} height={1080} style={{position: 'absolute'}}>
            <defs><linearGradient id="gl" x1="0" x2="1"><stop offset="0" stopColor={C.red} /><stop offset="1" stopColor={C.green} /></linearGradient></defs>
            <line x1={840} x2={mix(840, 1080, sep)} y1={440} y2={440} stroke="url(#gl)" strokeWidth={8} strokeLinecap="round" style={{filter: `drop-shadow(0 0 18px ${C.cyan})`}} />
          </svg>
          <div style={{position: 'absolute', left: 840, width: 240, top: 360, textAlign: 'center', fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: C.cyan, opacity: sep, letterSpacing: '0.1em'}}>ÉCART</div>

          {/* 3 ─ Animated calculation */}
          <div style={{position: 'absolute', top: 650, width: '100%', display: 'flex', justifyContent: 'center', gap: 28, alignItems: 'baseline', fontFamily: F.mono, fontSize: 64, color: C.white}}>
            {[
              ['1.08520', C.green, 0], ['−', C.dim, 40], ['1.08500', C.red, 70], ['=', C.dim, 150], ['0.00020', C.cyan, 160],
            ].map(([t, col, d], i) => {
              const p = pop(f, calcIn + (d as number));
              return <span key={i} style={{color: col as string, opacity: p, transform: `translateY(${(1 - p) * 40}px)`, display: 'inline-block', filter: `blur(${(1 - p) * 8}px)`}}>{t}</span>;
            })}
          </div>
          <div style={{position: 'absolute', top: 750, width: '100%', textAlign: 'center', opacity: res, transform: `scale(${0.6 + 0.4 * res})`}}>
            <span style={{fontFamily: F.display, fontWeight: 800, fontSize: 120, color: C.white, letterSpacing: '-0.03em'}}>= 2 pips</span>
          </div>
        </AbsoluteFill>

        {/* 4 ─ Chart: bid (red) / ask (green) with spread band, buy marker, P&L */}
        <AbsoluteFill style={{opacity: toChart * (1 - closing), transform: `translateY(${(1 - toChart) * 120}px)`}}>
          <div style={{position: 'absolute', left: 160, top: 220}}>
            <PriceChart w={1600} h={480} bid={chartPrices} spread={0.0002} drawStart={at('s7') + 10} drawDur={90} showAsk={ease(f, at('s7') + 40, 30)} bandOpacity={0.35 * ease(f, at('s7') + 60, 40)} />
          </div>
          {(() => {
            const i = 119, xw = 1440 * (i / 119);
            const lo = Math.min(...chartPrices) - 0.00012, hi = Math.max(...chartPrices) + 0.0002 + 0.00012;
            const yA = 220 + 480 - ((chartPrices[i] + 0.0002 - lo) / (hi - lo)) * 480;
            const yB = 220 + 480 - ((chartPrices[i] - lo) / (hi - lo)) * 480;
            const m = pop(f, at('s7', 90));
            const n = pop(f, at('s7', 160));
            return (
              <>
                <div style={{position: 'absolute', left: 160 + xw - 20, top: yA - 20, width: 40, height: 40, borderRadius: 20, background: C.green, transform: `scale(${m})`, boxShadow: `0 0 30px ${C.green}`}} />
                <div style={{position: 'absolute', left: 160 + xw - 300, top: yA - 90, fontFamily: F.sans, fontWeight: 700, fontSize: 34, color: C.green, opacity: m}}>▲ ACHAT à l'Ask</div>
                <div style={{position: 'absolute', left: 160 + xw - 20, top: yB - 20, width: 40, height: 40, borderRadius: 20, border: `5px solid ${C.red}`, boxSizing: 'border-box', transform: `scale(${n})`}} />
                <div style={{position: 'absolute', left: 160 + xw - 340, top: yB + 36, fontFamily: F.sans, fontWeight: 700, fontSize: 34, color: C.red, opacity: n}}>▼ Revente au Bid</div>
              </>
            );
          })()}
          {/* P&L HUD */}
          <div style={{position: 'absolute', left: 160, top: 780, opacity: ease(f, at('s8'), 24), transform: `translateY(${(1 - ease(f, at('s8'), 24)) * 30}px)`}}>
            <Glass glow={C.red} style={{padding: '20px 36px', display: 'flex', gap: 36, alignItems: 'center'}}>
              <span style={{fontFamily: F.sans, fontSize: 34, color: C.dim, fontWeight: 600}}>P&L latent</span>
              <Counter from={0} to={-2} start={at('s8', 10)} dur={40} decimals={1} suffix=" pips" style={{fontSize: 56, fontWeight: 700, color: C.red}} />
              <span style={{fontFamily: F.sans, fontSize: 30, color: C.red, fontWeight: 700}}>▼ PERTE</span>
            </Glass>
          </div>
          <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
            <MaskText start={at('s7')} style={{fontFamily: F.display, fontWeight: 700, fontSize: 56, color: C.white}}>Le coût invisible de chaque ouverture</MaskText>
          </div>
        </AbsoluteFill>

        {/* 5 ─ Closing kinetic statement */}
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 20, opacity: closing * interpolate(f, [timing.total - 40, timing.total], [1, 0], clamp)}}>
          <MaskText start={at('s9') + 6} style={{fontFamily: F.sans, fontSize: 48, fontWeight: 600, color: C.dim}}>SPREAD =</MaskText>
          <KineticWord text="COÛT D'ENTRÉE" start={at('s9') + 60} size={150} stagger={2} color={C.white} />
        </AbsoluteFill>
      </AbsoluteFill>

      <Subtitles timing={timing} />
      <Soundtrack timing={timing} />
      <Sfx cues={[
        [at('s1') - 80, 'riser', 0.35], [at('s1') - 6, 'impact', 0.7],
        [at('s2'), 'whoosh', 0.45], [at('s2', 70), 'pop', 0.4], [at('s2', 80), 'pop', 0.4],
        [at('s3'), 'click', 0.5], [at('s4'), 'click', 0.5],
        [at('s5'), 'whoosh', 0.3], [calcIn, 'click', 0.4], [calcIn + 70, 'click', 0.4], [calcIn + 160, 'click', 0.4], [calcIn + 200, 'validate', 0.5],
        [at('s7') - 10, 'whoosh', 0.5], [at('s7', 90), 'pop', 0.45], [at('s7', 160), 'pop', 0.45],
        [at('s8'), 'ding', 0.35], [at('s9') - 6, 'whoosh', 0.5], [at('s9') + 60, 'impact', 0.6],
      ]} />
    </AbsoluteFill>
  );
};

export const SPREAD_DEMO_FRAMES = timing.total;
