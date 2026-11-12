import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {Narration} from "../audio/Narration";
import {idle} from "../rig/poses";
import {Expr, Look, Stickman} from "../rig/Stickman";
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import {FPS, H, W} from "../styles/palette";
import {eOut, lerp, noise, prog} from "../motion/ease";
import {CaptionCue} from "../captions/CaptionTrack";
import {SceneSpec, StoryScript} from "./StoryEngine";
export type {SceneSpec, StoryScript} from "./StoryEngine";
import {loadFont as loadPlayfair} from "@remotion/google-fonts/PlayfairDisplay";
import {loadFont as loadOswald} from "@remotion/google-fonts/Oswald";
import {loadFont as loadPTSerif} from "@remotion/google-fonts/PTSerif";
import {loadFont as loadAbril} from "@remotion/google-fonts/AbrilFatface";

/*
 * KoranFlipEngine — Koran editorial dengan animasi PAGE-FLIP (beda total dari KoranEngine).
 *
 * Bedanya vs KoranEngine:
 *   - transisi  : halaman dibuka (flip kiri–kanan + lipatan), bukan roller tinta
 *   - headline  : kinetik per-kata (kata jatuh dari atas dengan rotasi)
 *   - stamp     : cap karet dengan overshoot (scale 1.6 -> 1)
 *   - ticker    : strip breaking-news berjalan di dasar (marquee)
 *   - kolom     : scale+rise berurutan dengan stagger terasa
 *
 * Dipakai via field "engine":"KoranFlipEngine" di script JSON.
 */

// ---------- palet ----------
const NEWS = "#F0E8D4";
const NEWS_D = "#E3D9C2";
const INK = "#17130F";
const RED = "#B3231C";
const BLU = "#1F4E79";
const GREY = "#6B6154";
const PAPER = "#F5EFE0";

// ---------- font ----------
const HEAD = loadOswald("normal", {weights: ["500", "600", "700"], subsets: ["latin"]}).fontFamily;
const DISPLAY = loadPlayfair("normal", {weights: ["700", "800", "900"], subsets: ["latin"]}).fontFamily;
const BODY = loadPTSerif("normal", {weights: ["400", "700"], subsets: ["latin"]}).fontFamily;
const SLAB = loadAbril("normal", {weights: ["400"], subsets: ["latin"]}).fontFamily;

// ---------- layout ----------
const M = 70;         // margin halaman
const CW = W - M * 2; // lebar konten (940)
const TOP = 292;      // bawah bingkai halaman

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** "*teks*" -> <span> merah tebal (in redaksi koran). */
const rich = (s: string) =>
  s.split(/(\*[^*]+\*)/g).map((p, i) =>
    p.startsWith("*") && p.endsWith("*") ? (
      <span key={i} style={{color: RED}}>{p.slice(1, -1)}</span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    ),
  );

// ---------- texture ----------
const Newsprint: React.FC = () => {
  const fibers: React.ReactNode[] = [];
  for (let i = 0; i < 200; i++) {
    const y = (i * 9.4) % H;
    const x = noise(i * 1.7, i) * W;
    const len = 50 + Math.abs(noise(i * 2.3, i + 1)) * 260;
    fibers.push(<line key={`f${i}`} x1={x - len / 2} y1={y} x2={x + len / 2} y2={y} stroke={INK} strokeWidth={1} opacity={0.03} />);
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0}}>
      <rect x={0} y={0} width={W} height={H} fill={NEWS} />
      {fibers}
    </svg>
  );
};

/** Bingkai halaman koran: border + garis atas bawah. */
const PageFrame: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    <div style={{position: "absolute", left: 34, top: 34, right: 34, bottom: 34, border: `2px solid ${INK}`, padding: 6, boxSizing: "border-box"}}>
      <div style={{width: "100%", height: "100%", border: `4px solid ${INK}`, position: "relative"}} />
    </div>
  </AbsoluteFill>
);

