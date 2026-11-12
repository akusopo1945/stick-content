import React from "react";
import {C} from "../styles/palette";

/*
 * Stickman rig: one anatomy for every character. Big round head, clothing-coloured torso and sleeves,
 * round hands, dark trousers, small dark shoes, one outline weight.
 *
 * Local space: origin = ground point between the feet, +x = facing direction, y down (SVG).
 * Angles are degrees. Limb angles are measured from straight down; positive swings forward (+x).
 * Derived from the author's production rig, simplified for this starter. Overhead (TopStickman) removed.
 */

export const RIG = {
  headR: 36,
  torsoW: 66,
  torsoH: 92,
  thigh: 60,
  shin: 58,
  legW: 20,
  upper: 50,
  fore: 46,
  armW: 17,
  handR: 10,
  outline: 3,
};

export type Expr = "neutral" | "happy" | "surprised" | "worried" | "focused" | "determined" | "calm" | "shout" | "smug" | "sad";

export type Pose = {
  hipL: number; kneeL: number; hipR: number; kneeR: number;
  shL: number; elL: number; shR: number; elR: number;
  lean: number;      // torso tilt, + = forward
  headTilt: number;  // + = nod forward
  look: number;      // -1..1 eyes/face shift (toward +x when facing right)
  lookY: number;     // -1..1 eyes up/down
  bob: number;       // extra vertical offset of the body (px, - = up)
  blink: number;     // 0 open .. 1 closed
};

export const NEUTRAL: Pose = {
  hipL: 0, kneeL: 0, hipR: 0, kneeR: 0,
  shL: -6, elL: 6, shR: 6, elR: 6,
  lean: 0, headTilt: 0, look: 0, lookY: 0, bob: 0, blink: 0,
};

/** A hand prop receives the absolute angle of the forearm so it can stay upright. */
export type HandProp = (abs: number) => React.ReactNode;

export type Look = {
  top: string;                 // shirt colour
  sleeve?: string;
  trousers?: string;
  shoe?: string;
  skin?: string;
  build?: number;              // torso width multiplier (1 = standard, 1.18 = heavier)
  coat?: string;               // open jacket or coat over the torso
  tie?: string;
  belt?: string;
  hat?: "none" | "cap" | "beanie" | "helmet";
  hatColor?: string;
  headBack?: React.ReactNode;  // behind the head (long hair), head frame
  headExtra?: React.ReactNode; // over the face (hair fringe, glasses), head frame
  back?: React.ReactNode;      // behind the torso, torso frame
  chest?: React.ReactNode;     // on the torso, torso frame, origin = chest centre
  handR?: HandProp;
  handL?: HandProp;
  lower?: React.ReactNode;     // drawn over the legs, root frame
  hideLegs?: boolean;
  noShadow?: boolean;
};

type Props = {
  x: number;
  y: number;
  scale?: number;
  facing?: number;  // 1 right, -1 left
  pose?: Partial<Pose>;
  look: Look;
  expr?: Expr;
  opacity?: number;
  /**
   * "feet" (default): (x, y) is the ground point; hip height comes from the leg angles.
   * "hip": (x, y) is the pelvis (use with seatedAnchor); footL/footR plant the feet.
   */
  anchor?: "feet" | "hip";
  /** World-space IK targets. Feet: shoe contact points. Reach: hand centres (keyboard, handle). */
  footL?: Pt;
  footR?: Pt;
  reachL?: Pt;
  reachR?: Pt;
};

export type Pt = {x: number; y: number};

const rad = (d: number) => (d * Math.PI) / 180;
const degOf = (r: number) => (r * 180) / Math.PI;

/**
 * Two-bone IK in rig space (y down). Angles follow the rig convention: 0 = straight down, + = toward +x.
 * bend = +1 puts the middle joint on the +x side (knees), -1 on the -x/down side (elbows reaching forward).
 * Returns [rootAngle, midBend] where midBend is the rig's knee/elbow value for that limb type.
 */
