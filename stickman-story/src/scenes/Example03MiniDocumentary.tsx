import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Board, Floor, FLOOR, Glow, Label, Wall} from "../environment/Furniture";
import {Narration} from "../audio/Narration";
import {eInOut, eOut, keysObj, prog} from "../motion/ease";
import {CASUAL, JACKET_BLUE} from "../rig/looks";
import {idle, point} from "../rig/poses";
import {Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";

/*
 * EXAMPLE 03 — MINI DOCUMENTARY (11 s, three scenes)
 *   Scene 1 (0-3 s)    Introduce the character.
 *   Scene 2 (3-7 s)    The character points at a board while the camera pushes in.
 *   Scene 3 (7-11 s)   An explanatory diagram: Input -> Process -> Output, drawn step by step.
 * Pass `narration` (a file under public/, e.g. "audio/my-narration.mp3") to add your own voice.
 * The scene lengths are fixed in frames here, so retime them to your narration if you add one.
 */

export const EXAMPLE03_FRAMES = 330;
const SCENE1 = {from: 0, len: 90};
const SCENE2 = {from: 90, len: 120};
const SCENE3 = {from: 210, len: 120};

const SCALE = 1.5;

const CAPTIONS: CaptionCue[] = [
  {from: 10, to: 80, text: "Meet our stickman.", pos: "lower"},
  {from: 100, to: 200, text: "Here is the first idea.", pos: "lower"},
  {from: 225, to: 325, text: "Input, process, output.", pos: "lower"},
];

/** Scene 1: a single character introduced in the middle of the frame. */
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.2, rot: 0}],
    [SCENE1.len, {x: 0, y: 120, zoom: 1.2, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Stickman x={0} y={FLOOR} scale={SCALE} facing={1} pose={idle(t)} look={CASUAL} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 2: the character points at a board. The camera pushes in slowly. */
const Pointing: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const k = prog(frame, 6, 30, eOut);
  const cam = keysObj(frame, [
    [0, {x: 80, y: 180, zoom: 1, rot: 0}],
    [SCENE2.len, {x: 80, y: 180, zoom: 1.3, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Board x={-200} y={FLOOR - 120} w={400} h={260}>
            <Label x={200} y={70} text="IDEA" size={44} color={C.ink} />
          </Board>
          <Stickman x={150} y={FLOOR} scale={SCALE} facing={-1} pose={point(idle(t), k)} look={JACKET_BLUE} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 3: an explanatory diagram drawn one step at a time. */
const Explain: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const steps = ["Input", "Process", "Output"];
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.1, rot: 0}],
    [SCENE3.len, {x: 0, y: 120, zoom: 1.1, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-200} r={420} color={C.cyan} opacity={0.12} />
          <g>
            {steps.map((label, i) => {
              const bx = -330 + i * 330;
              const appear = prog(frame, 10 + i * 18, 28 + i * 18, eInOut);
              return (
                <g key={label} opacity={appear}>
                  <rect x={bx - 110} y={-260} width={220} height={130} rx={16} fill={C.charcoal} stroke={C.yellow} strokeWidth={5} />
                  <Label x={bx} y={-180} text={label} size={44} color={C.bone} />
                  {i < steps.length - 1 ? <line x1={bx + 120} y1={-195} x2={bx + 200} y2={-195} stroke={C.bone} strokeWidth={6} /> : null}
                </g>
              );
            })}
          </g>
          <Stickman x={-180} y={FLOOR} scale={SCALE} facing={1} pose={idle(t)} look={CASUAL} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

export const Example03MiniDocumentary: React.FC<{narration?: string}> = ({narration}) => (
  <AbsoluteFill>
    <Sequence from={SCENE1.from} durationInFrames={SCENE1.len}>
      <Intro />
    </Sequence>
    <Sequence from={SCENE2.from} durationInFrames={SCENE2.len}>
      <Pointing />
    </Sequence>
    <Sequence from={SCENE3.from} durationInFrames={SCENE3.len}>
      <Explain />
    </Sequence>
    <CaptionTrack cues={CAPTIONS} />
    <Narration file={narration} />
  </AbsoluteFill>
);
