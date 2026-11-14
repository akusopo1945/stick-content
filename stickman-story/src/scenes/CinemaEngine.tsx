import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame} from "remotion";
import {Narration} from "../audio/Narration";
import {cheer, idle, point, sit, walk} from "../rig/poses";
import {Expr, Look, Pose, Stickman} from "../rig/Stickman";
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import {FPS, FONT, H, W} from "../styles/palette";
import {clamp, eOut, lerp, noise, prog} from "../motion/ease";
import {CaptionCue} from "../captions/CaptionTrack";
import {SceneSpec, StoryScript} from "./StoryEngine";
export type {SceneSpec, StoryScript} from "./StoryEngine";
import {loadFont as loadBebas} from "@remotion/google-fonts/BebasNeue";
import {loadFont as loadMono} from "@remotion/google-fonts/IBMPlexMono";

/*
 * CinemaEngine — konten #6 "Hidrogen".
 * Satu malam, satu rute kurir. Analogi: sepeda ringan (Hydrogen) lawan truk boros (Flash),
 * 10 gerbang uji, 4 gigi berpikir, pro/kontra, pos sortir, pagi yang tetap biasa saja.
 * Panggung terang di tengah kota malam supaya outline stickman tetap kontras.
 */

const BIG = loadBebas("normal", {weights: ["400"], subsets: ["latin"]}).fontFamily;
const MONO = loadMono("normal", {weights: ["400", "600", "700"], subsets: ["latin"]}).fontFamily;
const TYPE = FONT;

const NIGHT = "#0A1422";
const NIGHT_MID = "#152941";
const DAWN = "#F2B45A";
const STAGE = "#E8EEF4";
const STAGE_D = "#C6D5E3";
const INK = "#101C28";
const INK_S = "#4B6075";
const ACC = "#2E86DE";
const WARM = "#E08A3C";
const RED = "#C0392B";
const TEAL = "#17786B";
const CREAM = "#F6F3EA";
const FADE = 16;

const SX = 60;
const SY = 420;
const SW = 960;
const SH = 840;
const GROUND = 700;

/* ---------------- latar kota malam ---------------- */

const NightBg: React.FC<{dawn: number; seed: number}> = ({dawn, seed}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const city: React.ReactNode[] = [];
  for (let i = 0; i < 17; i++) {
    const bw = 50 + Math.abs(noise(i * 2.3, seed)) * 44;
    const bh = 160 + Math.abs(noise(i * 1.7, seed + 4)) * 430;
    const bx = i * 66 - 24;
    const by = H - bh;
    city.push(<rect key={`b${i}`} x={bx} y={by} width={bw} height={bh} fill={NIGHT_MID} opacity={0.92} />);
    for (let j = 0; j < 5; j++) {
      const wy = by + 28 + j * 66;
      if (wy > H - 50) continue;
      const on = Math.sin(t * 1.3 + i * 3.1 + j * 5.3 + seed) > 0.2 ? 1 : 0.1;
      city.push(<rect key={`w${i}-${j}`} x={bx + 12} y={wy} width={bw - 24} height={15} fill={DAWN} opacity={on * (1 - dawn * 0.72)} />);
    }
  }
  const dust: React.ReactNode[] = [];
  for (let i = 0; i < 34; i++) {
    const x = ((noise(i * 3.1, seed) * 0.5 + 0.5) * W + Math.sin(t * 0.5 + i) * 16 + W) % W;
    const y = H - ((t * 11 + i * 57) % H);
    dust.push(<circle key={`d${i}`} cx={x} cy={y} r={1.4 + (i % 3)} fill={ACC} opacity={0.2 * (1 - dawn)} />);
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", inset: 0}}>
      <defs>
        <linearGradient id="ciNight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NIGHT} />
          <stop offset="100%" stopColor={NIGHT_MID} />
        </linearGradient>
        <linearGradient id="ciDawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A5573" />
          <stop offset="58%" stopColor="#B97B4B" />
          <stop offset="100%" stopColor="#E9B264" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#ciNight)" />
      {city}
      {dust}
      <rect x={0} y={0} width={W} height={H} fill="url(#ciDawn)" opacity={dawn} />
    </svg>
  );
};

