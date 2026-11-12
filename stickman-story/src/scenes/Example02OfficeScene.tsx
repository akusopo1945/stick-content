import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Desk, Floor, FLOOR, Monitor, OfficeChair, Wall} from "../environment/Furniture";
import {eInOut, keysObj, lerp, prog} from "../motion/ease";
import {CASUAL, JACKET_BLUE} from "../rig/looks";
import {idle, STRIDE, typing, walk} from "../rig/poses";
import {Stickman, Pt} from "../rig/Stickman";
import {seatedAnchor} from "../rig/seat";
import {C, FPS} from "../styles/palette";

/*
 * EXAMPLE 02 — OFFICE SCENE (12 s)
 * A stickman walks toward a desk, sits in the chair, types, and looks at the monitor.
 * The camera follows the walk, then pushes in on the monitor.
 *   1. 0-3 s    walk in (feet on the ground)
 *   2. 3-4 s    sit down (pelvis and feet move to the seat anchor)
 *   3. 4-10 s   type while the monitor's bars grow
 *   4. camera   push in on the monitor
 */

export const EXAMPLE02_FRAMES = 360;

const SCALE = 1.5;
const CHAIR = {x: -20, floorY: FLOOR, facing: 1 as const, seat: 87};
const SEAT = seatedAnchor(CHAIR, SCALE);
const DESK = {x: 180, w: 440, top: 150};
const MONITOR = {x: 240, y: FLOOR - DESK.top - 38};
const KEYBOARD_Y = FLOOR - DESK.top - 6;

const WALK_START = -680;
const WALK_END = SEAT.hip.x - 40;   // stop a little in front of the seat
const WALK_FRAMES = 90;             // 0-3 s
const SIT_FRAMES = 30;              // 3-4 s
const SIT_AT = WALK_FRAMES + SIT_FRAMES;

// standing hip height: the legs are straight, so the pelvis is one leg length above the ground
const STAND_HIP_Y = FLOOR - (60 + 58) * SCALE;

const CUES: CaptionCue[] = [
  {from: 0, to: 85, text: "The stickman walks to the desk.", pos: "upper"},
  {from: 95, to: 180, text: "Then sits down to work.", pos: "upper"},
  {from: 200, to: 330, text: "The monitor shows the numbers.", pos: "upper"},
];

/** Screen content for the monitor: three bars that grow, in screen-local units (230 x 140). */
const MonitorBars: React.FC<{k: number}> = ({k}) => (
  <g>
    <rect x={0} y={0} width={230} height={140} fill="#0B1B24" />
    <text x={12} y={24} fontSize={16} fill={C.cyan} fontWeight={700}>REPORT</text>
    {[0.82, 0.55, 0.68].map((h, i) => {
      const bh = 80 * h * k;
      return <rect key={i} x={26 + i * 62} y={120 - bh} width={38} height={bh} fill={i === 1 ? C.yellow : C.cyan} opacity={0.85} />;
    })}
  </g>
);

export const Example02OfficeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // ---- body position and pose, by phase ----
  const walkDist = (WALK_END - WALK_START) * prog(frame, 0, WALK_FRAMES, (v) => v);
  const walkX = WALK_START + walkDist;
  const sitE = prog(frame, WALK_FRAMES, SIT_AT, eInOut);
  const seated = frame >= SIT_AT;

  let body: React.ReactNode;
  if (frame < WALK_FRAMES) {
    // standing walk: feet anchored, legs from the walk cycle
    body = <Stickman x={walkX} y={FLOOR} scale={SCALE} facing={1} pose={walk(walkDist / (STRIDE * SCALE), t)} look={CASUAL} />;
  } else if (!seated) {
    // sitting down: pelvis and feet move from the standing spot to the seat anchor
    const hipX = lerp(WALK_END, SEAT.hip.x, sitE);
    const hipY = lerp(STAND_HIP_Y, SEAT.hip.y, sitE);
    const footL: Pt = {x: lerp(WALK_END - 16, SEAT.footL.x, sitE), y: FLOOR};
    const footR: Pt = {x: lerp(WALK_END + 16, SEAT.footR.x, sitE), y: FLOOR};
    body = (
      <Stickman x={hipX} y={hipY} anchor="hip" scale={SCALE} facing={1} pose={idle(t)} look={CASUAL} footL={footL} footR={footR} />
    );
  } else {
    // seated and typing: both hands reach the keyboard (fixed targets, so the motion is deterministic)
    const keyL: Pt = {x: 70, y: KEYBOARD_Y};
    const keyR: Pt = {x: 100, y: KEYBOARD_Y};
    body = (
      <Stickman
        x={SEAT.hip.x}
        y={SEAT.hip.y}
        anchor="hip"
        scale={SCALE}
        facing={1}
        pose={typing(t)}
        look={JACKET_BLUE}
        footL={SEAT.footL}
        footR={SEAT.footR}
        reachL={keyL}
        reachR={keyR}
      />
    );
  }

  // ---- camera: follow the walk, then push in on the monitor ----
  const cam = keysObj(frame, [
    [0, {x: -300, y: 100, zoom: 1, rot: 0}],
    [WALK_FRAMES, {x: -40, y: 100, zoom: 1, rot: 0}],
    [SIT_AT + 30, {x: -40, y: 100, zoom: 1, rot: 0}],
    // frame the character and the monitor together
    [300, {x: (SEAT.hip.x + MONITOR.x) / 2, y: 200, zoom: 1.7, rot: 0}],
  ]);

  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <OfficeChair x={CHAIR.x} y={CHAIR.floorY} facing={CHAIR.facing} seat={CHAIR.seat} />
          <Desk x={DESK.x} w={DESK.w} top={DESK.top} />
          <rect x={40} y={KEYBOARD_Y - 8} width={110} height={8} rx={2} fill={C.steel} stroke={C.ink} strokeWidth={2} />
          <Monitor x={MONITOR.x} y={MONITOR.y} w={230} h={140} screen={<MonitorBars k={prog(frame, SIT_AT + 30, SIT_AT + 150)} />} />
          {body}
        </Layer>
      </Camera2D>
      <CaptionTrack cues={CUES} />
    </AbsoluteFill>
  );
};