export const ik2 = (dx: number, dy: number, l1: number, l2: number, bend: 1 | -1): [number, number] => {
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const phi = degOf(Math.atan2(dx, dy));
  const a = degOf(Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const b = degOf(Math.acos((l2 * l2 + d * d - l1 * l1) / (2 * l2 * d)));
  return bend > 0 ? [phi + a, a + b] : [phi - a, a + b];
};

/** Capsule limb with an ink outline: thick ink line under a coloured line. */
const Limb: React.FC<{len: number; w: number; color: string}> = ({len, w, color}) => (
  <>
    <line x1={0} y1={0} x2={0} y2={len} stroke={C.ink} strokeWidth={w + RIG.outline * 2} strokeLinecap="round" />
    <line x1={0} y1={0} x2={0} y2={len} stroke={color} strokeWidth={w} strokeLinecap="round" />
  </>
);

const Face: React.FC<{expr: Expr; look: number; lookY: number; blink: number}> = ({expr, look, lookY, blink}) => {
  const fx = look * 9;
  const fy = lookY * 5;
  const eyeY = -3 + fy;
  const closed = blink > 0.5 || expr === "calm";
  const eye = (ex: number) =>
    closed ? (
      <path d={`M ${ex - 4} ${eyeY} Q ${ex} ${eyeY + 3} ${ex + 4} ${eyeY}`} stroke={C.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
    ) : expr === "surprised" || expr === "shout" ? (
      <circle cx={ex} cy={eyeY} r={4.6} fill={C.ink} />
    ) : (
      <circle cx={ex} cy={eyeY} r={3.6} fill={C.ink} />
    );
  const brow = (ex: number, side: -1 | 1) => {
    const y = eyeY - 10;
    switch (expr) {
      // the end at (ex - 6 * side) is the inner end, next to the nose
      case "focused":
      case "determined":
      case "smug":
        return <line x1={ex - 6 * side} y1={y + 3} x2={ex + 5 * side} y2={y - 2} stroke={C.ink} strokeWidth={2.6} strokeLinecap="round" />;
      case "worried":
      case "sad":
        return <line x1={ex - 6 * side} y1={y - 3} x2={ex + 5 * side} y2={y + 2} stroke={C.ink} strokeWidth={2.6} strokeLinecap="round" />;
      case "surprised":
      case "shout":
        return <path d={`M ${ex - 6} ${y - 1} Q ${ex} ${y - 6} ${ex + 6} ${y - 1}`} stroke={C.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />;
      default:
        return null;
    }
  };
  const my = 13 + fy;
  const mouth = (() => {
    switch (expr) {
      case "happy":
        return <path d={`M ${fx - 8} ${my - 2} Q ${fx} ${my + 7} ${fx + 8} ${my - 2}`} stroke={C.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" />;
      case "smug":
        return <path d={`M ${fx - 7} ${my} Q ${fx + 2} ${my + 4} ${fx + 9} ${my - 4}`} stroke={C.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" />;
      case "calm":
        return <path d={`M ${fx - 6} ${my} Q ${fx} ${my + 3} ${fx + 6} ${my}`} stroke={C.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />;
      case "surprised":
        return <ellipse cx={fx} cy={my + 1} rx={5} ry={7} fill={C.ink} />;
      case "shout":
        return <ellipse cx={fx} cy={my + 2} rx={8} ry={10} fill={C.ink} />;
      case "worried":
      case "sad":
        return <path d={`M ${fx - 7} ${my + 3} Q ${fx} ${my - 3} ${fx + 7} ${my + 3}`} stroke={C.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" />;
      case "determined":
      case "focused":
        return <line x1={fx - 7} y1={my} x2={fx + 7} y2={my} stroke={C.ink} strokeWidth={2.8} strokeLinecap="round" />;
      default:
        return <line x1={fx - 5} y1={my} x2={fx + 5} y2={my} stroke={C.ink} strokeWidth={2.6} strokeLinecap="round" />;
    }
  })();
  return (
    <g>
      {eye(fx - 11)}
      {eye(fx + 11)}
      {brow(fx - 11, -1)}
      {brow(fx + 11, 1)}
      {mouth}
    </g>
  );
};

const Hat: React.FC<{kind: Look["hat"]; color: string}> = ({kind, color}) => {
  const r = RIG.headR;
  switch (kind) {
    case "cap":
      return (
        <g>
          <path d={`M ${-r} ${-6} A ${r} ${r} 0 0 1 ${r} ${-6} Z`} fill={color} stroke={C.ink} strokeWidth={RIG.outline} />
          <path d={`M ${r - 6} ${-8} L ${r + 22} ${-4} L ${r - 4} ${0} Z`} fill={color} stroke={C.ink} strokeWidth={RIG.outline} strokeLinejoin="round" />
        </g>
      );
    case "beanie":
      return (
        <g>
          <path d={`M ${-r - 1} ${-14} A ${r + 1} ${r - 2} 0 0 1 ${r + 1} ${-14} Z`} fill={color} stroke={C.ink} strokeWidth={RIG.outline} />
          <rect x={-r - 3} y={-20} width={2 * r + 6} height={11} rx={5} fill={color} stroke={C.ink} strokeWidth={RIG.outline} />
        </g>
      );
    case "helmet":
      return (
        <g>
          <path d={`M ${-r - 4} ${2} A ${r + 4} ${r + 6} 0 0 1 ${r + 4} ${2} Z`} fill={color} stroke={C.ink} strokeWidth={RIG.outline} />
          <rect x={-r - 6} y={-2} width={2 * r + 12} height={8} rx={3} fill={color} stroke={C.ink} strokeWidth={RIG.outline} />
        </g>
      );
    default:
      return null;
  }
};

export const Stickman: React.FC<Props> = ({x, y, scale = 1, facing = 1, pose: pp, look, expr = "neutral", opacity = 1, anchor = "feet", footL, footR, reachL, reachR}) => {
  const p: Pose = {...NEUTRAL, ...pp};
  const build = look.build ?? 1;
  const tw = RIG.torsoW * build;
  const skin = look.skin ?? C.bone;
  const sleeve = look.sleeve ?? look.top;
  const trousers = look.trousers ?? C.trousers;
  const shoe = look.shoe ?? C.shoe;

  // world -> rig space (rig space is unscaled and always faces +x)
  const toRig = (q: Pt): Pt => ({x: (q.x - x) / (scale * (facing || 1)), y: (q.y - y) / scale});

  let hipY: number;
  if (anchor === "hip") {
    hipY = p.bob;
  } else {
    // hip height comes from whichever leg reaches lowest (the stance leg), so feet stay on the ground
    const legExt = (h: number, k: number) => RIG.thigh * Math.cos(rad(h)) + RIG.shin * Math.cos(rad(h - k));
    hipY = -Math.max(legExt(p.hipL, p.kneeL), legExt(p.hipR, p.kneeR)) + p.bob;
  }

  // leg IK: plant shoes on their targets (the shoe contact point sits ~7 units below the ankle)
  const legHipX = (side: -1 | 1) => side * 11 * build;
  const solveLeg = (side: -1 | 1, target?: Pt) => {
    if (!target) return;
    const r = toRig(target);
    const [h, k] = ik2(r.x - legHipX(side) - 7, r.y - 7 - hipY, RIG.thigh, RIG.shin, 1);
    if (side < 0) {
      p.hipL = h;
      p.kneeL = k;
    } else {
      p.hipR = h;
      p.kneeR = k;
    }
  };
  solveLeg(-1, footL);
  solveLeg(1, footR);

  // arm IK: hands reach world targets; solved in the (leaning) torso frame
  const shY0 = -RIG.torsoH + 16;
  const solveArm = (side: -1 | 1, target?: Pt) => {
    if (!target) return;
    const r = toRig(target);
    const lr = rad(p.lean);
    const sx = side * (tw / 2 - 7);
    const shX = sx * Math.cos(lr) - shY0 * Math.sin(lr);
    const shYw = hipY + sx * Math.sin(lr) + shY0 * Math.cos(lr);
    const vx = r.x - shX;
    const vy = r.y - shYw;
    const tx = vx * Math.cos(-lr) - vy * Math.sin(-lr);
    const ty = vx * Math.sin(-lr) + vy * Math.cos(-lr);
    const [s, e] = ik2(tx, ty, RIG.upper, RIG.fore + RIG.handR * 0.2, -1);
    if (side < 0) {
      p.shL = s;
      p.elL = e;
    } else {
      p.shR = s;
      p.elR = e;
    }
  };
  solveArm(-1, reachL);
  solveArm(1, reachR);

  // shadow sits on the floor under the feet (or under the anchor when standing)
  const shadowY = footL || footR ? toRig(footR ?? footL!).y : anchor === "hip" ? hipY + RIG.thigh + RIG.shin : 0;

  const leg = (h: number, k: number, dx: number, key: string) => (
    <g key={key} transform={`translate(${dx} ${hipY}) rotate(${-h})`}>
      <Limb len={RIG.thigh} w={RIG.legW} color={trousers} />
      <g transform={`translate(0 ${RIG.thigh}) rotate(${k})`}>
        <Limb len={RIG.shin} w={RIG.legW} color={trousers} />
        <g transform={`translate(0 ${RIG.shin}) rotate(${h - k})`}>
          <ellipse cx={7} cy={3} rx={15} ry={7} fill={shoe} stroke={C.ink} strokeWidth={2} />
        </g>
      </g>
    </g>
  );

  const shY = -RIG.torsoH + 16;
  const arm = (sh: number, el: number, side: -1 | 1, prop: HandProp | undefined, key: string) => (
    <g key={key} transform={`translate(${side * (tw / 2 - 7)} ${shY}) rotate(${-sh})`}>
      <Limb len={RIG.upper} w={RIG.armW * Math.min(build, 1.1)} color={sleeve} />
      <g transform={`translate(0 ${RIG.upper}) rotate(${-el})`}>
        <Limb len={RIG.fore} w={RIG.armW * Math.min(build, 1.1)} color={sleeve} />
        <g transform={`translate(0 ${RIG.fore})`}>
          {prop ? <g transform={`rotate(${sh + el - p.lean})`}>{prop(sh + el - p.lean)}</g> : null}
          <circle r={RIG.handR} fill={skin} stroke={C.ink} strokeWidth={RIG.outline} />
        </g>
      </g>
    </g>
  );

  const headY = -RIG.torsoH - RIG.headR + 14;
  const head = (
    <g transform={`translate(0 ${-RIG.torsoH + 4}) rotate(${p.headTilt}) translate(0 ${headY + RIG.torsoH - 4})`}>
      {look.headBack}
      <circle r={RIG.headR} fill={skin} stroke={C.ink} strokeWidth={RIG.outline} />
      <Face expr={expr} look={p.look} lookY={p.lookY} blink={p.blink} />
      {look.headExtra}
      {look.hat && look.hat !== "none" ? <Hat kind={look.hat} color={look.hatColor ?? C.olive} /> : null}
    </g>
  );

  const torso = (
    <g>
      <rect x={-tw / 2} y={-RIG.torsoH} width={tw} height={RIG.torsoH + 8} rx={12} fill={look.top} stroke={C.ink} strokeWidth={RIG.outline} />
      {look.coat ? (
        <g>
          <path d={`M ${-tw / 2} ${-RIG.torsoH + 10} Q ${-tw / 2} ${-RIG.torsoH} ${-tw / 2 + 12} ${-RIG.torsoH} L ${-6} ${-RIG.torsoH} L ${-4} ${18} L ${-tw / 2} ${18} Z`} fill={look.coat} stroke={C.ink} strokeWidth={RIG.outline} strokeLinejoin="round" />
          <path d={`M ${tw / 2} ${-RIG.torsoH + 10} Q ${tw / 2} ${-RIG.torsoH} ${tw / 2 - 12} ${-RIG.torsoH} L ${6} ${-RIG.torsoH} L ${4} ${18} L ${tw / 2} ${18} Z`} fill={look.coat} stroke={C.ink} strokeWidth={RIG.outline} strokeLinejoin="round" />
        </g>
      ) : null}
      {look.tie ? (
        <g>
          <path d={`M -9 ${-RIG.torsoH} L 0 ${-RIG.torsoH + 10} L 9 ${-RIG.torsoH} Z`} fill={C.bone} />
          <path d={`M -4 ${-RIG.torsoH + 8} L 4 ${-RIG.torsoH + 8} L 6 ${-30} L 0 ${-22} L -6 ${-30} Z`} fill={look.tie} stroke={C.ink} strokeWidth={1.6} />
        </g>
      ) : null}
      {look.belt ? <rect x={-tw / 2 + 1} y={-6} width={tw - 2} height={8} fill={look.belt} /> : null}
      {look.chest ? <g transform={`translate(${tw * 0.2} ${-RIG.torsoH * 0.62})`}>{look.chest}</g> : null}
    </g>
  );

  return (
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`} opacity={opacity}>
      {look.noShadow ? null : <ellipse cx={anchor === "hip" ? 40 : 0} cy={shadowY + 4} rx={46 * build} ry={8} fill={C.ink} opacity={0.35} />}
      {look.hideLegs ? null : [leg(p.hipL, p.kneeL, -11 * build, "lL"), leg(p.hipR, p.kneeR, 11 * build, "lR")]}
      <g transform={`translate(0 ${hipY}) rotate(${p.lean})`}>
        {look.back}
        {arm(p.shL, p.elL, -1, look.handL, "aL")}
        {torso}
        {head}
        {arm(p.shR, p.elR, 1, look.handR, "aR")}
      </g>
      {look.lower}
    </g>
  );
};