/** Nameplate koran di atas (statis). */
const Nameplate: React.FC = () => (
  <div style={{position: "absolute", left: M, top: 64, width: CW, textAlign: "center"}}>
    <div style={{fontFamily: SLAB, fontSize: 62, color: INK, lineHeight: 1, letterSpacing: 1}}>
      STICKFORGE POST
    </div>
    <div style={{height: 6}} />
    <div style={{fontFamily: HEAD, fontWeight: 500, fontSize: 18, letterSpacing: 6, color: GREY}}>
      EDISI POLITIK &bull; HARIAN &bull; 13 NOVEMBER 2026
    </div>
    <div style={{height: 10, background: INK}} />
    <div style={{height: 2, background: INK, marginTop: 3}} />
    <div style={{height: 4, background: INK, marginTop: 1}} />
  </div>
);

/** Ticker breaking-news berjalan (marquee) di dasar halaman. */
const Ticker: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame();
  const off = (f * 3.4) % (CW + 800);
  const repeated = `${text}  \u25CF  ${text}  \u25CF  `;
  return (
    <div style={{position: "absolute", left: M, top: 1280, width: CW, height: 46, background: INK, overflow: "hidden", display: "flex", alignItems: "center"}}>
      <div style={{position: "absolute", left: 0, top: 0, bottom: 0, background: RED, color: PAPER, fontFamily: HEAD, fontWeight: 700, letterSpacing: 3, fontSize: 20, display: "flex", alignItems: "center", padding: "0 18px", zIndex: 2}}>
        BREAKING
      </div>
      <div style={{position: "absolute", whiteSpace: "nowrap", transform: `translateX(${CW + 60 - off}px)`, fontFamily: HEAD, fontWeight: 500, fontSize: 21, letterSpacing: 1, color: PAPER}}>
        {repeated}
      </div>
    </div>
  );
};

/* ---------- elemen tipografi (kinetik) ---------- */

const Kicker: React.FC<{text: string; f: number; color?: string}> = ({text, f, color = RED}) => {
  const k = prog(f, 2, 18, eOut);
  return (
    <div style={{display: "flex", alignItems: "center", gap: 14, fontFamily: HEAD, fontWeight: 700, fontSize: 27, letterSpacing: 5, color, opacity: k, transform: `translateX(${lerp(-26, 0, k)}px)`}}>
      <span style={{display: "inline-block", width: 40 * k, height: 7, background: color}} />
      {text}
    </div>
  );
};

/** Headline kinetik per-kata: kata jatuh dari atas + rotasi kecil. */
const KineticHeadline: React.FC<{lines: string[][]; f: number; size?: number; at?: number; rot?: number}> = ({lines, f, size = 88, at = 8, rot = 7}) => (
  <div>
    {lines.map((ln, li) => (
      <div key={li} style={{display: "flex", flexWrap: "wrap", gap: "0.18em"}}>
        {ln.map((word, wi) => {
          const ff = at + (li * 4 + wi) * 4;
          const k = prog(f, ff, ff + 26, eOut);
          return (
            <span key={wi} style={{
              display: "inline-block",
              overflow: "hidden",
              verticalAlign: "bottom",
            }}>
              <span style={{
                display: "inline-block",
                fontFamily: HEAD,
                fontWeight: 700,
                fontSize: size,
                lineHeight: 0.96,
                letterSpacing: -0.5,
                color: INK,
                textTransform: "uppercase",
                transform: `translateY(${lerp(130, 0, k)}%) rotate(${lerp(rot, 0, k)}deg)`,
                transformOrigin: "0 50%",
              }}>
                {rich(word)}
              </span>
            </span>
          );
        })}
      </div>
    ))}
  </div>
);

const Deck: React.FC<{text: string; f: number; at?: number; size?: number; color?: string}> = ({text, f, at = 26, size = 34, color = "#3A332B"}) => {
  const k = prog(f, at, at + 22, eOut);
  return (
    <div style={{fontFamily: BODY, fontWeight: 400, fontSize: size, lineHeight: 1.42, color, opacity: k, transform: `translateY(${lerp(12, 0, k)}px)`}}>
      {text}
    </div>
  );
};

const Rule: React.FC<{f: number; at?: number; thick?: number; color?: string}> = ({f, at = 0, thick = 2, color = INK}) => {
  const k = prog(f, at, at + 20, eOut);
  return <div style={{height: thick, background: color, width: `${k * 100}%`}} />;
};

