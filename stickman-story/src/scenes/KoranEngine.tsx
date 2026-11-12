import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {Narration} from "../audio/Narration";
import {idle} from "../rig/poses";
import {Expr, Look, Pose, Stickman} from "../rig/Stickman";
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import {FPS, H, W} from "../styles/palette";
import {eOut, lerp, noise, prog} from "../motion/ease";
import {CaptionCue} from "../captions/CaptionTrack";
import {SceneSpec, StoryScript} from "./StoryEngine";
export type {SceneSpec, StoryScript} from "./StoryEngine";

import {loadFont as loadAbril} from "@remotion/google-fonts/AbrilFatface";
import {loadFont as loadOswald} from "@remotion/google-fonts/Oswald";
import {loadFont as loadPTSerif} from "@remotion/google-fonts/PTSerif";

/*
 * KoranEngine — gaya KORAN / EDITORIAL (cetak).
 *  - Kertas newsprint + halftone, bingkai garis ganda, bingkai bergeser tipis (register shift).
 *  - Tipografi cetak: nameplate display, headline condensed uppercase, body serif.
 *  - Foto stickman di kotak foto duotone + caption foto.
 *  - Infografik angka, kolom bernomor, op-ed PRO/KONTRA, pull-quote.
 *  - Transisi: roller tinta menyapu per scene.
 * Dipakai lewat "engine":"KoranEngine" di script. StoryEngine & ComicEngine tak tersentuh.
 */

const PAPER = "#F3EBDA";
const PAPER_D = "#E6DAC0";
const INK = "#171512";
const RED = "#AF2A1B";
const RULE = "#2B2724";
const MUTED = "#6B6154";

const M = 70;
const CW = W - M * 2;          // 940 — lebar kolom konten
const TOP = 296;               // awal area konten (di bawah nameplate)

const DISPLAY = loadAbril("normal", {weights: ["400"]}).fontFamily;
const HEAD = loadOswald("normal", {weights: ["500", "600", "700"]}).fontFamily;
const BODY = loadPTSerif("normal", {weights: ["400", "700"]}).fontFamily;

/* ---------- util ---------- */

/** `"BERAS *MAHAL*"` -> bagian dalam bintang berwarna aksen. */
const rich = (text: string, accent = RED): React.ReactNode[] =>
  text.split("*").map((part, i) =>
    i % 2 === 1 ? <span key={i} style={{color: accent}}>{part}</span> : <React.Fragment key={i}>{part}</React.Fragment>
  );

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ---------- kertas koran ---------- */

