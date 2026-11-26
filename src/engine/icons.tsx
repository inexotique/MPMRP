// Animated line-art illustrations (stroke draw-on), picked automatically from a tile/list label.
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {clamp} from '../lib/anim';

const P: Record<string, string[]> = {
  globe: ['M50 10a40 40 0 1 0 0.1 0', 'M10 50h80', 'M50 10c-18 22-18 58 0 80', 'M50 10c18 22 18 58 0 80', 'M18 28h64', 'M18 72h64'],
  bank: ['M10 38L50 14l40 24', 'M16 38h68', 'M24 42v32', 'M42 42v32', 'M58 42v32', 'M76 42v32', 'M12 80h76'],
  shield: ['M50 10l34 12v26c0 22-15 36-34 44C31 84 16 70 16 48V22z', 'M34 50l11 11 21-23'],
  clock: ['M50 12a38 38 0 1 0 0.1 0', 'M50 28v24l16 10'],
  chart: ['M12 86h78', 'M12 86V14', 'M20 70l18-18 14 10 28-32', 'M66 30h14v14'],
  candles: ['M26 20v62', 'M18 34h16v30H18z', 'M50 12v54', 'M42 22h16v28H42z', 'M74 30v58', 'M66 44h16v30H66z'],
  coin: ['M50 14a36 36 0 1 0 0.1 0', 'M58 34c-4-4-18-6-18 4s18 6 18 16-14 8-18 4', 'M50 26v8', 'M50 66v8'],
  warning: ['M50 12l40 72H10z', 'M50 38v22', 'M50 70v2'],
  brain: ['M48 18c-10-8-26-2-26 12-10 4-10 20 0 24-2 14 14 22 26 14z', 'M52 18c10-8 26-2 26 12 10 4 10 20 0 24 2 14-14 22-26 14z', 'M50 18v60'],
  book: ['M14 20c14-4 26-2 36 6v58c-10-8-22-10-36-6z', 'M86 20c-14-4-26-2-36 6v58c10-8 22-10 36-6z'],
  calendar: ['M14 22h72v62H14z', 'M14 38h72', 'M32 14v14', 'M68 14v14', 'M28 52h10', 'M46 52h10', 'M64 52h10', 'M28 68h10'],
  target: ['M50 12a38 38 0 1 0 0.1 0', 'M50 28a22 22 0 1 0 0.1 0', 'M50 44a6 6 0 1 0 0.1 0'],
  robot: ['M24 34h52v42H24z', 'M50 20v14', 'M50 16a4 4 0 1 0 0.1 0', 'M38 50h2', 'M60 50h2', 'M38 64h24'],
  scale: ['M50 14v70', 'M30 84h40', 'M18 30h64', 'M18 30l-10 26h20z', 'M82 30l-10 26h20z'],
  lightning: ['M56 10L24 56h24l-6 34 34-48H52z'],
};
const RULES: [RegExp, string][] = [
  [/forex|devise|euro|dollar|monde|session|sydney|tokyo|londres|new york/i, 'globe'],
  [/banque|courtier|broker|amf|cysec|esma|regafi|régul|fonds|prop/i, 'bank'],
  [/protect|garanti|stop loss|sécur|solde|risque max/i, 'shield'],
  [/heure|horaire|jour|séance|h\b|clôtur|minute|24/i, 'clock'],
  [/graph|tendance|structure|chart|fvg|zone|support|résist/i, 'chart'],
  [/bougie|candle|ohlc/i, 'candles'],
  [/€|\$|frais|coût|commission|swap|profit|gain|capital|marge|dépôt|retrait/i, 'coin'],
  [/✕|arnaque|piège|danger|prudence|attention|erreur|perte|fuis|jamais/i, 'warning'],
  [/psych|fomo|peur|confiance|revenge|émotion|ressenti/i, 'brain'],
  [/journal|bilan|leçon|note|fiche|dic|document|guide/i, 'book'],
  [/calendrier|annonce|nfp|cpi|fomc|pib/i, 'calendar'],
  [/objectif|plan|cible|taille|position/i, 'target'],
  [/robot|algo|expert|automat|copy|backtest/i, 'robot'],
  [/équilibre|offre|demande|ratio|compar/i, 'scale'],
  [/volatil|scalping|rapide|news|cassure|breakout/i, 'lightning'],
];
const ORDER = Object.keys(P);
export const iconFor = (label: string, i: number) => RULES.find(([r]) => r.test(label))?.[1] ?? ORDER[i % ORDER.length];

export const Icon: React.FC<{name: string; at: number; size?: number; color: string; opacity?: number}> = ({name, at, size = 90, color, opacity = 1}) => {
  const f = useCurrentFrame();
  const d = interpolate(f, [at, at + 40], [1, 0], clamp);
  const breathe = 1 + 0.03 * Math.sin((f - at) / 30);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{opacity, transform: `scale(${breathe})`, overflow: 'visible'}}>
      {(P[name] ?? P.chart).map((p, i) => (
        <path key={i} d={p} fill="none" stroke={color} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1}
          strokeDasharray={1} strokeDashoffset={Math.min(1, d + i * 0.08 * d)} />
      ))}
    </svg>
  );
};
