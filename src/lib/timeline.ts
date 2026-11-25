export type Seg = {id: string; text: string; file: string; from: number; dur: number};
export type Timing = {id: string; fps: number; total: number; segments: Seg[]};

/** Lookup helper so scenes are written against narration ids, never hard-coded frames. */
export const makeCues = (t: Timing) => {
  const m = Object.fromEntries(t.segments.map((s) => [s.id, s]));
  const at = (id: string, offset = 0) => (m[id] ? m[id].from + offset : 0);
  const end = (id: string, offset = 0) => (m[id] ? m[id].from + m[id].dur + offset : 0);
  return {at, end, seg: (id: string) => m[id]};
};
