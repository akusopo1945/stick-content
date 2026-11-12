import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {Label} from "../environment/Furniture";
import {Narration} from "../audio/Narration";
import {idle} from "../rig/poses";
import {Expr, Stickman} from "../rig/Stickman";
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import {C, FPS, H, W} from "../styles/palette";
import {eOut, lerp, noise, prog} from "../motion/ease";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {SceneSpec, StoryScript} from "./StoryEngine";
export type {SceneSpec, StoryScript} from "./StoryEngine";

/*
 * ComicEngine — gaya KOMIK / DOODLE (bukan cinematic).
 *  - Latar kertas cream + grid titik, bingkai panel tinta.
 *  - Efek "sketch boil": stickman getar dikit tiap frame (garis mendidih ala komik).
 *  - Action-lines, balon pikir "?", ledakan "VS", puff marah, balon bicara caption.
 *  - Transisi: wipe warna ala panel komik.
 * Dipakai lewat field "engine":"ComicEngine" di script (Wapres tetap pakai StoryEngine).
 */

const PAPER = "#FBF1DC";
const INK = C.ink;
const CRED = "#E23B2E";
const CBLU = "#2D6CC0";
const CYEL = "#F4C430";

const CX = W / 2;          // tengah frame horizontal (1080 -> 540)
// Baseline kaki: harus DI ATAS balon caption (POS_Y.lower = 1380), kalau tidak kaki ketutup.
const CFLOOR = H - 580;    // 1920 -> 1340
// Skala per scene: satu karakter boleh besar, trio/duel harus lebih kecil biar muat lebar.
const S_ONE = 2.4;         // hook / ending / diagram
const S_EXPLAIN = 2.05;    // penjelas + papan
const S_CAUSES = 1.55;     // tiga karakter sejajar
const S_DUEL = 1.95;       // pro vs kontra

/**
 * Ubun-ubun stickman dalam koordinat frame.
 * Rig: hip = -(thigh 60 + shin 58) = -118, lalu torso 92 + kepala 36 + offset -> total 268 di atas kaki.
 */
const HEAD_TOP = (scale: number) => CFLOOR - 268 * scale;

/*
 * Posisi vertikal balon: tiap komponen punya geometri beda, jadi gap-nya disesuaikan
 * supaya dasar balon (bukan titik referensinya) selalu duduk tepat di atas kepala.
 *   BigQ   : lingkaran r=92 + ekor sampai +100
 *   Thought: rect dari -h sampai +h*0.5, ekor titik sampai +h*0.92
 *   Speech : rect dari -96 sampai +90
 */
const Q_Y = (scale: number) => HEAD_TOP(scale) - 145;
const THOUGHT_Y = (scale: number) => HEAD_TOP(scale) - 145;
const SPEECH_Y = (scale: number) => HEAD_TOP(scale) - 128;

/** Perkecil ukuran font kalau teks lebih lebar dari balon (biar tidak kepotong). */
const fitSize = (text: string, size: number, maxW: number) => {
  const est = text.length * size * 0.56;
  return est <= maxW ? size : Math.max(15, Math.floor((size * maxW) / est));
};

const textW = (s: string, size: number) => s.length * size * 0.56;

/** Bungkus teks jadi beberapa baris supaya muat di balon (greedy wrap per kata). */
const wrap = (text: string, size: number, maxW: number): string[] => {
  const out: string[] = [];
  let cur = "";
  for (const word of text.split(" ")) {
    const next = cur ? `${cur} ${word}` : word;
    if (textW(next, size) <= maxW || !cur) cur = next;
    else {
      out.push(cur);
      cur = word;
    }
  }
  if (cur) out.push(cur);
  return out;
};

/** Pilih ukuran font + baris yang paling pas (maks `maxLines` baris). */
const fitLines = (text: string, maxW: number, maxLines = 2, sizes: number[] = [40, 36, 32, 28, 24, 20]): {size: number; lines: string[]} => {
  for (const s of sizes) {
    const lines = wrap(text, s, maxW);
    if (lines.length <= maxLines) return {size: s, lines};
  }
  const s = sizes[sizes.length - 1];
  return {size: s, lines: wrap(text, s, maxW).slice(0, maxLines)};
};

