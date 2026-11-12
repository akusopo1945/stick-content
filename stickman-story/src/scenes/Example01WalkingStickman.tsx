import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Floor, FLOOR, Wall} from "../environment/Furniture";
import {keys} from "../motion/ease";
import {CASUAL} from "../rig/looks";
import {idle, STRIDE, walk} from "../rig/poses";
import {Stickman} from "../rig/Stickman";
import {FPS} from "../styles/palette";

/*
 * EXAMPLE 01 — WALKING STICKMAN (5 s)
 * One character walks left to right across a room. The camera follows at half speed, so the wall
 * moves more slowly than the floor (parallax). The walk cycle is driven by distance, so the feet
 * stay planted on the ground.
 */

export const EXAMPLE01_FRAMES = 150;

const SCALE = 1.5;
const START_X = -420;
const END_X = 420;
const WALK_FROM = 15; // frame when the walk starts (standing before that)
const WALK_TO = 135; // frame when the walk ends

const CUES: CaptionCue[] = [{from: WALK_FROM, to: WALK_TO + 15, text: "A stickman walks across the room.", pos: "upper"}];

export const Example01WalkingStickman: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // progress along the walk, 0 before the walk, 1 after it
  const k = keys(frame, [[WALK_FROM, 0], [WALK_TO, 1]], (v) => v);
  const x = START_X + (END_X - START_X) * k;
  const distance = (END_X - START_X) * k;
  const walking = frame >= WALK_FROM && frame < WALK_TO;

  // one stride = STRIDE world units at scale 1; the rig scale multiplies that
  const pose = walking ? walk(distance / (STRIDE * SCALE)) : idle(t);

  // the camera follows the character at half speed
  const cam = {x: x * 0.5, y: 100, zoom: 1, rot: 0};

  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Stickman x={x} y={FLOOR} scale={SCALE} facing={1} pose={pose} look={CASUAL} />
        </Layer>
      </Camera2D>
      <CaptionTrack cues={CUES} />
    </AbsoluteFill>
  );
};