const Newsprint: React.FC = () => {
  const f = useCurrentFrame();
  const grain = 0.03 + Math.abs(noise(f * 0.7, 3)) * 0.02;
  return (
    <AbsoluteFill style={{backgroundColor: PAPER}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          backgroundImage: `repeating-linear-gradient(90deg, ${INK}0D 0 1px, transparent 1px 4px), repeating-linear-gradient(0deg, ${INK}08 0 1px, transparent 1px 5px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          backgroundImage: `radial-gradient(${INK}26 0.9px, transparent 1.1px)`,
          backgroundSize: "7px 7px",
        }}
      />
      <div style={{position: "absolute", inset: 0, background: `radial-gradient(120% 78% at 50% 6%, transparent 42%, ${INK}1A 100%)`}} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: grain,
          backgroundImage: `radial-gradient(${INK} 0.6px, transparent 0.7px)`,
          backgroundSize: "3px 3px",
        }}
      />
    </AbsoluteFill>
  );
};

/** Bingkai halaman: garis ganda ala koran cetak. */
const PageFrame: React.FC = () => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
    <rect x={30} y={30} width={W - 60} height={H - 60} fill="none" stroke={RULE} strokeWidth={5} />
    <rect x={44} y={44} width={W - 88} height={H - 88} fill="none" stroke={RULE} strokeWidth={1.5} opacity={0.6} />
  </svg>
);

/* ---------- nameplate ---------- */

const Nameplate: React.FC = () => (
  <div style={{position: "absolute", left: M, top: 62, width: CW}}>
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: HEAD, fontWeight: 600, fontSize: 20, letterSpacing: 3, color: MUTED}}>
      <span>EDISI PAGI</span>
      <span>NO. 0261</span>
    </div>
    <div style={{height: 2, background: RULE, marginTop: 8}} />
    <div style={{fontFamily: DISPLAY, fontSize: 74, lineHeight: 1, color: INK, textAlign: "center", letterSpacing: 1, marginTop: 10, marginBottom: 10}}>
      STICKFORGE POST
    </div>
    <div style={{height: 5, background: RULE}} />
    <div style={{height: 2, background: RULE, marginTop: 4}} />
  </div>
);

/* ---------- elemen tipografi ---------- */

const Kicker: React.FC<{text: string; f: number; color?: string}> = ({text, f, color = RED}) => {
  const k = prog(f, 2, 18, eOut);
  return (
    <div style={{display: "flex", alignItems: "center", gap: 14, fontFamily: HEAD, fontWeight: 700, fontSize: 27, letterSpacing: 5, color, opacity: k, transform: `translateX(${lerp(-26, 0, k)}px)`}}>
      <span style={{display: "inline-block", width: 40 * k, height: 7, background: color}} />
      {text}
    </div>
  );
};

const Headline: React.FC<{lines: string[]; f: number; size?: number; at?: number; width?: number}> = ({lines, f, size = 88, at = 8, width = CW}) => (
  <div style={{width}}>
    {lines.map((ln, i) => {
      const k = prog(f, at + i * 6, at + i * 6 + 24, eOut);
      return (
        <div key={i} style={{overflow: "hidden"}}>
          <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: 0.94, letterSpacing: -0.5, color: INK, textTransform: "uppercase", transform: `translateY(${lerp(110, 0, k)}%)`}}>
            {rich(ln)}
          </div>
        </div>
      );
    })}
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

const Rule: React.FC<{f: number; at?: number; thick?: number; color?: string}> = ({f, at = 0, thick = 2, color = RULE}) => {
  const k = prog(f, at, at + 20, eOut);
  return <div style={{height: thick, background: color, width: `${k * 100}%`}} />;
};

const Stamp: React.FC<{text: string; f: number; at?: number; color?: string; size?: number}> = ({text, f, at = 20, color = RED, size = 30}) => {
  const k = prog(f, at, at + 16, eOut);
  if (k <= 0.01) return null;
  const s = interpolate(k, [0, 1], [1.6, 1]);
  return (
    <div style={{display: "inline-block", border: `4px solid ${color}`, color, fontFamily: HEAD, fontWeight: 700, fontSize: size, letterSpacing: 4, padding: "8px 20px", transform: `rotate(-7deg) scale(${s})`, opacity: k * 0.92}}>
      {text}
    </div>
  );
};

/* ---------- kotak foto stickman (duotone) ---------- */

const Fig: React.FC<{
  w: number;
  h: number;
  f: number;
  pose?: Partial<Pose>;
  look: Look;
  expr?: Expr;
  scale?: number;
  at?: number;
  label?: string;
  tint?: string;
}> = ({w, h, f, pose, look, expr = "neutral", scale = 1.9, at = 10, label, tint = RED}) => {
  const k = prog(f, at, at + 24, eOut);
  const t = f / FPS;
  const VB_H = 268 * scale + 52;      // kaki sampai ubun-ubun + napas di atas
  const VB_W = VB_H * (w / h);        // viewBox disamakan dengan rasio kotak: "meet" tak pernah letterbox
  const VB_Y = -(VB_H - 16);
  return (
    <div style={{width: w, height: h, position: "relative", border: `4px solid ${INK}`, background: PAPER_D, overflow: "hidden", opacity: k, transform: `scale(${lerp(1.04, 1, k)})`}}>
      <div style={{position: "absolute", inset: 0, background: `radial-gradient(${tint}55 1.4px, transparent 1.6px)`, backgroundSize: "9px 9px", opacity: 0.5, mixBlendMode: "multiply"}} />
      <svg viewBox={`${-VB_W / 2} ${VB_Y} ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMax meet" style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}>
        <Stickman x={0} y={0} scale={scale} facing={1} pose={pose ?? idle(t)} look={look} expr={expr} />
      </svg>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none"}}>
        <path d="M 0 6 L 0 0 L 6 0 M 94 0 L 100 0 L 100 6 M 100 94 L 100 100 L 94 100 M 6 100 L 0 100 L 0 94" fill="none" stroke={INK} strokeWidth={1.2} vectorEffect="non-scaling-stroke" opacity={0.5} />
      </svg>
      {label ? (
        <div style={{position: "absolute", left: 0, right: 0, bottom: 0, background: `${INK}D9`, color: PAPER, fontFamily: HEAD, fontWeight: 500, fontSize: 17, letterSpacing: 2, padding: "7px 12px", textTransform: "uppercase"}}>
          {label}
        </div>
      ) : null}
    </div>
  );
};

/* ---------- transisi: roller tinta ---------- */

const Roller: React.FC<{len: number; fade: number; children: React.ReactNode}> = ({len, fade, children}) => {
  const f = useCurrentFrame();
  const out = clamp01((f - len) / fade);
  if (out >= 1) return null;
  const kIn = clamp01(f / fade);
  const barX = lerp(0, W + 200, eOut(clamp01(f / (fade * 1.35))));
  const nudge = noise(f * 0.9, 11) * 0.8;
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `translate(${nudge}px, ${lerp(-16, 0, kIn)}px)`}}>
      {children}
      {f < fade * 1.4 ? <div style={{position: "absolute", top: 0, bottom: 0, left: barX - 160, width: 160, background: INK, opacity: 0.92}} /> : null}
    </AbsoluteFill>
  );
};