/* ---------------- panggung terang ---------------- */

const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: "absolute", left: SX, top: SY, width: SW, height: SH, background: STAGE, borderRadius: 4, overflow: "hidden", boxShadow: "0 22px 70px rgba(0,0,0,0.55)"}}>
    <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{position: "absolute", inset: 0}}>
      <rect x={0} y={0} width={SW} height={SH} fill={STAGE} />
      <rect x={0} y={0} width={SW} height={SH} fill="none" stroke={STAGE_D} strokeWidth={2} />
      <line x1={0} y1={GROUND} x2={SW} y2={GROUND} stroke={INK} strokeWidth={3} opacity={0.55} />
      {Array.from({length: 24}, (_, i) => (
        <line key={i} x1={i * 44} y1={GROUND} x2={i * 44 + 22} y2={GROUND} stroke={CREAM} strokeWidth={9} opacity={0.9} />
      ))}
      <line x1={0} y1={GROUND + 14} x2={SW} y2={GROUND + 14} stroke={INK} strokeWidth={1} opacity={0.16} />
    </svg>
    {children}
  </div>
);

const ActorBox: React.FC<{
  x: number; y: number; w: number; h: number;
  pose: Partial<Pose>; look: Look; expr: Expr;
  scale?: number; facing?: number; opacity?: number;
}> = ({x, y, w, h, pose, look, expr, scale = 1.6, facing = 1, opacity = 1}) => (
  <div style={{position: "absolute", left: x, top: y, width: w, height: h, opacity}}>
    <svg viewBox="-172 -430 344 446" preserveAspectRatio="xMidYMax meet" style={{width: "100%", height: "100%", overflow: "visible"}}>
      <Stickman x={0} y={0} scale={scale} facing={facing} pose={pose} look={look} expr={expr} />
    </svg>
  </div>
);

const Bike: React.FC<{x: number; y: number; spin: number; scale?: number; color?: string}> = ({x, y, spin, scale = 1, color = ACC}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={color} fill="none" strokeWidth={6} strokeLinecap="round">
    <circle cx={-70} cy={0} r={38} />
    <circle cx={70} cy={0} r={38} />
    <path d="M -70 0 L -20 -78 L 30 0 L -70 0 M -20 -78 L 60 -78 M 30 0 L 60 -78" strokeWidth={5} />
    <line x1={60} y1={-78} x2={74} y2={-98} />
    <line x1={44} y1={-98} x2={88} y2={-98} />
    {[0, 1, 2, 3].map((i) => (
      <line key={`l${i}`} x1={-70} y1={0} x2={-70 + 38 * Math.cos(spin + (i * Math.PI) / 2)} y2={38 * Math.sin(spin + (i * Math.PI) / 2)} strokeWidth={2} opacity={0.55} />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <line key={`r${i}`} x1={70} y1={0} x2={70 + 38 * Math.cos(spin + (i * Math.PI) / 2)} y2={38 * Math.sin(spin + (i * Math.PI) / 2)} strokeWidth={2} opacity={0.55} />
    ))}
  </g>
);

