import {NEUTRAL, Pose, RIG} from "./Stickman";
import {clamp, lerp, noise, rand} from "../motion/ease";

// Pose generators. Each returns a full Pose so they can be blended with mix().
// Derived from the author's production rig, simplified for this starter. Gesture poses not used by the examples are left out.

export const mix = (a: Pose, b: Pose, k: number): Pose => {
  const o = {} as Pose;
  (Object.keys(a) as (keyof Pose)[]).forEach((key) => (o[key] = lerp(a[key], b[key], clamp(k))));
  return o;
};

/** Blink: closes for about 0.12 s roughly every 3-5 s, deterministic per seed. */
export const blinkAt = (t: number, seed = 0) => {
  const period = 3.2 + rand(seed) * 1.8;
  const ph = (t + rand(seed + 7) * period) % period;
  return ph < 0.12 ? 1 : 0;
};

/** Standing idle: breathing bob, slight arm sway, occasional blink. */
export const idle = (t: number, seed = 0): Pose => ({
  ...NEUTRAL,
  bob: Math.sin(t * 2.2 + seed) * 1.4,
  shL: -6 + noise(t * 0.6, seed) * 3,
  shR: 6 + noise(t * 0.6, seed + 3) * 3,
  elL: 8,
  elR: 8,
  headTilt: noise(t * 0.4, seed + 5) * 2.5,
  blink: blinkAt(t, seed),
});

/** Ground distance covered by one full walk cycle, so the feet do not skate. Use phase = distance / STRIDE. */
export const STRIDE = 4 * (RIG.thigh + RIG.shin) * Math.sin((24 * Math.PI) / 180) * 0.9;

/** Walk cycle driven by phase (one unit = one stride). */
export const walk = (phase: number, t = 0, seed = 0): Pose => {
  const a = phase * Math.PI * 2;
  const s = Math.sin(a);
  const liftL = Math.max(0, Math.sin(a + Math.PI / 2));
  const liftR = Math.max(0, Math.sin(a - Math.PI / 2));
  return {
    ...NEUTRAL,
    hipL: 24 * s,
    hipR: -24 * s,
    kneeL: 8 + 34 * liftL * (s > 0 ? 1 : 0.4),
    kneeR: 8 + 34 * liftR * (s < 0 ? 1 : 0.4),
    shL: -20 * s,
    shR: 20 * s,
    elL: 14 + 8 * Math.max(0, -s),
    elR: 14 + 8 * Math.max(0, s),
    lean: 4,
    bob: -Math.abs(Math.cos(a)) * 5 + 2,
    blink: blinkAt(t, seed),
  };
};

/** Sitting on a seat at shin height (thighs forward, shins down). Pair with seatedAnchor and anchor="hip". */
export const sit = (t = 0, seed = 0): Pose => ({
  ...idle(t, seed),
  hipL: 88,
  kneeL: 88,
  hipR: 90,
  kneeR: 90,
  lean: 6,
});

/** Typing while seated: forearms forward, alternating finger taps. */
export const typing = (t: number, seed = 0): Pose => ({
  ...sit(t, seed),
  shL: 58 + Math.sin(t * 17) * 3,
  elL: 34,
  shR: 60 + Math.sin(t * 17 + 2) * 3,
  elR: 32,
  lean: 12,
  headTilt: 6,
  look: 0.6,
  lookY: 0.2,
});

/** Pointing forward with the right arm (k 0..1). */
export const point = (base: Pose, k: number, height = 95): Pose => ({
  ...base,
  shR: lerp(base.shR, height, k),
  elR: lerp(base.elR, 4, k),
  look: lerp(base.look, 0.8, k),
});

/** Both arms up (cheer). */
export const cheer = (t: number, seed = 0): Pose => ({
  ...idle(t, seed),
  shL: -160 + Math.sin(t * 8) * 6,
  elL: -10,
  shR: 160 + Math.sin(t * 8 + 1) * 6,
  elR: 10,
  bob: -Math.abs(Math.sin(t * 6)) * 8,
});