/** Cap karet dengan slam + overshoot (scale 1.6 -> 1, opacity masuk). */
const Stamp: React.FC<{text: string; f: number; at?: number; color?: string; size?: number}> = ({text, f, at = 20, color = RED, size = 30}) => {
  const k = prog(f, at, at + 14, eOut);
  if (k <= 0.01) return null;
  const s = interpolate(k, [0, 1], [1.7, 1]);
  return (
    <div style={{display: "inline-block", border: `4px solid ${color}`, color, fontFamily: HEAD, fontWeight: 700, fontSize: size, letterSpacing: 4, padding: "8px 20px", transform: `rotate(-7deg) scale(${s})`, opacity: k * 0.92}}>
      {text}
    </div>
  );
};

/* ---------- kotak foto duotone ---------- */

const Fig: React.FC<{
  w: number; h: number; f: number;
  pose?: Record<string, number | string | boolean>;
  look: Look; expr?: Expr; scale?: number; at?: number; label?: string; tint?: string;
}> = ({w, h, f, pose, look, expr = "neutral", scale = 1.9, at = 10, label, tint = RED}) => {
  const k = prog(f, at, at + 24, eOut);
  const t = f / FPS;
  const figH = 268 * scale + 20;
  const figW = figH * 0.68;
  const vbH = figH + 30;
  const vbW = figW + 40;
  const vbY = -figH - 10;
  return (
    <div style={{width: w, height: h, position: "relative", border: `4px solid ${INK}`, background: NEWS_D, overflow: "hidden", opacity: k, transform: `scale(${lerp(0.96, 1, k)}) rotate(${lerp(-1.2, 0, k)}deg)`}}>
      <div style={{position: "absolute", inset: 0, background: `radial-gradient(${tint}55 1.4px, transparent 1.6px)`, backgroundSize: "9px 9px", opacity: 0.5, mixBlendMode: "multiply"}} />
      <svg viewBox={`${-vbW / 2} ${vbY} ${vbW} ${vbH}`} preserveAspectRatio="xMidYMax meet" style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}>
        <Stickman x={0} y={0} scale={scale} facing={1} pose={pose ?? idle(t)} look={look} expr={expr} />
      </svg>
      {label ? (
        <div style={{position: "absolute", left: 0, right: 0, bottom: 0, background: `${INK}D9`, color: PAPER, fontFamily: HEAD, fontWeight: 500, fontSize: 17, letterSpacing: 2, padding: "7px 12px", textTransform: "uppercase"}}>
          {label}
        </div>
      ) : null}
    </div>
  );
};

/* ---------- transisi PAGE-FLIP ---------- */

const PageFlip: React.FC<{len: number; fade: number; children: React.ReactNode; variant?: "in" | "out"}> = ({len, fade, children, variant = "in"}) => {
  const f = useCurrentFrame();
  const kIn = clamp01(f / fade);
  const kOut = clamp01((f - len) / fade);
  // masuk: halaman baru "dibuka" dari kanan (rotateY + translateX ringan)
  const e = eOut(kIn);
  const inX = lerp(140, 0, e);
  const inRot = lerp(4.5, 0, e);
  // keluar: halaman lama "ditutup" ke kiri
  const e2 = 1 - kOut;
  const outX = lerp(0, -140, e2);
  const outRot = lerp(0, -4.5, e2);
  const dx = f <= len ? inX : outX;
  const rot = f <= len ? inRot : outRot;
  const op = f <= len ? clamp01(kIn) : 1 - kOut;
  return (
    <AbsoluteFill style={{overflow: "hidden", perspective: "1200px"}}>
      <div style={{position: "absolute", inset: 0, transform: `translateX(${dx}px) rotateY(${rot}deg)`, opacity: op, transformOrigin: "left center", backfaceVisibility: "hidden"}}>
        {children}
      </div>
      {op < 0.99 ? <div style={{position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(23,19,15,0.22), rgba(23,19,15,0) 26%)", pointerEvents: "none"}} /> : null}
    </AbsoluteFill>
  );
};

/* ---------- caption gaya koran + ticker ---------- */

const FlipCaptions: React.FC<{cues: CaptionCue[]; tickText: string}> = ({cues, tickText}) => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    {cues.map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={Math.max(1, c.to - c.from)}>
        <FlipCue cue={c} />
      </Sequence>
    ))}
    <Ticker text={tickText} />
  </AbsoluteFill>
);