const Truck: React.FC<{x: number; y: number; spin: number; scale?: number}> = ({x, y, spin, scale = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x={-125} y={-112} width={190} height={92} rx={4} fill={WARM} stroke={INK} strokeWidth={4} />
    <path d="M 65 -112 L 65 -20 L 128 -20 L 128 -112 Z" fill={STAGE_D} stroke={INK} strokeWidth={4} />
    <rect x={76} y={-96} width={38} height={34} rx={2} fill={ACC} stroke={INK} strokeWidth={3} />
    {[-78, 84].map((cx, i) => (
      <g key={i}>
        <circle cx={cx} cy={0} r={30} fill={INK} />
        <circle cx={cx} cy={0} r={13} fill={STAGE} />
        <line x1={cx} y1={0} x2={cx + 26 * Math.cos(spin)} y2={26 * Math.sin(spin)} stroke={CREAM} strokeWidth={3} />
      </g>
    ))}
  </g>
);

const BadgeCard: React.FC<{x: number; y: number; text: string; color: string; rot: number; scale: number; opacity: number}> = ({x, y, text, color, rot, scale, opacity}) => (
  <div style={{position: "absolute", left: x, top: y, width: 190, height: 118, opacity, transform: `rotate(${rot}deg) scale(${scale})`}}>
    <div style={{background: color, color: CREAM, fontFamily: BIG, fontSize: 54, letterSpacing: 4, textAlign: "center", padding: "14px 0", border: `4px solid ${INK}`}}>{text}</div>
  </div>
);

const GateCard: React.FC<{x: number; y: number; n: number; win: "H" | "C"; k: number}> = ({x, y, n, win, k}) => (
  <div style={{position: "absolute", left: x, top: y, width: 148, height: 172, opacity: k, transform: `translateY(${lerp(26, 0, k)}px)`}}>
    <div style={{height: 9, background: INK}} />
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
      <div style={{width: 9, height: 112, background: INK}} />
      <div style={{width: 92, height: 62, marginTop: 8, background: win === "H" ? ACC : RED, color: CREAM, fontFamily: BIG, fontSize: 38, lineHeight: "62px", textAlign: "center", letterSpacing: 2}}>{win}</div>
      <div style={{width: 9, height: 112, background: INK}} />
    </div>
    <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: 2, color: INK_S, textAlign: "center", marginTop: 8}}>GATE {String(n).padStart(2, "0")}</div>
  </div>
);

const GearBar: React.FC<{x: number; label: string; cost: string; k: number}> = ({x, label, cost, k}) => (
  <div style={{position: "absolute", left: x, top: 150, width: 170, height: 430}}>
    <div style={{position: "absolute", inset: 0, border: `2px solid ${INK_S}66`, background: `${STAGE_D}AA`}} />
    <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: `${Math.max(4, k * 100)}%`, background: ACC, opacity: 0.82}} />
    <div style={{position: "absolute", top: 12, left: 0, width: "100%", textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: INK}}>{label}</div>
    <div style={{position: "absolute", bottom: -58, left: 0, width: "100%", textAlign: "center", fontFamily: BIG, fontSize: 40, color: INK}}>{cost}</div>
  </div>
);

const Panel: React.FC<{side: "pro" | "kontra"; title: string; body: string[]; k: number}> = ({side, title, body, k}) => {
  const col = side === "pro" ? TEAL : RED;
  return (
    <div style={{flex: 1, opacity: k, transform: `translateY(${lerp(20, 0, k)}px)`, border: `2px solid ${col}`, background: CREAM}}>
      <div style={{background: col, color: CREAM, fontFamily: BIG, fontSize: 32, letterSpacing: 5, textAlign: "center", padding: "5px 0"}}>{title}</div>
      <div style={{padding: "10px 14px"}}>
        {body.map((b, i) => (
          <div key={i} style={{fontFamily: TYPE, fontSize: 21, lineHeight: 1.3, color: INK, marginBottom: 4}}>• {b}</div>
        ))}
      </div>
    </div>
  );
};

const PackageCard: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <div style={{position: "absolute", left: x, top: y, width: 170, height: 150, opacity: k, transform: `translateY(${lerp(-120, 0, k)}px) rotate(${lerp(-12, 0, k)}deg)`, background: WARM, border: `4px solid ${INK}`}}>
    <div style={{position: "absolute", left: 0, right: 0, top: 62, height: 18, background: CREAM}} />
    <div style={{position: "absolute", left: 75, top: 0, bottom: 0, width: 18, background: CREAM}} />
  </div>
);

/* ---------------- header, data, caption ---------------- */