/* ---------- caption gaya koran (bukan balon) ---------- */

const EditorialCaptions: React.FC<{cues: CaptionCue[]}> = ({cues}) => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    {cues.map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={Math.max(1, c.to - c.from)}>
        <KoranCue cue={c} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

const KoranCue: React.FC<{cue: CaptionCue}> = ({cue}) => {
  const f = useCurrentFrame();
  const dur = Math.max(1, cue.to - cue.from);
  const kIn = clamp01(f / 7);
  const kOut = clamp01((dur - f) / 6);
  const k = Math.min(kIn, kOut);
  if (k <= 0.01) return null;
  const gf = cue.from + f;
  return (
    <div style={{position: "absolute", left: M, width: CW, top: 1352, opacity: k, transform: `translateY(${lerp(10, 0, kIn)}px)`}}>
      <div style={{height: 3, background: RULE}} />
      <div style={{height: 1, background: RULE, marginTop: 3}} />
      <div
        style={{
          marginTop: 14,
          fontFamily: BODY,
          fontWeight: 400,
          fontSize: 40,
          lineHeight: 1.32,
          color: INK,
          textAlign: "left",
          background: `${PAPER}E6`,
          padding: "0 4px",
        }}
      >
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

/* ---------- 1. HOOK: headline utama + foto besar ---------- */

const HookScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const head = s.headline ?? ["BERAS *MAHAL*,", "PETANI *TETAP*", "SENGSARA"];
  const pose = {...idle(t, 2), shR: 34 + Math.sin(t * 3) * 5, elR: 62, lean: -2, headTilt: 4};
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: TOP, width: CW}}>
        <Kicker text={s.kicker ?? "PANGAN \u2022 EKONOMI"} f={f} />
        <div style={{height: 16}} />
        <Headline lines={head} f={f} size={96} />
        <div style={{height: 18}} />
        <Rule f={f} at={16} thick={3} />
        <div style={{height: 12}} />
        <Deck text={s.deck ?? "Harga naik di kedua ujung rantai. Tapi keuntungannya berhenti di tengah."} f={f} at={22} />
      </div>

      <div style={{position: "absolute", left: M, top: 800, width: CW, display: "flex", gap: 26, alignItems: "flex-end"}}>
        <Fig w={520} h={440} f={f} at={26} pose={pose} look={CASUAL} expr={s.expr ?? "worried"} scale={1.95} label="PETANI \u2022 JAWA TENGAH" />
        <div style={{flex: 1, paddingBottom: 8}}>
          <div style={{display: "flex", justifyContent: "flex-end"}}>
            <Stamp text={s.stamp ?? "LAPORAN KHUSUS"} f={f} at={40} size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- 2. EXPLAIN: infografik angka + foto ---------- */

const StatBlock: React.FC<{value: string; label: string; f: number; at: number; accent?: boolean}> = ({value, label, f, at, accent}) => {
  const k = prog(f, at, at + 22, eOut);
  const n = interpolate(k, [0, 1], [0, 1]);
  return (
    <div style={{opacity: k, transform: `translateY(${lerp(16, 0, k)}px)`, borderTop: `3px solid ${accent ? RED : RULE}`, paddingTop: 10}}>
      <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 76, lineHeight: 1, color: accent ? RED : INK, letterSpacing: -1}}>
        {value}
      </div>
      <div style={{fontFamily: HEAD, fontWeight: 500, fontSize: 22, letterSpacing: 2, color: MUTED, marginTop: 8, textTransform: "uppercase"}}>
        {label}
      </div>
      <div style={{height: 2, background: `${accent ? RED : RULE}`, marginTop: 10, width: `${n * 100}%`, opacity: 0.4}} />
    </div>
  );
};

const ExplainScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const stats = s.stats ?? [
    {value: "132,60", label: "NILAI TUKAR PETANI"},
    {value: "8.000", label: "GABAH / KG"},
    {value: "16.203", label: "BERAS / KG"},
  ];
  const pose = {...idle(t, 3), shR: 12, elR: 8, headTilt: 0, look: 0.4};
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: TOP, width: CW}}>
        <Kicker text={s.kicker ?? "BEDAH ANGKA"} f={f} />
        <div style={{height: 14}} />
        <Headline lines={s.headline ?? ["REKOR *NTP*,", "TAPI UNTUNG", "KE *SIAPA?*"]} f={f} size={78} />
        <div style={{height: 16}} />
        <Rule f={f} at={14} thick={2} />
        <div style={{height: 20}} />
        <div style={{display: "flex", gap: 22}}>
          {stats.map((st, i) => (
            <div key={i} style={{flex: 1}}>
              <StatBlock value={st.value} label={st.label} f={f} at={20 + i * 8} accent={i === stats.length - 1} />
            </div>
          ))}
        </div>
      </div>

      <div style={{position: "absolute", left: M, top: 760, width: CW, display: "flex", gap: 24, alignItems: "flex-start"}}>
        <Fig w={330} h={430} f={f} at={30} pose={pose} look={JACKET_BLUE} expr="focused" scale={1.72} label="KANTOR BPS" tint="#2D6CC0" />
        <div style={{flex: 1}}>
          <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: RED}}>CATATAN REDAKSI</div>
          <div style={{height: 8}} />
          <div style={{fontFamily: BODY, fontSize: 30, lineHeight: 1.44, color: "#3A332B"}}>
            {s.note ?? "Angka rata-rata nasional menyembunyikan petani kecil yang hanya punya sepetak sawah dan tak punya posisi tawar."}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- 3. CAUSES: kolom bernomor (koran) ---------- */