/** Teks balon multi-baris yang selalu muat. */
const BubbleText: React.FC<{text: string; y: number; maxW: number; color: string; maxLines?: number; lead?: number; sizes?: number[]}> = ({text, y, maxW, color, maxLines = 2, lead, sizes}) => {
  const {size, lines} = fitLines(text, maxW, maxLines, sizes);
  const lh = lead ?? size * 1.18;
  const top = y - ((lines.length - 1) * lh) / 2;
  return (
    <>
      {lines.map((ln, i) => (
        <Label key={i} x={0} y={top + i * lh} text={ln} size={size} color={color} />
      ))}
    </>
  );
};
const LOOKS: Record<string, typeof CASUAL> = {casual: CASUAL, blue: JACKET_BLUE, orange: SHIRT_ORANGE};
const easeOutBack = (x: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export type SceneSpecX = SceneSpec;

// ---- background kertas ----
const Paper: React.FC = () => {
  const dots: React.ReactNode[] = [];
  for (let x = 48; x < W; x += 64)
    for (let y = 48; y < H; y += 64)
      dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill={INK} opacity={0.07} />);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0}}>
      <rect x={0} y={0} width={W} height={H} fill={PAPER} />
      {dots}
    </svg>
  );
};

// ---- bingkai panel tinta ----
const InkPanel: React.FC = () => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
    <rect x={16} y={16} width={W - 32} height={H - 32} rx={22} fill="none" stroke={INK} strokeWidth={8} />
    <rect x={30} y={30} width={W - 60} height={H - 60} rx={16} fill="none" stroke={INK} strokeWidth={2} opacity={0.45} />
  </svg>
);

// ---- sketch boil: garis mendidih ----
const Sketch: React.FC<{seed?: number; amt?: number; children: React.ReactNode}> = ({seed = 0, amt = 0.6, children}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const r = noise(t * 9 + seed, seed) * amt;
  const dx = noise(t * 8 + seed, seed + 1) * amt * 1.5;
  const dy = noise(t * 10 + seed, seed + 2) * amt * 1.5;
  return <g transform={`rotate(${r}) translate(${dx} ${dy})`}>{children}</g>;
};

// ---- action lines (komik emphasis) ----
const ActionLines: React.FC<{x: number; y: number; r0: number; r1: number; n?: number; color?: string}> = ({x, y, r0, r1, n = 12, color = INK}) => {
  const arr: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    arr.push(
      <line key={i} x1={x + Math.cos(a) * r0} y1={y + Math.sin(a) * r0} x2={x + Math.cos(a) * r1} y2={y + Math.sin(a) * r1} stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
    );
  }
  return <g>{arr}</g>;
};

// ---- balon pikir (cloud) ----
const Thought: React.FC<{x: number; y: number; w: number; h: number; text: string; color?: string}> = ({x, y, w, h, text, color = INK}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y={-h} width={w} height={h * 1.5} rx={26} fill="#FFFDF5" stroke={INK} strokeWidth={4} />
    <circle cx={-14} cy={h * 0.75} r={7} fill="#FFFDF5" stroke={INK} strokeWidth={3} />
    <circle cx={-26} cy={h * 0.92} r={4.5} fill="#FFFDF5" stroke={INK} strokeWidth={3} />
    <BubbleText text={text} y={-h * 0.05} maxW={w - 46} color={color} maxLines={2} sizes={[32, 28, 24, 20]} />
  </g>
);

// ---- balon bicara (ekor bawah) ----
const Speech: React.FC<{x: number; y: number; w: number; title: string; sub: string; color: string}> = ({x, y, w, title, sub, color}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y={-96} width={w} height={186} rx={22} fill="#FFFDF5" stroke={INK} strokeWidth={4} />
    <polygon points={`0,88 -17,124 17,124`} fill="#FFFDF5" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <Label x={0} y={-52} text={title} size={fitSize(title, 42, w - 46)} color={color} />
    <BubbleText text={sub} y={6} maxW={w - 46} color={INK} maxLines={3} lead={26} sizes={[28, 25, 22, 19]} />
  </g>
);

// ---- garis lantai komik (biar karakter tidak ngambang) ----
const Ground: React.FC<{y: number; w?: number}> = ({y, w = W - 200}) => (
  <g opacity={0.85}>
    <line x1={CX - w / 2} y1={y} x2={CX + w / 2} y2={y} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <line x1={CX - w / 2 + 30} y1={y + 12} x2={CX + w / 2 - 40} y2={y + 12} stroke={INK} strokeWidth={2.5} strokeLinecap="round" opacity={0.5} />
  </g>
);

// ---- big "?" bubble ----
const BigQ: React.FC<{x: number; y: number; color?: string}> = ({x, y, color = CRED}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx={0} cy={0} r={92} fill="#FFFDF5" stroke={INK} strokeWidth={5} />
    <circle cx={-18} cy={72} r={9} fill="#FFFDF5" stroke={INK} strokeWidth={4} />
    <circle cx={-34} cy={94} r={6} fill="#FFFDF5" stroke={INK} strokeWidth={4} />
    <Label x={0} y={38} text="?" size={150} color={color} />
  </g>
);