const ShotTitle: React.FC<{s: SceneSpec; idx: number; f: number}> = ({s, idx, f}) => {
  const k = prog(f, 2, 20, eOut);
  return (
    <div style={{position: "absolute", left: SX, top: 92, width: SW, opacity: k, transform: `translateX(${lerp(-24, 0, k)}px)`}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 4, color: DAWN}}>{s.kicker ?? "STICKFORGE"}</div>
      <div style={{height: 12}} />
      <div style={{fontFamily: BIG, fontSize: 112, lineHeight: 0.9, color: CREAM, letterSpacing: 2}}>
        {s.headline?.[0] ?? "HIDROGEN"}{" "}
        <span style={{color: DAWN}}>{s.headline?.[1] ?? ""}</span>
      </div>
      <div style={{height: 14}} />
      <div style={{fontFamily: TYPE, fontSize: 26, color: CREAM, opacity: 0.72}}>{s.deck ?? ""}</div>
      <div style={{display: "flex", alignItems: "center", gap: 12, marginTop: 14}}>
        <div style={{height: 3, width: `${k * 100}%`, background: DAWN}} />
        <div style={{fontFamily: MONO, fontSize: 17, letterSpacing: 2, color: CREAM, opacity: 0.6}}>SHOT {String(idx + 1).padStart(2, "0")}/07</div>
      </div>
    </div>
  );
};

const DataStrip: React.FC<{s: SceneSpec; f: number}> = ({s, f}) => {
  const k = prog(f, 16, 42, eOut);
  const stats = s.stats ?? [];
  return (
    <div style={{position: "absolute", left: SX, top: 1288, width: SW, opacity: k}}>
      <div style={{display: "flex", gap: 12}}>
        {stats.map((st, i) => (
          <div key={i} style={{flex: 1, background: "rgba(8,18,32,0.78)", border: `1px solid ${ACC}77`, padding: "10px 14px", transform: `translateY(${lerp(14, 0, prog(f, 18 + i * 6, 40 + i * 6, eOut))}px)`}}>
            <div style={{fontFamily: BIG, fontSize: 50, lineHeight: 1, color: CREAM}}>{st.value}</div>
            <div style={{fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: DAWN, marginTop: 5}}>{st.label}</div>
          </div>
        ))}
      </div>
      {s.note && (
        <div style={{fontFamily: MONO, fontSize: 19, color: CREAM, opacity: 0.75, marginTop: 12, lineHeight: 1.4}}>{s.note}</div>
      )}
    </div>
  );
};

const CinemaCue: React.FC<{cue: CaptionCue}> = ({cue}) => {
  const f = useCurrentFrame();
  const dur = Math.max(1, cue.to - cue.from);
  const kIn = clamp(f / 6);
  const k = Math.min(kIn, clamp((dur - f) / 6));
  if (k <= 0.01) return null;
  const gf = cue.from + f;
  return (
    <div style={{position: "absolute", left: 70, width: W - 140, top: 1518, opacity: k, transform: `translateY(${lerp(12, 0, kIn)}px)`}}>
      <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 10}}>
        <div style={{width: 12, height: 12, background: DAWN}} />
        <div style={{flex: 1, height: 2, background: `${CREAM}55`}} />
      </div>
      <div style={{fontFamily: TYPE, fontWeight: 700, fontSize: 44, lineHeight: 1.3, color: CREAM, background: `${NIGHT}CC`, padding: "14px 18px", whiteSpace: "pre-line"}}>
        {cue.words && cue.words.length ? (
          cue.words.map((w, i) => {
            const active = gf >= w.from && gf < w.to;
            const past = gf >= w.to;
            return <span key={i} style={{color: active ? DAWN : past ? "rgba(246,243,234,0.45)" : CREAM}}>{w.t}{" "}</span>;
          })
        ) : cue.text}
      </div>
    </div>
  );
};

