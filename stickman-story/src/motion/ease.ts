// Frame-driven animation helpers. Every value is a pure function of time in seconds,
// so any frame renders the same whatever order Remotion draws them in.
// Derived from the author's production rig, simplified for this starter. 

export type Ease = (x: number) => number;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const linear: Ease = (x) => x;
export const eIn: Ease = (x) => x * x * x;
export const eOut: Ease = (x) => 1 - Math.pow(1 - x, 3);
export const eInOut: Ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const eSine: Ease = (x) => -(Math.cos(Math.PI * x) - 1) / 2;

/** Progress of t through [a, b], eased and clamped to 0..1. */
export const prog = (t: number, a: number, b: number, ease: Ease = eInOut) => ease(clamp((t - a) / (b - a)));

/** Piecewise keyframes [[time, value], ...] sorted by time. Holds the end values outside the range. */
export function keys(t: number, k: [number, number][], ease: Ease = eInOut): number {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const [t0, v0] = k[i - 1];
      const [t1, v1] = k[i];
      return lerp(v0, v1, ease((t - t0) / (t1 - t0)));
    }
  }
  return k[k.length - 1][1];
}

/** keys() for objects with numeric fields (camera states, poses). Every object in one call shares its times. */
export function keysObj<T extends Record<string, number>>(t: number, k: [number, T][], ease: Ease = eInOut): T {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const [t0, a] = k[i - 1];
      const [t1, b] = k[i];
      const e = ease((t - t0) / (t1 - t0));
      const out = {} as Record<string, number>;
      for (const key of Object.keys(b)) out[key] = lerp(a[key] ?? b[key], b[key], e);
      return out as T;
    }
  }
  return k[k.length - 1][1];
}

/**
 * Smooth path through keyframes with monotone tangents: it does not stop at every key, and it never overshoots.
 * Two equal keys make an exact hold. Use log=true for zoom so equal times give equal perceived zoom speed.
 */
export function spline(t: number, k: [number, number][], log = false): number {
  const f = (v: number) => (log ? Math.log(v) : v);
  const inv = (v: number) => (log ? Math.exp(v) : v);
  if (t <= k[0][0]) return k[0][1];
  if (t >= k[k.length - 1][0]) return k[k.length - 1][1];
  let i = 1;
  while (t > k[i][0]) i++;
  const [t0, a] = k[i - 1];
  const [t1, b] = k[i];
  const h = t1 - t0;
  const slope = (j: number) => {
    if (j <= 0 || j >= k.length - 1) return 0;
    const d0 = (f(k[j][1]) - f(k[j - 1][1])) / (k[j][0] - k[j - 1][0]);
    const d1 = (f(k[j + 1][1]) - f(k[j][1])) / (k[j + 1][0] - k[j][0]);
    if (d0 * d1 <= 0) return 0;
    return (2 * d0 * d1) / (d0 + d1);
  };
  const m0 = slope(i - 1) * h;
  const m1 = slope(i) * h;
  const s = (t - t0) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  const v = (2 * s3 - 3 * s2 + 1) * f(a) + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * f(b) + (s3 - s2) * m1;
  return inv(v);
}

/** Smooth deterministic noise in roughly -1..1. */
export const noise = (t: number, seed = 0) =>
  Math.sin(t * 1.31 + seed * 12.9898) * 0.5 + Math.sin(t * 2.17 + seed * 78.233) * 0.3 + Math.sin(t * 3.73 + seed * 37.719) * 0.2;

/** Deterministic pseudo-random 0..1 from a number seed. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
