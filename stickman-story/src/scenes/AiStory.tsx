import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Board, Floor, FLOOR, Glow, Label, Wall} from "../environment/Furniture";
import {Narration} from "../audio/Narration";
import {eInOut, eOut, keysObj, prog} from "../motion/ease";
import {CASUAL, JACKET_BLUE} from "../rig/looks";
import {cheer, idle, point} from "../rig/poses";
import {Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";

/*
 * AI STORY — custom mini documentary (id: "AiStory")
 *   Scene 1 (0-164)    Perkenalan: stickman menyapa.
 *   Scene 2 (164-435)  Penjelasan: stickman menunjuk papan "Belajar dari Data".
 *   Scene 3 (435-768)  Diagram: Data -> Model -> Keputusan, digambar bertahap.
 * Narasi Bahasa Indonesia di-public/audio/narration.mp3 (Google TTS / gTTS).
 * Timing caption dihitung persis dari durasi narasi.
 */

export const AISTORY_FRAMES = 768;
const S1 = {from: 0, len: 164};
const S2 = {from: 164, len: 271};
const S3 = {from: 435, len: 333};

const SCALE = 1.5;

// Caption absolut (CaptionTrack di-root, frame komposisi).
const CAPTIONS: CaptionCue[] = [
  {from: 0, to: 152, text: "Hai! Pernah kepikiran, apa itu kecerdasan buatan?", pos: "lower"},
  {from: 164, to: 299, text: "AI adalah mesin yang belajar dari ribuan contoh data.", pos: "lower"},
  {from: 302, to: 422, text: "Sama seperti kita yang belajar dari pengalaman.", pos: "lower"},
  {from: 435, to: 607, text: "Data masuk, dilatih jadi model, lalu menghasilkan keputusan.", pos: "lower"},
  {from: 610, to: 755, text: "Sederhana kan? Itu dia, kecerdasan buatan!", pos: "lower"},
];

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.15, rot: 0}],
    [S1.len, {x: 0, y: 120, zoom: 1.15, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-120} r={460} color={C.cyan} opacity={0.1} />
          <Stickman x={0} y={FLOOR} scale={SCALE} facing={1} pose={idle(t)} look={CASUAL} expr="happy" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

const Explain: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const k = prog(frame, 6, 36, eOut);
  const cam = keysObj(frame, [
    [0, {x: 60, y: 180, zoom: 1, rot: 0}],
    [S2.len, {x: 60, y: 180, zoom: 1.3, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Board x={-220} y={FLOOR - 120} w={420} h={280}>
            <Label x={210} y={70} text="BELAJAR" size={46} color={C.ink} />
            <Label x={210} y={130} text="DARI DATA" size={46} color={C.orange} />
          </Board>
          <Stickman x={160} y={FLOOR} scale={SCALE} facing={-1} pose={point(idle(t), k)} look={JACKET_BLUE} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

const Diagram: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const steps = ["Data", "Model", "Keputusan"];
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.1, rot: 0}],
    [S3.len, {x: 0, y: 120, zoom: 1.1, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-200} r={420} color={C.yellow} opacity={0.12} />
          <g>
            {steps.map((label, i) => {
              const bx = -330 + i * 330;
              const appear = prog(frame, 10 + i * 18, 28 + i * 18, eInOut);
              return (
                <g key={label} opacity={appear}>
                  <rect x={bx - 120} y={-260} width={240} height={130} rx={16} fill={C.charcoal} stroke={i === 1 ? C.orange : C.yellow} strokeWidth={5} />
                  <Label x={bx} y={-180} text={label} size={42} color={C.bone} />
                  {i < steps.length - 1 ? <line x1={bx + 130} y1={-195} x2={bx + 200} y2={-195} stroke={C.bone} strokeWidth={6} /> : null}
                </g>
              );
            })}
          </g>
          <Stickman x={-200} y={FLOOR} scale={SCALE} facing={1} pose={frame > 300 ? cheer(t) : idle(t)} look={CASUAL} expr={frame > 300 ? "happy" : "neutral"} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

export const AiStory: React.FC<{narration?: string}> = ({narration}) => (
  <AbsoluteFill>
    <Sequence from={S1.from} durationInFrames={S1.len}>
      <Intro />
    </Sequence>
    <Sequence from={S2.from} durationInFrames={S2.len}>
      <Explain />
    </Sequence>
    <Sequence from={S3.from} durationInFrames={S3.len}>
      <Diagram />
    </Sequence>
    <CaptionTrack cues={CAPTIONS} />
    <Narration file={narration} />
  </AbsoluteFill>
);
