import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Board, Floor, FLOOR, Glow, Label, Wall} from "../environment/Furniture";
import {Narration} from "../audio/Narration";
import {clamp, eOut, keysObj, lerp, noise, prog} from "../motion/ease";
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import {idle, point} from "../rig/poses";
import {Expr, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";

/*
 * StoryEngine — renderer generik untuk script JSON.
 * Tiap scene punya "type" yg map ke template komponen (REUSE -> RESKIN -> NEW).
 *
 * Sentuhan premium:
 *  - Kamera dinamis: push-in + handheld drift per scene.
 *  - Transisi "push": tiap scene fade + scale/translate overlap -> parallax, plus sapuan cahaya.
 *  - Partikel background melayang (energi).
 *  - Hook/Ending "?" animasi: bounce + echo ring + glow pulse.
 *  - ProKontra box: bounce (easeOutBack) + flash saat muncul.
 *  - Caption karaoke (word highlight) via CaptionTrack.
 */

const SCALE = 1.5;
const LOOKS: Record<string, typeof CASUAL> = {casual: CASUAL, blue: JACKET_BLUE, orange: SHIRT_ORANGE};
const easeOutBack = (x: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export type SceneSpec = {
  id: string;
  type: string;
  audio?: string;
  captions?: string[];
  from: number;
  len: number;
  cues?: CaptionCue[];
  board?: string[];
  labels?: string[];
  pro?: string;
  kontra?: string;
  accent?: string[];
  look?: string;
  expr?: Expr;
  glow?: string;
  bg?: string;
  // --- dipakai KoranEngine (editorial) ---
  kicker?: string;
  headline?: string[];      // pakai *kata* untuk aksen merah
  deck?: string;
  note?: string;
  stats?: {value: string; label: string}[];
  cols?: {title: string; body: string}[];
  proBody?: string[];
  kontraBody?: string[];
  quote?: string[];
  stamp?: string;
};

export type StoryScript = {
  title: string;
  compositionId: string;
  voice?: string;
  fade?: number;
  total: number;
  scenes: SceneSpec[];
};

// ---- camera helper: agresif in/out + tilt wobble ----
const camAt = (f: number, len: number, z0: number, z1: number) =>
  keysObj(f, [
    [0, {x: 0, y: 120, zoom: z0, rot: 0}],
    [Math.round(len * 0.28), {x: 0, y: 120, zoom: Math.min(1.5, Math.max(z0, z1) + 0.18), rot: 1.5}],
    [Math.round(len * 0.62), {x: 0, y: 120, zoom: Math.min(z0, z1) - 0.08, rot: -1.5}],
    [len, {x: 0, y: 120, zoom: z1, rot: 0}],
  ]);

// ---- transition: push + shine ----
const Fade: React.FC<{len: number; fade: number; children: React.ReactNode}> = ({len, fade, children}) => {
  const f = useCurrentFrame();
  const kIn = interpolate(f, [0, fade], [0, 1], {extrapolateRight: "clamp"});
  const kOut = interpolate(f, [len, len + fade], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const k = Math.min(kIn, kOut);
  let scale = 1, ty = 0;
  if (f < fade) {
    const p = eOut(kIn);
    scale = lerp(1.1, 1, p);       // scale-up masuk: aman (>=1, tak expose edge)
    ty = lerp(36, 0, p);
  } else if (f > len) {
    const p = 1 - kOut;
    scale = lerp(1, 1.05, p);      // exit scale-up tipis, jangan <1 (hindari strip hitam)
    ty = lerp(0, -20, p);
  }
  return (
    <AbsoluteFill style={{opacity: k, transform: `translateY(${ty}px) scale(${scale})`, transformOrigin: "50% 50%"}}>
      {children}
      {f < fade && (
        <div style={{position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none"}}>
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: `${lerp(-70, 130, eOut(kIn))}%`,
              width: "45%",
              height: "200%",
              transform: "rotate(18deg)",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent)",
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- background particles ----
const Particles: React.FC<{t: number; color?: string}> = ({t, color = C.cyan}) => {
  const N = 16;
  const dots = [];
  for (let i = 0; i < N; i++) {
    const x = noise(t * 0.2 + i * 1.7, i) * 540;
    const y = -360 + noise(t * 0.15 + i * 2.3, i + 3) * 320;
    const r = 2 + Math.abs(noise(t * 0.1 + i, i + 9)) * 3;
    const op = 0.1 + 0.12 * Math.abs(noise(t * 0.3 + i, i + 5));
    dots.push(<circle key={i} cx={x} cy={y} r={r} fill={color} opacity={op} />);
  }
  return <Layer depth={0.6}>{dots}</Layer>;
};

// ---- room ----
const Room: React.FC<{bg?: string; glow?: string; children: React.ReactNode}> = ({bg = C.night, glow = C.cyan, children}) => {
  const t = useCurrentFrame() / FPS;
  const pulse = 0.08 + Math.sin(t * 1.6) * 0.03;
  return (
    <>
      <Layer depth={0.5}>
        <Wall x0={-1400} x1={1400} y0={-2400} y1={FLOOR} />
      </Layer>
      <Particles t={t} color={glow} />
      <Layer depth={1}>
        <Floor x0={-1400} x1={1400} />
        <Glow x={0} y={-200} r={460} color={glow} opacity={pulse} />
        {children}
      </Layer>
    </>
  );
};

// ---- animated question mark (hook + ending) ----
const QMark: React.FC<{t: number; color?: string}> = ({t, color = C.yellow}) => {
  const qScale = 1 + Math.sin(t * 2.2) * 0.05;
  const rings = [0, 1, 2].map((i) => {
    const phase = (t * 0.5 + i * 0.33) % 1;
    const rr = 50 + phase * 190;
    const o = (1 - phase) * 0.22;
    return <circle key={i} cx={0} cy={-380} r={rr} fill="none" stroke={color} strokeWidth={4} opacity={o} />;
  });
  return (
    <>
      {rings}
      <g transform={`translate(0 -380) scale(${qScale})`}>
        <Label x={0} y={0} text="?" size={150} color={color} />
      </g>
    </>
  );
};

// ---- floating accent shapes (upper-area liveliness / anti-monoton) ----
const AccentField: React.FC<{tag: string; t: number; color?: string; count?: number}> = ({tag, t, color = C.cyan, count = 9}) => {
  const shapes = [];
  for (let i = 0; i < count; i++) {
    const sx = noise(t * 0.25 + i * 3.1, i) * 560;
    const sy = -200 - Math.abs(noise(t * 0.2 + i * 2.7, i + 4)) * 420;
    const drift = Math.sin(t * 1.3 + i) * 10;
    const s = 7 + Math.abs(noise(t * 0.4 + i, i + 2)) * 9;
    const op = 0.12 + 0.12 * Math.abs(noise(t * 0.5 + i, i + 7));
    const id = `${tag}-a${i}`;
    let shape: React.ReactNode;
    if (i % 3 === 0) {
      shape = <path d={`M ${sx} ${sy - s} L ${sx + s} ${sy} L ${sx} ${sy + s} L ${sx - s} ${sy} Z`} fill="none" stroke={color} strokeWidth={3} opacity={op} />;
    } else if (i % 3 === 1) {
      shape = <circle cx={sx} cy={sy} r={s * 0.6} fill="none" stroke={color} strokeWidth={3} opacity={op} />;
    } else {
      shape = (
        <g stroke={color} strokeWidth={3} opacity={op} strokeLinecap="round">
          <line x1={sx - s} y1={sy} x2={sx + s} y2={sy} />
          <line x1={sx} y1={sy - s} x2={sx} y2={sy + s} />
        </g>
      );
    }
    shapes.push(<g key={id} transform={`translate(0 ${drift})`}>{shape}</g>);
  }
  return <Layer depth={0.85}>{shapes}</Layer>;
};

// ---- idea burst (mo.js-style sparkle cluster) ----
const IdeaBurst: React.FC<{x: number; y: number; t: number; color?: string; appear: number; spokes?: number}> = ({x, y, t, color = C.yellow, appear, spokes = 8}) => {
  const a = easeOutBack(clamp(appear));
  const burst: React.ReactNode[] = [];
  for (let i = 0; i < spokes; i++) {
    const ang = (i / spokes) * Math.PI * 2;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i);
    const len = (26 + pulse * 20) * a;
    const ex = x + Math.cos(ang) * len;
    const ey = y + Math.sin(ang) * len;
    const op = (0.25 + 0.45 * pulse) * Math.min(1, appear);
    burst.push(<line key={i} x1={x} y1={y} x2={ex} y2={ey} stroke={color} strokeWidth={3} strokeLinecap="round" opacity={op} />);
    burst.push(<circle key={`d${i}`} cx={ex} cy={ey} r={3} fill={color} opacity={op} />);
  }
  const cs = (0.7 + 0.3 * Math.sin(t * 4)) * a;
  burst.push(<circle cx={x} cy={y} r={6 * cs} fill={color} opacity={0.6 * Math.min(1, appear)} />);
  return <>{burst}</>;
};

// ---- draw-in connector arrow (SVG path draw, "flow" cue) ----
const DrawArrow: React.FC<{d: string; color: string; k: number; width?: number; ex: number; ey: number; ea: number}> = ({d, color, k, width = 6, ex, ey, ea}) => {
  const kk = clamp(k);
  const headK = prog(kk, 0.82, 1, eOut);
  const hs = 16;
  return (
    <>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - kk} />
      <g transform={`translate(${ex} ${ey}) rotate(${ea * 180 / Math.PI})`} opacity={headK}>
        <path d={`M 0 0 L ${-hs} ${-hs * 0.6} L ${-hs} ${hs * 0.6} Z`} fill={color} />
      </g>
    </>
  );
};

// ---- floating keyword pill with color-band sweep (kinetic typography) ----
const KeywordPill: React.FC<{x: number; y: number; text: string; color: string; t: number; appear: number}> = ({x, y, text, color, t, appear}) => {
  const a = easeOutBack(clamp(appear));
  const bob = Math.sin(t * 2 + x * 0.01) * 6;
  const w = text.length * 22 + 56;
  const h = 64;
  const sweep = (t % 1.6) / 1.6;
  const sx = -w / 2 + sweep * w;
  const id = `pill-${text.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${a})`} opacity={Math.min(1, appear)} style={{transformOrigin: "0px 0px"}}>
      <defs>
        <clipPath id={id}><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={32} /></clipPath>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={32} fill={C.charcoal} stroke={color} strokeWidth={4} />
      <g clipPath={`url(#${id})`}>
        <rect x={sx - 40} y={-h / 2} width={80} height={h} fill={color} opacity={0.3} />
      </g>
      <Label x={0} y={11} text={text} size={34} color={color} />
    </g>
  );
};

// ---- thought rings above head (idea energy) ----
const ThoughtRings: React.FC<{x: number; y: number; t: number; color?: string}> = ({x, y, t, color = C.yellow}) => {
  const rings = [0, 1, 2].map((i) => {
    const phase = (t * 0.45 + i * 0.33) % 1;
    const rr = 18 + phase * 70;
    const o = (1 - phase) * 0.3;
    return <circle key={i} cx={x} cy={y} r={rr} fill="none" stroke={color} strokeWidth={3} opacity={o} />;
  });
  return <>{rings}</>;
};

// ---- scene templates ----
const HookScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camAt(f, s.len, 1.1, 1.34);
  return (
    <Camera2D cam={cam} t={t} handheld={0.45}>
      <Room glow={C.yellow}>
        <QMark t={t} color={C.yellow} />
        <Stickman x={0} y={FLOOR} scale={SCALE} facing={1} pose={idle(t)} look={CASUAL} expr={s.expr ?? "worried"} />
      </Room>
    </Camera2D>
  );
};

const ExplainScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camAt(f, s.len, 0.98, 1.3);
  const k = prog(f, 6, 40, eOut);
  const look = LOOKS[s.look ?? "blue"] ?? JACKET_BLUE;
  const lines = s.board ?? [];
  const boardPop = easeOutBack(prog(f, 0, 26, eOut));
  const accents = s.accent ?? [];
  return (
    <Camera2D cam={cam} t={t} handheld={0.4}>
      <Room glow={C.cyan}>
        <g transform={`translate(-200 ${FLOOR - 130}) scale(${boardPop})`} style={{transformOrigin: "0px 150px"}}>
          <Board x={0} y={0} w={440} h={300}>
            {lines.map((ln, i) => (
              <Label key={i} x={220} y={70 + i * 55} text={ln} size={ln === "+" ? 44 : 40} color={ln === "+" ? C.orange : C.ink} />
            ))}
          </Board>
        </g>
        <IdeaBurst x={-200} y={120} t={t} color={C.cyan} appear={prog(f, 4, 30, eOut)} />
        <ThoughtRings x={200} y={-300} t={t} color={C.yellow} />
        {accents.map((ac, i) => (
          <KeywordPill key={i} x={200} y={-470 - i * 86} text={ac} color={C.yellow} t={t} appear={prog(f, 16 + i * 28, 16 + i * 28 + 26, eOut)} />
        ))}
        <DrawArrow d="M -200 120 C -120 -120 120 -260 200 -470" color={C.yellow} k={prog(f, 18, 70, eOut)} ex={200} ey={-470} ea={-1.13} />
        <Stickman x={200} y={FLOOR} scale={SCALE} facing={-1} pose={point(idle(t), k)} look={look} expr={s.expr ?? "focused"} />
      </Room>
      <AccentField tag="ex" t={t} color={C.cyan} />
    </Camera2D>
  );
};

const CausesScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camAt(f, s.len, 1.02, 1.24);
  const labels = s.labels ?? ["?", "?", "?"];
  const xs = [-300, 0, 300];
  return (
    <Camera2D cam={cam} t={t} handheld={0.42}>
      <Room glow={C.cyan}>
        {labels.map((lb, i) => {
          const pop = easeOutBack(prog(f, i * 6, i * 6 + 22, eOut));
          return (
            <g key={i} transform={`translate(${xs[i] ?? 0} -340) scale(${pop})`} style={{transformOrigin: "0px 0px"}}>
              <Label x={0} y={0} text={lb} size={52} color={C.bone} />
            </g>
          );
        })}
        {labels.map((_, i) => (
          <IdeaBurst key={`b${i}`} x={xs[i] ?? 0} y={-340} t={t} color={C.yellow} appear={prog(f, i * 6, i * 6 + 22, eOut)} />
        ))}
        <DrawArrow d="M -300 -295 Q -150 -282 0 -295" color={C.cyan} k={prog(f, 14, 46, eOut)} ex={0} ey={-295} ea={-0.09} />
        <DrawArrow d="M 0 -295 Q 150 -282 300 -295" color={C.cyan} k={prog(f, 40, 72, eOut)} ex={300} ey={-295} ea={-0.09} />
        <Stickman x={-170} y={FLOOR} scale={SCALE} facing={1} pose={idle(t)} look={JACKET_BLUE} expr={s.expr ?? "focused"} />
        <Stickman x={170} y={FLOOR} scale={SCALE} facing={-1} pose={idle(t)} look={CASUAL} expr="worried" />
      </Room>
      <AccentField tag="ca" t={t} color={C.cyan} />
    </Camera2D>
  );
};

const ProKontraScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  // kamera center + zoom agresif (wide shot: dua stickman tetap muat di frame)
  const cam = camAt(f, s.len, 0.95, 1.04);
  const boxes = [
    {bx: -300, title: "PRO", sub: s.pro ?? "LELUASA", color: C.yellow, at: 10},
    {bx: 300, title: "KONTRA", sub: s.kontra ?? "DPR KUAT", color: C.red, at: 60},
  ];
  const leanL = Math.sin(t * 4) * 10;          // argumen bergantian
  const leanR = Math.sin(t * 4 + Math.PI) * 10;
  const exprL = Math.sin(t * 4) > 0 ? "determined" : "focused";
  return (
    <Camera2D cam={cam} t={t} handheld={0.5}>
      <Room glow={C.cyan}>
        {boxes.map((b) => {
          const appear = prog(f, b.at, b.at + 22, eOut);
          const bounce = easeOutBack(appear);
          const flash = (1 - appear) * 0.5;
          return (
            <g key={b.title} transform={`translate(${b.bx} -190) scale(${bounce})`} style={{transformOrigin: "0px 0px"}} opacity={appear}>
              <rect x={-150} y={-110} width={300} height={220} rx={18} fill={C.charcoal} stroke={b.color} strokeWidth={6} />
              <rect x={-150} y={-110} width={300} height={220} rx={18} fill={b.color} opacity={flash} />
              <Label x={0} y={-20} text={b.title} size={56} color={b.color} />
              <Label x={0} y={50} text={b.sub} size={40} color={C.bone} />
              <IdeaBurst x={0} y={-110} t={t} color={b.color} appear={appear} />
            </g>
          );
        })}
        <DrawArrow d="M -300 -310 Q 0 -425 300 -310" color={C.yellow} k={prog(f, 70, 110, eOut)} ex={300} ey={-310} ea={0.35} />
        <KeywordPill x={0} y={-490} text="VS" color={C.red} t={t} appear={prog(f, 30, 60, eOut)} />
        <Stickman x={-410} y={FLOOR} scale={SCALE} facing={1} pose={{...idle(t), lean: 8 + leanL}} look={JACKET_BLUE} expr={exprL} />
        <Stickman x={410} y={FLOOR} scale={SCALE} facing={-1} pose={{...idle(t), lean: 8 + leanR}} look={CASUAL} expr="worried" />
      </Room>
      <AccentField tag="pk" t={t} color={C.cyan} />
    </Camera2D>
  );
};

const EndingScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camAt(f, s.len, 1.1, 1.32);
  return (
    <Camera2D cam={cam} t={t} handheld={0.45}>
      <Room glow={C.yellow}>
        <QMark t={t} color={C.yellow} />
        <Stickman x={0} y={FLOOR} scale={SCALE} facing={1} pose={idle(t)} look={CASUAL} expr={s.expr ?? "neutral"} />
      </Room>
    </Camera2D>
  );
};

const DiagramScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camAt(f, s.len, 0.95, 1.15);
  const node = (x: number, label: string, i: number) => {
    const pop = easeOutBack(prog(f, i * 8, i * 8 + 20, eOut));
    return (
      <g key={x} transform={`translate(${x} 0) scale(${pop})`} style={{transformOrigin: "0px -205px"}}>
        <rect x={-110} y={-260} width={220} height={110} rx={14} fill={C.charcoal} stroke={C.cyan} strokeWidth={5} />
        <Label x={0} y={-195} text={label} size={30} color={C.bone} />
      </g>
    );
  };
  return (
    <Camera2D cam={cam} t={t} handheld={0.4}>
      <Room glow={C.cyan}>
        {node(-340, "DATA", 0)}
        {node(0, "MODEL", 1)}
        {node(340, "KEPUTUSAN", 2)}
        <Label x={-170} y={-200} text=">" size={40} color={C.cyan} />
        <Label x={170} y={-200} text=">" size={40} color={C.cyan} />
        <Stickman x={0} y={FLOOR} scale={SCALE} facing={1} pose={idle(t)} look={JACKET_BLUE} expr="focused" />
      </Room>
    </Camera2D>
  );
};

const TYPES: Record<string, React.FC<{s: SceneSpec}>> = {
  hook: HookScene,
  explain: ExplainScene,
  causes: CausesScene,
  prokontra: ProKontraScene,
  ending: EndingScene,
  diagram: DiagramScene,
};

export const StoryEngine: React.FC<{script: StoryScript; narration?: string}> = ({script, narration}) => {
  const fade = script.fade ?? 12;
  const cues: CaptionCue[] = script.scenes.flatMap((s) => s.cues ?? []);
  return (
    <AbsoluteFill>
      {script.scenes.map((s) => {
        const Comp = TYPES[s.type] ?? HookScene;
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.len + fade}>
            <Fade len={s.len} fade={fade}>
              <Comp s={s} />
            </Fade>
          </Sequence>
        );
      })}
      <CaptionTrack cues={cues} />
      <Narration file={narration} />
    </AbsoluteFill>
  );
};