// ---- ledakan "VS" ----
const Burst: React.FC<{t: number}> = ({t}) => {
  const r1 = 70, r2 = 110, N = 12;
  let pts = "";
  for (let i = 0; i < N * 2; i++) {
    const a = (i / (N * 2)) * Math.PI * 2 - Math.PI / 2 + t * 0.4;
    const r = i % 2 ? r1 : r2;
    pts += `${Math.cos(a) * r},${Math.sin(a) * r} `;
  }
  return <polygon points={pts} fill={CYEL} stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
};

// ---- pensil di tangan (HandProp) ----
const Pencil = (abs: number) => (
  <g transform={`rotate(${abs})`}>
    <rect x={-5} y={-66} width={10} height={56} fill={CYEL} stroke={INK} strokeWidth={2} />
    <polygon points={`-5,-66 5,-66 0,-84`} fill={INK} />
    <rect x={-5} y={-10} width={10} height={12} fill={CRED} stroke={INK} strokeWidth={2} />
  </g>
);

// ---- komik transisi: wipe warna ----
const ComicFade: React.FC<{len: number; fade: number; color: string; children: React.ReactNode}> = ({len, fade, color, children}) => {
  const f = useCurrentFrame();
  const kIn = interpolate(f, [0, fade], [0, 1], {extrapolateRight: "clamp"});
  const kOut = interpolate(f, [len, len + fade], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const enterX = lerp(0, W, kIn);
  const exitX = lerp(0, W, 1 - kOut);
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      {children}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0}}>
        {kIn < 1 && <rect x={enterX} y={0} width={W - enterX} height={H} fill={color} />}
        {kOut < 1 && <rect x={0} y={0} width={exitX} height={H} fill={color} />}
      </svg>
    </AbsoluteFill>
  );
};

// ===================== SCENE TEMPLATES =====================
const HookScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const pose = {...idle(t, 1), shR: 150 + Math.sin(t * 5) * 8, elR: 35, lean: -3, headTilt: -8};
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0}}>
      <Ground y={CFLOOR} />
      <ActionLines x={CX} y={CFLOOR - 470} r0={170} r1={235} color={CRED} />
      <g transform={`translate(${CX} ${CFLOOR})`}>
        <Sketch seed={1}>
          <Stickman x={0} y={0} scale={S_ONE} facing={1} pose={pose} look={CASUAL} expr={s.expr ?? "worried"} />
        </Sketch>
      </g>
      <BigQ x={CX} y={Q_Y(S_ONE)} />
    </svg>
  );
};

const ExplainScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const lines = s.board ?? [];
  const paperPop = easeOutBack(prog(f, 0, 26, eOut));
  const accent = s.accent ?? [];
  const look = LOOKS[s.look ?? "blue"] ?? JACKET_BLUE;
  const stickX = CX - 210, paperX = CX + 200;
  const boardW = 470, boardH = 400;
  const paperTop = CFLOOR - boardH - 70;   // dasar papan berhenti di atas garis tanah, aman dari caption
  const pose = {...idle(t, 2), reachR: {x: paperX - boardW / 2 - 30, y: paperTop + boardH * 0.55}};
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0}}>
      <Ground y={CFLOOR} />
      <g transform={`translate(${stickX} ${CFLOOR})`}>
        <Sketch seed={2}>
          <Stickman x={0} y={0} scale={S_EXPLAIN} facing={1} pose={pose} look={{...look, handR: Pencil}} expr={s.expr ?? "focused"} />
        </Sketch>
      </g>
      <g transform={`translate(${paperX} ${paperTop}) scale(${paperPop})`} style={{transformOrigin: `0px ${boardH}px`}}>
        <rect x={-boardW / 2} y={0} width={boardW} height={boardH} rx={14} fill="#FFFDF5" stroke={INK} strokeWidth={5} />
        {lines.map((ln, i) => {
          const emph = ln.startsWith("=");
          const maxW = boardW - 60;
          return (
            <Label
              key={i}
              x={0}
              y={78 + i * 72}
              text={ln}
              size={fitSize(ln, emph ? 42 : 38, maxW)}
              color={emph ? CRED : INK}
            />
          );
        })}
      </g>
      {accent.map((ac, i) => (
        <Thought key={i} x={paperX} y={paperTop - 70 - i * 150} w={boardW} h={118} text={ac} color={CRED} />
      ))}
    </svg>
  );
};

const CausesScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const labels = s.labels ?? ["?", "?", "?"];
  const xs = [CX - 275, CX, CX + 275];
  const looks = [JACKET_BLUE, CASUAL, SHIRT_ORANGE];
  const exprs: Expr[] = ["focused", "worried", "surprised"];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0}}>
      <Ground y={CFLOOR} w={W - 140} />
      {labels.map((lb, i) => {
        const wpop = easeOutBack(prog(f, i * 6, i * 6 + 22, eOut));
        const col = i % 2 ? CBLU : CRED;
        const bw = 260;
        return (
          <g key={i}>
            <ActionLines x={xs[i]} y={CFLOOR - 370} r0={110} r1={155} color={col} />
            <g transform={`translate(${xs[i]} ${CFLOOR})`}>
              <Sketch seed={i + 3}>
                <Stickman x={0} y={0} scale={S_CAUSES} facing={1} pose={idle(t, i)} look={looks[i]} expr={exprs[i]} />
              </Sketch>
            </g>
            <g transform={`translate(${xs[i]} ${THOUGHT_Y(S_CAUSES)}) scale(${wpop})`} style={{transformOrigin: "0px 0px"}}>
              <Thought x={0} y={0} w={bw} h={125} text={lb} color={col} />
            </g>
          </g>
        );
      })}
    </svg>
  );
};

const ProKontraScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const leanL = Math.sin(t * 4) * 8;
  const leanR = Math.sin(t * 4 + Math.PI) * 8;
  const blow = Math.sin(t * 4) > 0;
  const off = 285;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0}}>
      <Ground y={CFLOOR} />
      <ActionLines x={CX} y={CFLOOR - 430} r0={150} r1={225} n={16} color={CYEL} />
      <g transform={`translate(${CX - off} ${CFLOOR})`}>
        <Sketch seed={4}>
          <Stickman x={0} y={0} scale={S_DUEL} facing={1} pose={{...idle(t), lean: 6 + leanL}} look={JACKET_BLUE} expr={blow ? "determined" : "focused"} />
        </Sketch>
      </g>
      <g transform={`translate(${CX + off} ${CFLOOR})`}>
        <Sketch seed={5}>
          <Stickman x={0} y={0} scale={S_DUEL} facing={-1} pose={{...idle(t), lean: 6 + leanR}} look={CASUAL} expr="worried" />
        </Sketch>
      </g>
      <g transform={`translate(${CX} ${CFLOOR - 330})`}>
        <Burst t={t} />
        <Label x={0} y={22} text="VS" size={66} color={INK} />
      </g>
      <Speech x={CX - off} y={SPEECH_Y(S_DUEL)} w={320} title="PRO" sub={s.pro ?? "STABILITAS"} color={CBLU} />
      <Speech x={CX + off} y={SPEECH_Y(S_DUEL)} w={320} title="KONTRA" sub={s.kontra ?? "MANDAT RAKYAT"} color={CRED} />
    </svg>
  );
};

const EndingScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const pose = {...idle(t, 7), shR: 160 + Math.sin(t * 4) * 6, elR: -10, headTilt: 6};
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0}}>
      <Ground y={CFLOOR} />
      <ActionLines x={CX} y={CFLOOR - 470} r0={170} r1={235} color={CBLU} />
      <g transform={`translate(${CX} ${CFLOOR})`}>
        <Sketch seed={6}>
          <Stickman x={0} y={0} scale={S_ONE} facing={1} pose={pose} look={CASUAL} expr={s.expr ?? "focused"} />
        </Sketch>
      </g>
      <BigQ x={CX} y={Q_Y(S_ONE)} color={CBLU} />
    </svg>
  );
};

const DiagramScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0}}>
      <Ground y={CFLOOR} />
      <ActionLines x={CX} y={CFLOOR - 470} r0={160} r1={225} color={CYEL} />
      <g transform={`translate(${CX} ${CFLOOR})`}>
        <Sketch seed={8}>
          <Stickman x={0} y={0} scale={S_ONE} facing={1} pose={idle(t)} look={JACKET_BLUE} expr="focused" />
        </Sketch>
      </g>
      <BigQ x={CX} y={Q_Y(S_ONE)} />
    </svg>
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

const WIPES: Record<string, string> = {hook: CRED, explain: CBLU, causes: CYEL, prokontra: CRED, ending: CBLU, diagram: CBLU};

export const ComicEngine: React.FC<{script: StoryScript; narration?: string}> = ({script, narration}) => {
  const fade = script.fade ?? 12;
  const cues: CaptionCue[] = script.scenes.flatMap((s) => s.cues ?? []);
  return (
    <AbsoluteFill>
      <Paper />
      {script.scenes.map((s) => {
        const Comp = TYPES[s.type] ?? HookScene;
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.len + fade}>
            <ComicFade len={s.len} fade={fade} color={WIPES[s.type] ?? INK}>
              <Comp s={s} />
            </ComicFade>
          </Sequence>
        );
      })}
      <InkPanel />
      <CaptionTrack cues={cues} comic />
      <Narration file={narration} />
    </AbsoluteFill>
  );
};
