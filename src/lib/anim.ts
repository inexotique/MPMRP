import {Easing, interpolate, spring} from 'remotion';
import {FPS} from '../theme';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Snappy spring with mild overshoot (product-video feel). */
export const pop = (frame: number, start: number, opts: {damping?: number; stiffness?: number; mass?: number} = {}) =>
  spring({frame: frame - start, fps: FPS, config: {damping: 14, stiffness: 140, mass: 0.8, ...opts}});

/** Smooth 0→1 over `dur` frames using expo-out easing. */
export const ease = (frame: number, start: number, dur = 30, e = Easing.bezier(0.16, 1, 0.3, 1)) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: e});

/** Smooth in-out (camera moves). */
export const inOut = (frame: number, start: number, dur = 45) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1)});

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