const FlipCue: React.FC<{cue: CaptionCue}> = ({cue}) => {
  const f = useCurrentFrame();
  const dur = Math.max(1, cue.to - cue.from);
  const kIn = clamp01(f / 7);
  const kOut = clamp01((dur - f) / 6);
  const k = Math.min(kIn, kOut);
  if (k <= 0.01) return null;
  const gf = cue.from + f;
  return (
    <div style={{position: "absolute", left: M, width: CW, top: 1352, opacity: k, transform: `translateY(${lerp(10, 0, kIn)}px)`}}>
      <div style={{height: 3, background: INK}} />
      <div style={{height: 1, background: INK, marginTop: 3}} />
      <div style={{
        marginTop: 14, fontFamily: BODY, fontWeight: 400, fontSize: 40, lineHeight: 1.32,
        color: INK, textAlign: "left", background: `${PAPER}E6`, padding: "0 4px",
      }}>
        {cue.words && cue.words.length ? (
          cue.words.map((w, i) => {
            const active = gf >= w.from && gf < w.to;
            const past = gf >= w.to;
            return (
              <span key={i} style={{color: active ? RED : past ? "#8B8272" : INK, fontWeight: active ? 700 : 400}}>
                {w.t}{" "}
              </span>
            );
          })
        ) : (
          cue.text
        )}
      </div>
    </div>
  );
};

/* ---------- 1. HOOK ---------- */

const HookScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const head: string[][] = [
    ["GIBRAN", "MUNDUR", "DARI", "WAKIL", "PRESIDEN."],
    ["SIAPA", "*DIUNTUNGKAN?*"],
  ];
  const pose = {...idle(t, 2), shR: 34 + Math.sin(t * 3) * 5, elR: 62, lean: -2, headTilt: 4};
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: TOP, width: CW}}>
        <Kicker text={s.kicker ?? "POLITIK \u2022 PERMUTASI KEKUASAAN"} f={f} />
        <div style={{height: 16}} />
        <KineticHeadline lines={head} f={f} size={68} />
        <div style={{height: 18}} />
        <Rule f={f} at={16} thick={3} />
        <div style={{height: 12}} />
        <Deck text={s.deck ?? "Satu kursi kosong. Tiga skenario beredar. Yang menang belum tentu buru-buru."} f={f} at={22} />
      </div>

      <div style={{position: "absolute", left: M, top: 748, width: CW, display: "flex", gap: 26, alignItems: "flex-end"}}>
        <Fig w={560} h={500} f={f} at={26} pose={pose} look={CASUAL} expr={s.expr ?? "worried"} scale={2.0} label="POLITISI \u2022 SOLO" />
        <div style={{flex: 1, paddingBottom: 8}}>
          <div style={{display: "flex", justifyContent: "flex-end"}}>
            <Stamp text={s.stamp ?? "MUNDUR"} f={f} at={40} size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- 2. EXPLAIN: mekanisme konstitusi ---------- */

const DocBox: React.FC<{xTitle: string; body: string[]; f: number; at: number; col: string}> = ({xTitle, body, f, at, col}) => {
  const k = prog(f, at, at + 22, eOut);
  return (
    <div style={{flex: 1, opacity: k, transform: `translateY(${lerp(16, 0, k)}px) rotate(${lerp(-0.6, 0, k)}deg)`, border: `3px solid ${col}`, padding: "18px 20px", background: PAPER}}>
      <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: col, textTransform: "uppercase"}}>{xTitle}</div>
      <div style={{height: 10}} />
      {body.map((ln, i) => (
        <div key={i} style={{fontFamily: BODY, fontSize: 27, lineHeight: 1.38, color: "#3A332B", marginBottom: 6}}>{ln}</div>
      ))}
    </div>
  );
};

const ExplainScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const steps = s.steps ?? [
    {title: "LANGKAH 1", body: ["Presiden ajukan", "2 calon ke MPR"]},
    {title: "LANGKAH 2", body: ["MPR sidang", "maks. 60 hari"]},
    {title: "LANGKAH 3", body: ["MPR pilih", "wakil presiden baru"]},
  ];
  const cols = [RED, INK, BLU];
  const pose = {...idle(t, 3), shR: 12, elR: 8, headTilt: 0, look: 0.4};
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: TOP, width: CW}}>
        <Kicker text={s.kicker ?? "MEKANISME KONSTITUSI"} f={f} />
        <div style={{height: 14}} />
        <KineticHeadline lines={[["CARA", "MENGGANTINYA"], ["ITU", "*SAH*"], ["JIKA", "KURSI", "KOSONG"]]} f={f} size={66} />
        <div style={{height: 16}} />
        <Rule f={f} at={14} thick={2} />
        <div style={{height: 20}} />
        <div style={{display: "flex", gap: 22}}>
          {steps.map((st, i) => (
            <DocBox key={i} xTitle={st.title} body={st.body} f={f} at={20 + i * 8} col={cols[i] ?? INK} />
          ))}
        </div>
      </div>

      <div style={{position: "absolute", left: M, top: 788, width: CW, display: "flex", gap: 24, alignItems: "flex-start"}}>
        <Fig w={330} h={420} f={f} at={30} pose={pose} look={JACKET_BLUE} expr="focused" scale={1.72} label="FORUM MPR" tint={BLU} />
        <div style={{flex: 1}}>
          <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: RED}}>CATATAN REDAKSI</div>
          <div style={{height: 8}} />
          <div style={{fontFamily: BODY, fontSize: 30, lineHeight: 1.44, color: "#3A332B"}}>
            {s.note ?? "Jadi bukan rakyat yang memilih langsung, melainkan MPR dari dua calon yang diajukan presiden. Enam puluh hari menentukan arahnya."}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- 3. CAUSES: tiga skenario kolom ---------- */

const ScenarioCol: React.FC<{n: number; tag: string; title: string; body: string; f: number; at: number; look: Look; expr: Expr; seed: number}> = ({n, tag, title, body, f, at, look, expr, seed}) => {
  const k = prog(f, at, at + 24, eOut);
  const t = f / FPS;
  if (k <= 0.01) return null;
  return (
    <div style={{flex: 1, opacity: k, transform: `translateY(${lerp(24, 0, k)}px) scale(${lerp(0.97, 1, k)})`}}>
      <div style={{display: "flex", alignItems: "center", gap: 12}}>
        <div style={{width: 46, height: 46, background: RED, color: PAPER, fontFamily: HEAD, fontWeight: 700, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center"}}>{n}</div>
        <div style={{height: 4, flex: 1, background: INK}} />
      </div>
      <div style={{height: 12}} />
      <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 21, letterSpacing: 2, color: RED, textTransform: "uppercase"}}>{tag}</div>
      <div style={{height: 6}} />
      <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 32, lineHeight: 1.06, letterSpacing: 0.5, color: INK, textTransform: "uppercase"}}>{rich(title)}</div>
      <div style={{height: 12}} />
      <div style={{fontFamily: BODY, fontSize: 26, lineHeight: 1.4, color: "#3A332B"}}>{body}</div>
      <div style={{height: 14}} />
      <div style={{height: 320, position: "relative", border: `3px solid ${INK}`, background: NEWS_D, overflow: "hidden"}}>
        <svg viewBox="-170 -478 340 494" preserveAspectRatio="xMidYMax meet" style={{width: "100%", height: "100%"}}>
          <Stickman x={0} y={0} scale={1.62} facing={1} pose={idle(t, seed)} look={look} expr={expr} />
        </svg>
      </div>
    </div>
  );
};

const CausesScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const cols = s.colsFlip ?? [
    {tag: "SKENARIO A", title: "GENG *SOLO*", body: "Penggantinya tetap dari lingkaran Solo."},
    {tag: "SKENARIO B", title: "KUBU *PRABOWO*", body: "Dua calon dari partai pendukung koalisi."},
    {tag: "SKENARIO C", title: "*KONSPIRASI*", body: "Deal PDIP atau motif pribadi di baliknya."},
  ];
  const looks = [JACKET_BLUE, CASUAL, SHIRT_ORANGE];
  const exprs: Expr[] = ["worried", "focused", "surprised"];
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: TOP, width: CW}}>
        <Kicker text={s.kicker ?? "TIGA SKENARIO"} f={f} />
        <div style={{height: 12}} />
        <KineticHeadline lines={[["SIAPA", "YANG"], ["BENAR-BENAR"], ["*MENUJU*"]]} f={f} size={64} />
        <div style={{height: 16}} />
        <Rule f={f} at={12} thick={2} />
        <div style={{height: 24}} />
        <div style={{display: "flex", gap: 20}}>
          {cols.map((c, i) => (
            <ScenarioCol key={i} n={i + 1} tag={c.tag} title={c.title} body={c.body} f={f} at={18 + i * 10} look={looks[i] ?? CASUAL} expr={exprs[i] ?? "focused"} seed={i + 4} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- 4. PROKONTRA: op-ed dua kolom ---------- */

const OpEd: React.FC<{side: "pro" | "kontra"; title: string; body: string[]; f: number; at: number; look: Look; expr: Expr; seed: number}> = ({side, title, body, f, at, look, expr, seed}) => {
  const k = prog(f, at, at + 26, eOut);
  const t = f / FPS;
  const col = side === "pro" ? BLU : RED;
  if (k <= 0.01) return null;
  return (
    <div style={{flex: 1, opacity: k, transform: `translateX(${lerp(side === "pro" ? -28 : 28, 0, k)}px) rotate(${lerp(side === "pro" ? -1 : 1, 0, k)}deg)`}}>
      <div style={{background: col, color: PAPER, fontFamily: HEAD, fontWeight: 700, fontSize: 30, letterSpacing: 5, padding: "10px 0", textAlign: "center", textTransform: "uppercase"}}>
        {side === "pro" ? "PRO" : "KONTRA"}
      </div>
      <div style={{height: 2, background: INK}} />
      <div style={{height: 16}} />
      <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 33, lineHeight: 1.1, color: INK, textTransform: "uppercase"}}>{title}</div>
      <div style={{height: 14}} />
      <div style={{height: 250, position: "relative", border: `3px solid ${INK}`, background: NEWS_D, overflow: "hidden"}}>
        <div style={{position: "absolute", inset: 0, background: `radial-gradient(${col}4D 1.4px, transparent 1.6px)`, backgroundSize: "8px 8px", opacity: 0.6, mixBlendMode: "multiply"}} />
        <svg viewBox="-170 -432 340 448" preserveAspectRatio="xMidYMax meet" style={{width: "100%", height: "100%"}}>
          <Stickman x={0} y={0} scale={1.5} facing={side === "pro" ? 1 : -1} pose={{...idle(t, seed), lean: 5}} look={look} expr={expr} />
        </svg>
      </div>
      <div style={{height: 14}} />
      {body.map((p, i) => (
        <div key={i} style={{fontFamily: BODY, fontSize: 25, lineHeight: 1.38, color: "#3A332B", marginBottom: 10}}>{p}</div>
      ))}
    </div>
  );
};

const ProKontraScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: TOP, width: CW}}>
        <Kicker text={s.kicker ?? "DUA SISI"} f={f} />
        <div style={{height: 12}} />
        <KineticHeadline lines={[["DEMOKRASI", "MENUJU"], ["*KEBIJAKAN*"]]} f={f} size={74} />
        <div style={{height: 18}} />
        <Rule f={f} at={12} thick={2} />
        <div style={{height: 22}} />
        <div style={{display: "flex", gap: 30}}>
          <OpEd side="pro" title={s.pro ?? "RUANG DEMOKRASI"} body={s.proBody ?? ["Jalur konstitusi terbuka lebar.", "MPR pilih dari dua calon presiden."]} f={f} at={18} look={JACKET_BLUE} expr="determined" seed={6} />
          <div style={{width: 2, background: INK, opacity: 0.5}} />
          <OpEd side="kontra" title={s.kontra ?? "PRESIDEN STABIL"} body={s.kontraBody ?? ["Preseden yang baru saja dicoba.", "Instabil politik yang belum selesai."]} f={f} at={30} look={CASUAL} expr="worried" seed={7} />
        </div>
      </div>
    </div>
  );
};