const CinemaCaptions: React.FC<{cues: CaptionCue[]}> = ({cues}) => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    {cues.map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={Math.max(1, c.to - c.from)}>
        <CinemaCue cue={c} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

const TimeCode: React.FC<{total: number}> = ({total}) => {
  const f = useCurrentFrame();
  const sec = Math.floor(f / FPS);
  return (
    <div style={{position: "absolute", right: 70, bottom: 42, display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: CREAM, opacity: 0.6}}>
      <div style={{width: 9, height: 9, borderRadius: "50%", background: RED}} />
      REC {String(Math.floor(sec / 60)).padStart(2, "0")}:{String(sec % 60).padStart(2, "0")} / {String(Math.floor(total / FPS / 60)).padStart(2, "0")}:{String(Math.floor(total / FPS) % 60).padStart(2, "0")}
    </div>
  );
};

/* ---------------- kamera ---------------- */

const CameraDrift: React.FC<{len: number; seed: number; children: React.ReactNode}> = ({len, seed, children}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const z = lerp(1.0, 1.045, clamp(f / Math.max(1, len))) + 0.012 * Math.sin(t * 1.1 + seed);
  const dx = noise(t * 0.55, seed) * 10;
  const dy = noise(t * 0.4, seed + 3) * 7;
  return <div style={{position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px) scale(${z})`, transformOrigin: "50% 44%"}}>{children}</div>;
};

const Shutter: React.FC<{f: number}> = ({f}) => (
  <div style={{position: "absolute", inset: 0, background: NIGHT, opacity: (1 - clamp(f / 12)) * 0.78, pointerEvents: "none"}} />
);

/* ---------------- 7 adegan ---------------- */

const HookScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const oldK = 1 - prog(f, 12, 46, eOut);
  const newK = prog(f, 52, 76, eOut);
  const pose = {...idle(t, 2), shR: 34, elR: 20, look: 0.55, headTilt: 3};
  return (
    <>
      <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{position: "absolute", inset: 0}}>
        {[70, 370, 670].map((x, i) => (
          <g key={i}>
            <rect x={x} y={150} width={230} height={540} fill={STAGE_D} stroke={INK} strokeWidth={3} />
            <rect x={x + 18} y={170} width={194} height={500} fill={STAGE} stroke={INK_S} strokeWidth={1.5} opacity={0.6} />
            <line x1={x} y1={400} x2={x + 230} y2={400} stroke={INK} strokeWidth={2} opacity={0.3} />
          </g>
        ))}
        {[185, 485, 785].map((x, i) => (
          <circle key={i} cx={x} cy={110} r={16} fill={DAWN} opacity={0.5 + 0.4 * Math.abs(Math.sin(t * 1.6 + i))} />
        ))}
      </svg>
      <ActorBox x={330} y={318} w={310} h={382} pose={pose} look={JACKET_BLUE} expr={s.expr ?? "focused"} scale={1.62} />
      <BadgeCard x={590} y={300} text="FLASH" color={WARM} rot={lerp(0, -22, 1 - oldK)} scale={lerp(1, 0.8, 1 - oldK)} opacity={oldK} />
      <BadgeCard x={590} y={300} text="H" color={ACC} rot={lerp(-14, -4, newK)} scale={lerp(1.5, 1, newK)} opacity={newK} />
      <div style={{position: "absolute", left: 60, top: 748, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: INK_S}}>GUDANG • SEMALAM, SEMUA BADGE LAMA DICOPOT</div>
    </>
  );
};

const RosterScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const k = prog(f, 8, 34, eOut);
  const planner = point(idle(t, 5), 0.7);
  return (
    <>
      <div style={{position: "absolute", left: 50, top: 110, width: 310, height: 580, background: STAGE_D, border: `3px solid ${INK}`, opacity: k}}>
        <div style={{height: 44}} />
        <div style={{height: 2, background: INK, opacity: 0.3}} />
        <div style={{position: "absolute", left: 20, top: 90, width: 268, height: 170, background: CREAM, border: `2px solid ${INK_S}`}}>
          <svg width={268} height={170} viewBox="0 0 268 170">
            <path d="M 20 140 C 80 40, 160 150, 248 30" stroke={ACC} strokeWidth={4} fill="none" strokeDasharray="10 8" />
            <circle cx={20} cy={140} r={9} fill={INK} />
            <circle cx={248} cy={30} r={9} fill={WARM} />
          </svg>
        </div>
      </div>
      <ActorBox x={60} y={20} w={135} h={200} pose={planner} look={CASUAL} expr="focused" scale={1.15} opacity={k} />
      <ActorBox x={200} y={20} w={135} h={200} pose={point(idle(t, 9), 0.5)} look={JACKET_BLUE} expr="calm" scale={1.15} facing={-1} opacity={k} />
      <div style={{position: "absolute", left: 390, top: 150, width: 250, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: INK_S}}>KARBON + ARGON<br />MIKIR PANJANG</div>
      <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{position: "absolute", inset: 0}}>
        <Truck x={200} y={GROUND - 4} spin={t * 1.5} scale={0.78} />
        <Bike x={720} y={GROUND - 4} spin={t * 6} scale={0.95} />
      </svg>
      <ActorBox x={630} y={318} w={250} h={382} pose={walk(f / 46, t, 3)} look={SHIRT_ORANGE} expr="determined" scale={1.45} opacity={k} />
      <div style={{position: "absolute", left: 610, top: 748, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: ACC}}>HIDROGEN • KURIR SEPEDA</div>
      <div style={{position: "absolute", left: 90, top: 748, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: WARM}}>FLASH • TRUK</div>
    </>
  );
};

const RaceScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const p = prog(f, 0, Math.max(1, s.len - 30), eOut);
  const bikeX = lerp(130, 730, p);
  const truckX = lerp(90, 355, prog(f, 0, Math.max(1, s.len), eOut));
  const win = prog(f, Math.max(1, s.len - 90), s.len, eOut);
  const pose = win > 0.5 ? cheer(t, 4) : walk(f / 34, t, 1);
  return (
    <>
      <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{position: "absolute", inset: 0}}>
        <line x1={40} y1={GROUND - 90} x2={920} y2={GROUND - 90} stroke={INK_S} strokeWidth={2} strokeDasharray="16 12" opacity={0.5} />
        {[180, 360, 540, 720].map((x, i) => (
          <g key={i}>
            <line x1={x} y1={GROUND - 140} x2={x} y2={GROUND} stroke={INK_S} strokeWidth={2} opacity={0.35} />
            <text x={x + 8} y={GROUND - 150} fontFamily={MONO} fontSize={18} fill={INK_S}>{i + 1} KM</text>
          </g>
        ))}
        <Truck x={truckX} y={GROUND - 4} spin={t * 2} scale={0.9} />
        <Bike x={bikeX} y={GROUND - 4} spin={t * 11} scale={1.02} />
      </svg>
      <ActorBox x={bikeX - 120} y={318} w={240} h={382} pose={pose} look={SHIRT_ORANGE} expr={s.expr ?? "happy"} scale={1.42} />
      <div style={{position: "absolute", left: 60, top: 130, fontFamily: BIG, fontSize: 140, lineHeight: 0.9, color: ACC, opacity: prog(f, 10, 34, eOut)}}>2,5x</div>
      <div style={{position: "absolute", left: 60, top: 270, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: INK_S}}>LEBIH DULU SAMPAI</div>
      <div style={{position: "absolute", right: 50, top: 140, width: 330, background: CREAM, border: `3px solid ${INK}`, padding: "18px 20px", opacity: prog(f, 70, 100, eOut)}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: 3, color: INK_S}}>ONGKOS / TUGAS</div>
        <div style={{fontFamily: BIG, fontSize: 62, color: WARM, textDecoration: "line-through"}}>$7,77</div>
        <div style={{fontFamily: BIG, fontSize: 78, color: TEAL}}>$1,87</div>
      </div>
    </>
  );
};

const GearsScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const labels = ["LOW", "MEDIUM", "HIGH", "XHIGH"];
  const costs = ["$0,29", "$0,80", "$1,87", "$3,16"];
  return (
    <>
      {labels.map((lb, i) => (
        <GearBar key={i} x={70 + i * 220} label={lb} cost={costs[i]} k={prog(f, 14 + i * 22, 48 + i * 22, eOut)} />
      ))}
      <div style={{position: "absolute", left: 40, top: 742, width: 880, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: INK_S}}>
        MAKIN TINGGI GIGI • MAKIN LAMA BOLEH RAGU • MAKIN MAHAL
      </div>
      <ActorBox x={390} y={318} w={230} h={382} pose={point(idle(t, 6), 0.75, 120)} look={JACKET_BLUE} expr={s.expr ?? "calm"} scale={1.45} />
    </>
  );
};

const GatesScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const wins: ("H" | "C")[] = ["H", "H", "H", "C", "H", "H", "C", "H", "H", "C"];
  const brake = prog(f, 90, 150, eOut);
  const pose = {...idle(t, 11), lean: 9, headTilt: 8, look: 0.7, shR: 26};
  return (
    <>
      {wins.map((w, i) => (
        <GateCard key={i} x={26 + (i % 5) * 186} y={i < 5 ? 24 : 208} n={i + 1} win={w} k={prog(f, 6 + i * 7, 26 + i * 7, eOut)} />
      ))}
      <div style={{position: "absolute", left: 26, top: 402, width: 566, display: "flex", gap: 12}}>
        <Panel side="pro" title={s.pro ?? "PRO"} body={s.proBody ?? []} k={prog(f, 60, 88, eOut)} />
        <Panel side="kontra" title={s.kontra ?? "KONTRA"} body={s.kontraBody ?? []} k={prog(f, 76, 104, eOut)} />
      </div>
      <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{position: "absolute", inset: 0}}>
        <Bike x={lerp(700, 760, brake)} y={GROUND - 4} spin={t * 8 * (1 - brake * 0.85)} scale={0.62} />
      </svg>
      <ActorBox x={630} y={470} w={220} h={230} pose={pose} look={SHIRT_ORANGE} expr={s.expr ?? "worried"} scale={1.1} />
    </>
  );
};

const SortirScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const k = prog(f, 20, 56, eOut);
  const zoom = lerp(1, 1.1, prog(f, 60, 130, eOut));
  return (
    <div style={{position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "55% 60%"}}>
      <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{position: "absolute", inset: 0}}>
        <rect x={70} y={GROUND - 30} width={820} height={30} fill={STAGE_D} stroke={INK} strokeWidth={3} />
        <rect x={470} y={230} width={380} height={260} fill={CREAM} stroke={INK} strokeWidth={3} />
        <path d="M 500 450 C 590 300, 690 420, 820 260" stroke={RED} strokeWidth={5} fill="none" strokeDasharray="12 8" />
        <path d="M 500 450 C 580 390, 700 330, 820 260" stroke={TEAL} strokeWidth={6} fill="none" opacity={k} />
        <circle cx={500} cy={450} r={10} fill={INK} />
        <circle cx={820} cy={260} r={10} fill={TEAL} />
      </svg>
      <ActorBox x={90} y={330} w={250} h={370} pose={sit(t, 4)} look={JACKET_BLUE} expr="worried" scale={1.4} />
      <ActorBox x={610} y={318} w={250} h={382} pose={point(idle(t, 8), 0.9, 118)} look={SHIRT_ORANGE} expr={s.expr ?? "surprised"} scale={1.45} facing={-1} />
      <div style={{position: "absolute", left: 470, top: 180, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 3, color: INK_S}}>RUTE TIM • 10 HARI MENTOK</div>
      <div style={{position: "absolute", left: 60, top: 90, background: RED, color: CREAM, fontFamily: BIG, fontSize: 64, padding: "8px 20px", opacity: k, transform: `rotate(${lerp(-8, -3, k)}deg)`}}>2 KESALAHAN</div>
      <div style={{position: "absolute", left: 40, top: 742, width: 880, textAlign: "center", fontFamily: BIG, fontSize: 46, letterSpacing: 2, color: TEAL, opacity: prog(f, 100, 140, eOut)}}>KAMU SALAH ARAH</div>
    </div>
  );
};

const EndingScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const k = prog(f, 10, 44, eOut);
  const quote = s.quote ?? ["KALAU SATU POIN", "BISA DIKALAHKAN HARGA,", "KITA MILIH", "APA?"];
  return (
    <>
      <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{position: "absolute", inset: 0}}>
        {[120, 320, 520, 720].map((x, i) => (
          <rect key={i} x={x} y={430 + (i % 2) * 40} width={130} height={260} fill={STAGE_D} opacity={0.85} stroke={INK} strokeWidth={2} />
        ))}
      </svg>
      <div style={{position: "absolute", left: 40, top: 36, width: 880}}>
        {quote.map((line, i) => (
          <div key={i} style={{overflow: "hidden"}}>
            <div style={{fontFamily: BIG, fontSize: 70, lineHeight: 0.98, color: INK, transform: `translateY(${lerp(110, 0, prog(f, 8 + i * 8, 28 + i * 8, eOut))}%)`}}>{line}</div>
          </div>
        ))}
      </div>
      <div style={{position: "absolute", left: 40, top: 330, width: 880, background: DAWN, color: INK, fontFamily: BIG, fontSize: 44, letterSpacing: 2, textAlign: "center", padding: "8px 0", opacity: prog(f, 60, 90, eOut), transform: `rotate(${lerp(-4, -1, k)}deg)`}}>
        {s.stamp ?? "TULIS PENDAPATMU DI KOMENTAR"}
      </div>
      <PackageCard x={720} y={460} k={k} />
      <ActorBox x={370} y={400} w={260} h={300} pose={{...idle(t, 12), look: -0.3, headTilt: 4}} look={CASUAL} expr={s.expr ?? "calm"} scale={1.25} />
      <div style={{position: "absolute", left: 40, top: 742, width: 880, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: INK_S}}>
        PAKET SAMPAI LEBIH CEPAT • KOTA TETAP BIASA SAJA
      </div>
    </>
  );
};

const TYPES: Record<string, React.FC<{s: SceneSpec}>> = {
  hook: HookScene,
  roster: RosterScene,
  race: RaceScene,
  gears: GearsScene,
  gates: GatesScene,
  sortir: SortirScene,
  ending: EndingScene,
};

/* ---------------- shell + root ---------------- */

const SceneShell: React.FC<{s: SceneSpec; idx: number}> = ({s, idx}) => {
  const f = useCurrentFrame();
  const dawn = s.type === "ending" ? prog(f, 8, Math.min(s.len, 150), eOut) : 0;
  const op = Math.min(1, clamp(f / FADE) * 1.4);
  const blackout = prog(f, Math.max(1, s.len - 12), s.len + 2, eOut);
  const Comp = TYPES[s.type] ?? HookScene;
  return (
    <AbsoluteFill style={{opacity: op, overflow: "hidden"}}>
      <CameraDrift len={s.len} seed={idx * 3 + 1}>
        <NightBg dawn={dawn} seed={idx} />
        <ShotTitle s={s} idx={idx} f={f} />
        <Stage><Comp s={s} /></Stage>
        <DataStrip s={s} f={f} />
      </CameraDrift>
      <Shutter f={f} />
      <div style={{position: "absolute", inset: 0, background: NIGHT, opacity: blackout, pointerEvents: "none"}} />
    </AbsoluteFill>
  );
};

export const CinemaEngine: React.FC<{script: StoryScript; narration?: string}> = ({script, narration}) => (
  <AbsoluteFill style={{backgroundColor: NIGHT}}>
    {script.scenes.map((s, i) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.len + FADE}>
        <SceneShell s={s} idx={i} />
      </Sequence>
    ))}
    <CinemaCaptions cues={script.scenes.flatMap((s) => s.cues ?? [])} />
    <TimeCode total={script.total} />
    <Narration file={narration} />
  </AbsoluteFill>
);