const CausalCol: React.FC<{n: number; title: string; body: string; f: number; at: number; look: Look; expr: Expr; seed: number}> = ({n, title, body, f, at, look, expr, seed}) => {
  const k = prog(f, at, at + 24, eOut);
  const t = f / FPS;
  if (k <= 0.01) return null;
  return (
    <div style={{flex: 1, opacity: k, transform: `translateY(${lerp(24, 0, k)}px)`}}>
      <div style={{display: "flex", alignItems: "center", gap: 12}}>
        <div style={{width: 46, height: 46, background: RED, color: PAPER, fontFamily: HEAD, fontWeight: 700, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center"}}>
          {n}
        </div>
        <div style={{height: 4, flex: 1, background: RULE}} />
      </div>
      <div style={{height: 12}} />
      <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 34, lineHeight: 1.06, letterSpacing: 0.5, color: INK, textTransform: "uppercase"}}>
        {rich(title)}
      </div>
      <div style={{height: 12}} />
      <div style={{fontFamily: BODY, fontSize: 26, lineHeight: 1.4, color: "#3A332B"}}>{body}</div>
      <div style={{height: 14}} />
      <div style={{height: 300, position: "relative", border: `3px solid ${INK}`, background: PAPER_D, overflow: "hidden"}}>
        <svg viewBox="-170 -478 340 494" preserveAspectRatio="xMidYMax meet" style={{width: "100%", height: "100%"}}>
          <Stickman x={0} y={0} scale={1.62} facing={1} pose={idle(t, seed)} look={look} expr={expr} />
        </svg>
      </div>
    </div>
  );
};

const CausesScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const cols = s.cols ?? [
    {title: "BIAYA *PRODUKSI*", body: "Pupuk, benih, dan upah buruh tani ikut naik."},
    {title: "RANTAI *PANJANG*", body: "Dari sawah ke rak pasar, banyak tangan ambil untung."},
    {title: "MAFIA *BERAS*", body: "13 tersangka dari 8 kasus dan 15 merek."},
  ];
  const looks = [JACKET_BLUE, CASUAL, SHIRT_ORANGE];
  const exprs: Expr[] = ["worried", "focused", "surprised"];
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: TOP, width: CW}}>
        <Kicker text={s.kicker ?? "TIGA SEBAB"} f={f} />
        <div style={{height: 12}} />
        <Headline lines={s.headline ?? ["KENAPA *UNTUNG*", "BERHENTI DI TENGAH"]} f={f} size={66} />
        <div style={{height: 16}} />
        <Rule f={f} at={12} thick={2} />
        <div style={{height: 24}} />
        <div style={{display: "flex", gap: 20}}>
          {cols.map((c, i) => (
            <CausalCol key={i} n={i + 1} title={c.title} body={c.body} f={f} at={18 + i * 10} look={looks[i] ?? CASUAL} expr={exprs[i] ?? "focused"} seed={i + 4} />
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
  const col = side === "pro" ? "#1F4E79" : RED;
  if (k <= 0.01) return null;
  return (
    <div style={{flex: 1, opacity: k, transform: `translateY(${lerp(26, 0, k)}px)`}}>
      <div style={{background: col, color: PAPER, fontFamily: HEAD, fontWeight: 700, fontSize: 30, letterSpacing: 5, padding: "10px 0", textAlign: "center", textTransform: "uppercase"}}>
        {side === "pro" ? "PRO" : "KONTRA"}
      </div>
      <div style={{height: 2, background: INK}} />
      <div style={{height: 16}} />
      <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 33, lineHeight: 1.1, color: INK, textTransform: "uppercase"}}>{title}</div>
      <div style={{height: 14}} />
      <div style={{height: 250, position: "relative", border: `3px solid ${INK}`, background: PAPER_D, overflow: "hidden"}}>
        <div style={{position: "absolute", inset: 0, background: `radial-gradient(${col}4D 1.4px, transparent 1.6px)`, backgroundSize: "8px 8px", opacity: 0.6, mixBlendMode: "multiply"}} />
        <svg viewBox="-170 -432 340 448" preserveAspectRatio="xMidYMax meet" style={{width: "100%", height: "100%"}}>
          <Stickman x={0} y={0} scale={1.5} facing={side === "pro" ? 1 : -1} pose={{...idle(t, seed), lean: 5}} look={look} expr={expr} />
        </svg>
      </div>
      <div style={{height: 14}} />
      {body.map((p, i) => (
        <div key={i} style={{fontFamily: BODY, fontSize: 25, lineHeight: 1.38, color: "#3A332B", marginBottom: 10}}>
          {p}
        </div>
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
        <Headline lines={s.headline ?? ["MUNDUR ATAU *BERTAHAN?*"]} f={f} size={70} />
        <div style={{height: 18}} />
        <Rule f={f} at={12} thick={2} />
        <div style={{height: 22}} />
        <div style={{display: "flex", gap: 30}}>
          <OpEd side="pro" title={s.pro ?? "KEBIJAKAN JALAN"} body={s.proBody ?? ["Serapan Bulog tembus 4,4 juta ton.", "Harga gabah di tingkat petani ikut naik."]} f={f} at={18} look={JACKET_BLUE} expr="determined" seed={6} />
          <div style={{width: 2, background: RULE, opacity: 0.5}} />
          <OpEd side="kontra" title={s.kontra ?? "ANGKA MENIPU"} body={s.kontraBody ?? ["Rata-rata tak bicara petani gurem.", "HET dan HPP masih dikaji."]} f={f} at={30} look={CASUAL} expr="worried" seed={7} />
        </div>
      </div>
    </div>
  );
};

/* ---------- 5. ENDING: pull-quote besar ---------- */

const EndingScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const quote = s.quote ?? ["SWASEMBADA ITU SOAL PRODUKSI.", "KESEJAHTERAAN ITU SOAL HARGA."];
  const pose = {...idle(t, 8), headTilt: 6, lookY: -0.3, shL: -14, elL: 20};
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: TOP, width: CW}}>
        <Kicker text={s.kicker ?? "PENUTUP"} f={f} color={INK} />
        <div style={{height: 10}} />
        <div style={{fontFamily: DISPLAY, fontSize: 170, lineHeight: 0.7, color: RED, opacity: prog(f, 4, 22, eOut)}}>&ldquo;</div>
        <div style={{marginTop: -30}}>
          {quote.map((q, i) => {
            const k = prog(f, 10 + i * 8, 10 + i * 8 + 26, eOut);
            return (
              <div key={i} style={{overflow: "hidden"}}>
                <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 62, lineHeight: 1.08, color: INK, textTransform: "uppercase", transform: `translateY(${lerp(105, 0, k)}%)`}}>
                  {rich(q)}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{height: 24}} />
        <Rule f={f} at={26} thick={3} />
        <div style={{height: 14}} />
        <Deck text={s.deck ?? "Kalau yang satu naik tapi yang lain jalan di tempat, untuk siapa panen ini?"} f={f} at={30} size={32} />
      </div>

      <div style={{position: "absolute", left: M, top: 830, width: CW, display: "flex", gap: 24, alignItems: "flex-end"}}>
        <Fig w={380} h={430} f={f} at={24} pose={pose} look={CASUAL} expr={s.expr ?? "sad"} scale={1.78} label="PETANI \u2022 0,3 HEKTAR" />
        <div style={{flex: 1, paddingBottom: 90}}>
          <Stamp text={s.stamp ?? "UNTUK SIAPA?"} f={f} at={36} size={26} />
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

export const KoranEngine: React.FC<{script: StoryScript; narration?: string}> = ({script, narration}) => {
  const fade = script.fade ?? 12;
  const cues: CaptionCue[] = script.scenes.flatMap((s) => s.cues ?? []);
  return (
    <AbsoluteFill>
      <Newsprint />
      {script.scenes.map((s) => {
        const Comp = TYPES[s.type] ?? HookScene;
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.len + fade}>
            <Roller len={s.len} fade={fade}>
              <Comp s={s} />
            </Roller>
          </Sequence>
        );
      })}
      <Nameplate />
      <PageFrame />
      <EditorialCaptions cues={cues} />
      <Narration file={narration} />
    </AbsoluteFill>
  );
};