/* ---------- 5. ENDING ---------- */

const EndingScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const quote = s.quote ?? ["KALAU KURSI ITU *KOSONG*,\r\nSEBENARNYA *SIAPA* YANG PALING\r\NDIUNTUNGKAN?"];
  const pose = {...idle(t, 8), headTilt: 6, lookY: -0.3, shL: -14, elL: 20};
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: TOP, width: CW}}>
        <Kicker text={s.kicker ?? "PENUTUP"} f={f} color={INK} />
        <div style={{height: 10}} />
        <div style={{fontFamily: DISPLAY, fontSize: 170, lineHeight: 0.7, color: RED, opacity: prog(f, 4, 22, eOut)}}>&ldquo;</div>
        <div style={{marginTop: -30}}>
          {quote.map((q, i) => {
            const words = q.split(" ");
            return (
              <div key={i} style={{display: "flex", flexWrap: "wrap", gap: "0.2em", marginBottom: 6}}>
                {words.map((w, wi) => {
                  const wk = prog(f, 10 + i * 8 + wi * 3, 10 + i * 8 + wi * 3 + 24, eOut);
                  return (
                    <span key={wi} style={{display: "inline-block", overflow: "hidden", verticalAlign: "bottom"}}>
                      <span style={{display: "inline-block", fontFamily: HEAD, fontWeight: 700, fontSize: 58, lineHeight: 1.08, color: INK, textTransform: "uppercase", transform: `translateY(${lerp(120, 0, wk)}%) rotate(${lerp(8, 0, wk)}deg)`}}>
                        {rich(w)}
                      </span>
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{height: 24}} />
        <Rule f={f} at={26} thick={3} />
        <div style={{height: 14}} />
        <Deck text={s.deck ?? "Dan kamu pilih yang seperti apa: pemimpin kuat, atau aman-aman saja? Tulis di komen."} f={f} at={30} size={32} />
      </div>

      <div style={{position: "absolute", left: M, top: 830, width: CW, display: "flex", gap: 24, alignItems: "flex-end"}}>
        <Fig w={380} h={430} f={f} at={24} pose={pose} look={CASUAL} expr={s.expr ?? "sad"} scale={1.78} label="PENONTON \u2022 KOMEN DI BAWAH" />
        <div style={{flex: 1, paddingBottom: 90}}>
          <Stamp text={s.stamp ?? "TULIS DI KOMEN"} f={f} at={36} size={26} />
        </div>
      </div>
    </div>
  );
};

/* ---------- wiring ---------- */

const TYPES: Record<string, React.FC<{s: SceneSpec}>> = {
  hook: HookScene,
  explain: ExplainScene,
  causes: CausesScene,
  prokontra: ProKontraScene,
  ending: EndingScene,
};

const TICK_TEXT = "GIBRAN AJUKAN MUNDUR \u2022 KURSI WPRES KOSONG \u2022 PRABOWO DIMINTA AJUKAN 2 NAMA \u2022 MPR RAPAT PEMILIHAN \u2022 60 HARI MENENTUKAN \u2022";

export const KoranFlipEngine: React.FC<{script: StoryScript; narration?: string}> = ({script, narration}) => {
  const fade = script.fade ?? 12;
  const cues: CaptionCue[] = script.scenes.flatMap((s) => s.cues ?? []);
  return (
    <AbsoluteFill>
      <Newsprint />
      {script.scenes.map((s) => {
        const Comp = TYPES[s.type] ?? HookScene;
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.len + fade}>
            <PageFlip len={s.len} fade={fade}>
              <Comp s={s} />
            </PageFlip>
          </Sequence>
        );
      })}
      <Nameplate />
      <PageFrame />
      <FlipCaptions cues={cues} tickText={TICK_TEXT} />
      <Narration file={narration} />
    </AbsoluteFill>
  );
};
