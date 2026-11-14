import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {Narration} from "../audio/Narration";
import {cheer, idle, mix, point, walk} from "../rig/poses";
import {Expr, Look, Pose, Stickman} from "../rig/Stickman";
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import {FPS, H, W} from "../styles/palette";
import {clamp, eOut, lerp, noise, prog} from "../motion/ease";
import {CaptionCue} from "../captions/CaptionTrack";
import {SceneSpec, StoryScript} from "./StoryEngine";
export type {SceneSpec, StoryScript} from "./StoryEngine";
import {loadFont as loadType} from "@remotion/google-fonts/SpecialElite";
import {loadFont as loadMono} from "@remotion/google-fonts/IBMPlexMono";
import {loadFont as loadBebas} from "@remotion/google-fonts/BebasNeue";

/*
 * ArsipEngine — gaya DOKUMEN ARSIP / TIMELINE (berbeda dari KoranEngine & KoranFlipEngine).
 *
 * Ciri visual:
 *   - kertas dokumen tua sepia + lubang arsip di tepi kiri + noda lipatan
 *   - mesin tik (Special Elite) untuk teks dokumen, Bebas untuk angka tahun besar
 *   - ODOMETER: angka tahun berputar seperti counter (bukan fade biasa)
 *   - stempel "ARSIP" muncul dengan getar (shake + slam), bukan overshoot halus
 *   - GARIS WAKTU: ruler tahun yang digambar bertahap + pin jatuh
 *   - transisi: FOLDER TURUN menimpa halaman (translateY + bayangan), bukan flip
 *
 * Dipakai via field "engine":"ArsipEngine" di script JSON.
 */

// ---------- palet ----------
const PAPER = "#EFE3C8";
const PAPER_D = "#E2D2B0";
const PAPER_L = "#F7EFDC";
const INK = "#2A2118";
const INK_S = "#5C4C39";
const STAMP = "#9A2B1F";
const TEAL = "#1F5F5B";
const FADE = 16;

// ---------- font ----------
const TYPE = loadType("normal", {weights: ["400"], subsets: ["latin"]}).fontFamily;
const MONO = loadMono("normal", {weights: ["400", "600", "700"], subsets: ["latin"]}).fontFamily;
const BIG = loadBebas("normal", {weights: ["400"], subsets: ["latin"]}).fontFamily;

// ---------- layout ----------
const M = 64;
const CW = W - M * 2;   // 952
const HEAD_Y = 84;      // awal header arsip
const BODY_Y = 268;     // awal isi

/** "*teks*" -> aksen stempel (merah bata). */
const red = (s: string) =>
  s.split(/(\*[^*]+\*)/g).map((p, i) =>
    p.startsWith("*") && p.endsWith("*") ? (
      <span key={i} style={{color: STAMP}}>{p.slice(1, -1)}</span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    ),
  );

/* ---------- tekstur kertas arsip ---------- */

const PaperBg: React.FC = () => {
  const stains: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const cx = (noise(i * 2.1, 3) * 0.5 + 0.5) * W;
    const cy = (noise(i * 1.3, 9) * 0.5 + 0.5) * H;
    const r = 60 + Math.abs(noise(i * 3.7, 1)) * 220;
    stains.push(<circle key={`s${i}`} cx={cx} cy={cy} r={r} fill={INK} opacity={0.018} />);
  }
  const holes: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const cy = 400 + i * 300;
    holes.push(<circle key={`h${i}`} cx={26} cy={cy} r={9} fill={PAPER_D} stroke={INK} strokeWidth={2} opacity={0.55} />);
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0}}>
      <defs>
        <radialGradient id="agsep" cx="0.5" cy="0.42" r="0.75">
          <stop offset="0%" stopColor={PAPER_L} />
          <stop offset="62%" stopColor={PAPER} />
          <stop offset="100%" stopColor={PAPER_D} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#agsep)" />
      {stains}
      {holes}
      <line x1={0} y1={960} x2={W} y2={962} stroke={INK} strokeWidth={1.5} opacity={0.06} />
    </svg>
  );
};

/** Debu melayang pelan — nuansa arsip lama. */
const Dust: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const parts: React.ReactNode[] = [];
  for (let i = 0; i < 34; i++) {
    const x0 = (noise(i * 4.1, i) * 0.5 + 0.5) * W;
    const y0 = (noise(i * 2.9, i + 7) * 0.5 + 0.5) * H;
    const x = x0 + Math.sin(t * 0.5 + i) * 16;
    const y = y0 - ((t * 9 + i * 40) % H) * 0.12;
    parts.push(<circle key={i} cx={x} cy={y} r={1.4 + (i % 3) * 0.9} fill={INK} opacity={0.10} />);
  }
  return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>{parts}</svg>;
};

/* ---------- header arsip (folder tab) ---------- */

const ArchiveHead: React.FC<{kicker: string; idx: number; tag: string}> = ({kicker, idx, tag}) => {
  const f = useCurrentFrame();
  const k = prog(f, 2, 18, eOut);
  return (
    <div style={{position: "absolute", left: M, top: HEAD_Y, width: CW, opacity: k}}>
      <div style={{display: "flex", alignItems: "flex-end", gap: 14}}>
        <div style={{background: INK, color: PAPER_L, fontFamily: MONO, fontWeight: 700, fontSize: 19, letterSpacing: 3, padding: "7px 16px"}}>
          {tag}
        </div>
        <div style={{flex: 1, fontFamily: TYPE, fontSize: 22, color: INK_S, letterSpacing: 0.5, transform: `translateX(${lerp(-14, 0, k)}px)`}}>
          {kicker}
        </div>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 18, letterSpacing: 2, color: INK_S}}>
          LEMBAR {String(idx).padStart(2, "0")}/07
        </div>
      </div>
      <div style={{height: 8}} />
      <div style={{height: 3, background: INK}} />
      <div style={{height: 2, background: INK, marginTop: 4, width: `${k * 100}%`}} />
    </div>
  );
};

/* ---------- odometer tahun ---------- */

const Odometer: React.FC<{text: string; f: number; at?: number; size?: number; dur?: number; color?: string}> = ({text, f, at = 6, size = 132, dur = 30, color = INK}) => {
  const k = clamp((f - at) / dur);
  const ek = eOut(k);
  return (
    <div style={{display: "flex", fontFamily: BIG, fontSize: size, lineHeight: 0.82, color, letterSpacing: 1}}>
      {text.split("").map((ch, i) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={i} style={{display: "inline-block", opacity: k, transform: `translateY(${lerp(-8, 0, ek)}px)`, padding: "0 2px"}}>
              {ch}
            </span>
          );
        }
        const target = parseInt(ch, 10);
        const stagger = Math.min(0.85, (i / Math.max(1, text.length)) * 0.55);
        const kk = clamp((k - stagger) / (1 - stagger));
        const pos = (1 - Math.pow(1 - kk, 3)) * (target + 10) - 10; // berhenti di angka target
        return (
          <span key={i} style={{display: "inline-block", overflow: "hidden", height: size * 0.88, width: size * 0.56, position: "relative"}}>
            <span style={{position: "absolute", left: 0, top: 0, transform: `translateY(${-pos * size * 0.88}px)`}}>
              {Array.from({length: 22}, (_, d) => (
                <div key={d} style={{height: size * 0.88, lineHeight: 0.88, textAlign: "center"}}>{d % 10}</div>
              ))}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/* ---------- stempel arsip (slam + getar) ---------- */

const StampSlam: React.FC<{text: string; f: number; at?: number; size?: number; color?: string; rot?: number; sub?: string}> = ({text, f, at = 18, size = 44, color = STAMP, rot = -9, sub}) => {
  const k = prog(f, at, at + 9, eOut);
  if (k <= 0.01) return null;
  const s = interpolate(k, [0, 1], [2.1, 1]);
  const shake = k >= 1 ? Math.sin((f - at - 9) * 2.2) * Math.max(0, 4 - (f - at - 9) * 0.35) : 0;
  return (
    <div style={{
      display: "inline-block", border: `5px solid ${color}`, color, padding: "8px 18px 10px",
      transform: `rotate(${rot}deg) translate(${shake}px, ${-shake * 0.6}px) scale(${s})`,
      opacity: Math.min(1, k * 1.25), textAlign: "center",
    }}>
      <div style={{fontFamily: BIG, fontSize: size, lineHeight: 0.92, letterSpacing: 4}}>{text}</div>
      {sub ? <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 15, letterSpacing: 3, marginTop: 2}}>{sub}</div> : null}
    </div>
  );
};

/* ---------- strip tanggal berjalan (footer) ---------- */

const TimeCode: React.FC<{total: number; yearFrom?: number; yearTo?: number}> = ({total, yearFrom = 1945, yearTo = 2026}) => {
  const f = useCurrentFrame();
  const k = clamp(f / Math.max(1, total));
  const year = Math.round(lerp(yearFrom, yearTo, k));
  return (
    <div style={{position: "absolute", left: M, top: 1268, width: CW, display: "flex", alignItems: "center", gap: 12, fontFamily: MONO, fontSize: 17, letterSpacing: 3, color: INK_S, opacity: 0.75}}>
      <span>ARSIP NASIONAL</span>
      <div style={{flex: 1, height: 1, background: INK_S, opacity: 0.45}} />
      <span>REKAM {year}</span>
      <span style={{width: 8, height: 8, background: STAMP, display: "inline-block", opacity: 0.4 + Math.sin(f / 8) * 0.35}} />
    </div>
  );
};

/* ---------- kartu dokumen ---------- */

const DocCard: React.FC<{f: number; at?: number; children: React.ReactNode; style?: React.CSSProperties; rot?: number}> = ({f, at = 10, children, style, rot = -0.6}) => {
  const k = prog(f, at, at + 20, eOut);
  return (
    <div style={{
      background: PAPER_L, border: `2px solid ${INK}`, boxShadow: `6px 6px 0 ${INK}22`,
      opacity: k, transform: `translateY(${lerp(22, 0, k)}px) rotate(${lerp(rot * 2.2, rot, k)}deg)`,
      ...style,
    }}>
      {children}
    </div>
  );
};

/** Foto arsip: stickman dalam bingkai duotone + label mesin tik. */
const Photo: React.FC<{
  w: number; h: number; f: number; at?: number; scale?: number;
  look: Look; expr?: Expr; pose?: Pose; label?: string; tint?: string; tape?: boolean;
}> = ({w, h, f, at = 12, scale = 1.9, look, expr = "neutral", pose, label, tint = INK, tape = true}) => {
  const k = prog(f, at, at + 24, eOut);
  const t = f / FPS;
  const figH = 268 * scale + 20;
  const figW = figH * 0.68;
  const vbH = figH + 30;
  const vbW = figW + 40;
  const vbY = -figH - 10;
  return (
    <div style={{width: w, height: h, position: "relative", opacity: k, transform: `translateY(${lerp(18, 0, k)}px) rotate(${lerp(2.4, 1.2, k)}deg)`}}>
      <div style={{position: "absolute", inset: 0, background: PAPER_L, border: `2px solid ${INK}`, padding: 10, boxSizing: "border-box"}}>
        <div style={{position: "relative", width: "100%", height: "100%", border: `1px solid ${INK}44`, background: PAPER_D, overflow: "hidden"}}>
          <div style={{position: "absolute", inset: 0, background: `radial-gradient(${tint}44 1.3px, transparent 1.5px)`, backgroundSize: "7px 7px", opacity: 0.65, mixBlendMode: "multiply"}} />
          <svg viewBox={`${-vbW / 2} ${vbY} ${vbW} ${vbH}`} preserveAspectRatio="xMidYMax meet" style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}>
            <Stickman x={0} y={0} scale={scale} facing={1} pose={pose ?? idle(t, 4)} look={look} expr={expr} />
          </svg>
        </div>
      </div>
      {tape ? (
        <>
          <div style={{position: "absolute", left: -14, top: -12, width: 78, height: 26, background: "#D9C9A5", opacity: 0.85, transform: "rotate(-24deg)", border: `1px solid ${INK}22`}} />
          <div style={{position: "absolute", right: -12, top: -10, width: 66, height: 24, background: "#D9C9A5", opacity: 0.8, transform: "rotate(18deg)", border: `1px solid ${INK}22`}} />
        </>
      ) : null}
      {label ? (
        <div style={{position: "absolute", left: 10, right: 10, bottom: -16, background: PAPER_L, borderTop: `1px solid ${INK}55`, fontFamily: TYPE, fontSize: 16, color: INK_S, padding: "3px 6px", textAlign: "center", letterSpacing: 0.5}}>
          {label}
        </div>
      ) : null}
    </div>
  );
};

/* ---------- garis waktu ---------- */

const YearRuler: React.FC<{
  f: number; at?: number; width: number;
  marks: {year: string; label?: string; side?: 1 | -1; color?: string}[];
  head: string; headLabel: string;
}> = ({f, at = 6, width, marks, head, headLabel}) => {
  const k = prog(f, at, at + 24, eOut);
  return (
    <div style={{width, position: "relative"}}>
      <div style={{position: "relative", height: 68}}>
        <div style={{position: "absolute", left: 0, top: 40, width: `${k * 100}%`, height: 4, background: INK}} />
        {marks.map((m, i) => {
          const mk = prog(f, at + 12 + i * 5, at + 26 + i * 5, eOut);
          const x = (i / Math.max(1, marks.length - 1)) * width;
          const up = (m.side ?? 1) === 1;
          return (
            <div key={i} style={{position: "absolute", left: x - 30, top: 0, width: 60, opacity: mk}}>
              <div style={{
                position: "absolute", left: 28, top: up ? 8 : 48, width: 3, height: 28,
                background: m.color ?? INK, transform: `scaleY(${mk})`, transformOrigin: up ? "bottom" : "top",
              }} />
              <div style={{
                position: "absolute", left: 0, top: up ? -2 : 46, width: 60, textAlign: "center",
                fontFamily: MONO, fontWeight: 700, fontSize: 21, letterSpacing: 1,
                color: m.color ?? INK, transform: `translateY(${lerp(up ? -10 : 10, 0, mk)}px)`,
              }}>
                {m.year}
              </div>
              {m.label ? (
                <div style={{position: "absolute", left: -22, top: up ? 34 : -34, width: 104, textAlign: "center", fontFamily: TYPE, fontSize: 15, color: INK_S, opacity: mk}}>
                  {m.label}
                </div>
              ) : null}
            </div>
          );
        })}
        {/* pin "sekarang" */}
        <div style={{
          position: "absolute", left: width - 12, top: 40 - 13, opacity: prog(f, at + 20, at + 34, eOut),
          transform: `translateY(${lerp(-24, 0, prog(f, at + 20, at + 34, eOut))}px)`,
        }}>
          <div style={{width: 26, height: 26, borderRadius: "50% 50% 50% 0", background: STAMP, transform: "rotate(-45deg)", border: `2px solid ${INK}`}} />
        </div>
      </div>
      <div style={{display: "flex", justifyContent: "space-between", marginTop: 6}}>
        <div style={{fontFamily: TYPE, fontSize: 18, color: INK_S, opacity: k}}>{headLabel}</div>
        <div style={{fontFamily: BIG, fontSize: 32, color: STAMP, letterSpacing: 1, opacity: prog(f, at + 24, at + 40, eOut)}}>{head}</div>
      </div>
    </div>
  );
};

/* =========================================================
 * 1. HOOK — kursi kosong di folder arsip
 * ========================================================= */

const HookScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const k = prog(f, 0, 20, eOut);
  const pose = {...idle(t, 2), shR: 28, elR: 46, headTilt: 5, lean: -2};
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: BODY_Y, width: CW}}>
        <div style={{fontFamily: TYPE, fontSize: 24, color: INK_S, letterSpacing: 1, opacity: k}}>
          {s.deck ?? "berkas: kekosongan jabatan wakil presiden"}
        </div>
        <div style={{height: 14}} />
        <div style={{fontFamily: BIG, fontSize: 118, lineHeight: 0.92, color: INK, textTransform: "uppercase", letterSpacing: 1}}>
          <div style={{overflow: "hidden"}}>
            <div style={{transform: `translateY(${lerp(110, 0, prog(f, 4, 24, eOut))}%)`}}>HAMPIR</div>
          </div>
          <div style={{overflow: "hidden"}}>
            <div style={{transform: `translateY(${lerp(110, 0, prog(f, 10, 30, eOut))}%)`, color: STAMP}}>17 TAHUN</div>
          </div>
          <div style={{overflow: "hidden"}}>
            <div style={{transform: `translateY(${lerp(110, 0, prog(f, 16, 36, eOut))}%)`}}>TANPA WAPRES</div>
          </div>
        </div>
        <div style={{height: 18}} />
        <div style={{display: "flex", alignItems: "center", gap: 16}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 4, color: PAPER_L, background: TEAL, padding: "8px 14px", opacity: prog(f, 24, 40, eOut)}}>
            {s.kicker ?? "1956 \u2014 1973"}
          </div>
          <div style={{fontFamily: TYPE, fontSize: 23, color: INK_S, opacity: prog(f, 28, 44, eOut)}}>
            dan negara tetap jalan
          </div>
        </div>
      </div>

      <div style={{position: "absolute", left: M, top: 760, width: CW, display: "flex", gap: 26, alignItems: "flex-start"}}>
        <Photo w={430} h={470} f={f} at={22} pose={pose} look={CASUAL} expr={s.expr ?? "calm"} scale={1.85} label="foto arsip — kursi wakil presiden" />
        <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 18, paddingTop: 26}}>
          <DocCard f={f} at={34} rot={1.2} style={{padding: "18px 20px"}}>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 17, letterSpacing: 3, color: STAMP}}>TEMUAN</div>
            <div style={{height: 8}} />
            <div style={{fontFamily: TYPE, fontSize: 25, lineHeight: 1.34, color: INK}}>
              {red(s.note ?? "Kursi itu pernah *kosong* lebih lama daripada usia sekolah satu anak. Dan tidak ada yang panik.")}
            </div>
          </DocCard>
          <div style={{display: "flex", justifyContent: "flex-end", paddingRight: 6}}>
            <StampSlam text={s.stamp ?? "KOSONG"} f={f} at={44} sub="arsip 1956" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
 * 2. TIMELINE — Hatta mundur, lalu sunyi
 * ========================================================= */

const TimelineScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const marks = s.eras ?? [
    {year: "1956", label: "Hatta mundur", side: -1 as const, color: STAMP},
    {year: "1966", label: "Soekarno lengser", side: 1 as const},
    {year: "1973", label: "kursi terisi lagi", side: -1 as const, color: TEAL},
  ];
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: BODY_Y, width: CW}}>
        <div style={{fontFamily: TYPE, fontSize: 22, color: INK_S, letterSpacing: 1, opacity: prog(f, 2, 16, eOut)}}>
          {s.deck ?? "berkas 01 \u2014 pengunduran diri"}
        </div>
        <div style={{height: 8}} />
        <Odometer text={s.stats?.[0]?.value ?? "1956"} f={f} at={4} size={150} color={STAMP} />
        <div style={{height: 6}} />
        <div style={{fontFamily: BIG, fontSize: 54, lineHeight: 1, color: INK, textTransform: "uppercase", opacity: prog(f, 14, 30, eOut), transform: `translateX(${lerp(-18, 0, prog(f, 14, 30, eOut))}px)`}}>
          {s.headline?.[0] ?? "HATTA LETAKKAN JABATAN"}
        </div>
        <div style={{height: 12}} />
        <div style={{fontFamily: TYPE, fontSize: 25, lineHeight: 1.36, color: INK_S, maxWidth: 900, opacity: prog(f, 18, 34, eOut)}}>
          {red(s.note ?? "Alasannya bukan kursi, tapi arah: ia menolak demokrasi terpimpin yang digulirkan Soekarno. Surat mundurnya berlaku 1 Desember 1956.")}
        </div>
        <div style={{height: 30}} />
        <YearRuler f={f} at={22} width={CW} marks={marks} head={s.stats?.[1]?.value ?? "17 TAHUN"} headLabel={s.stats?.[1]?.label ?? "tanpa wakil presiden"} />
      </div>

      <div style={{position: "absolute", left: M, top: 820, width: CW, display: "flex", gap: 22, alignItems: "flex-end"}}>
        <Photo w={330} h={380} f={f} at={30} look={JACKET_BLUE} expr="determined" scale={1.62} label="Hatta — mundur 1956" pose={{...idle(t, 8), shR: 34, elR: 8, headTilt: 2}} />
        <div style={{flex: 1}}>
          <DocCard f={f} at={38} rot={-1} style={{padding: "16px 18px"}}>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: STAMP}}>CATATAN</div>
            <div style={{height: 6}} />
            <div style={{fontFamily: TYPE, fontSize: 23, lineHeight: 1.32, color: INK}}>
              {s.pro ?? "Kursi itu dibiarkan kosong selama bertahun-tahun \u2014 dan pemerintahan terus berjalan."}
            </div>
          </DocCard>
          <div style={{height: 16, display: "flex", justifyContent: "flex-end"}}>
            <StampSlam text={s.stamp ?? "KOSONG 1956"} f={f} at={48} size={34} sub="tanpa pengganti" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
 * 3. ARSIP — pasa reformasi, kursi kosong berulang
 * ========================================================= */

const ArchItem: React.FC<{n: number; year: string; title: string; body: string; f: number; at: number; color: string}> = ({n, year, title, body, f, at, color}) => {
  const k = prog(f, at, at + 22, eOut);
  if (k <= 0.01) return null;
  return (
    <div style={{display: "flex", gap: 16, opacity: k, transform: `translateX(${lerp(-26, 0, k)}px)`}}>
      <div style={{width: 92, flexShrink: 0}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: 2, color: PAPER_L, background: color, padding: "4px 6px", textAlign: "center"}}>{n}</div>
        <div style={{fontFamily: BIG, fontSize: 40, lineHeight: 1, color: INK, marginTop: 4}}>{year}</div>
      </div>
      <div style={{flex: 1, borderLeft: `2px solid ${INK}33`, paddingLeft: 16}}>
        <div style={{fontFamily: BIG, fontSize: 40, lineHeight: 1, color: INK, textTransform: "uppercase"}}>{title}</div>
        <div style={{height: 6}} />
        <div style={{fontFamily: TYPE, fontSize: 23, lineHeight: 1.34, color: INK_S}}>{red(body)}</div>
      </div>
    </div>
  );
};

const ArchScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const rows = s.rows ?? [
    {title: "1998", body: "Soeharto lengser. Habibie naik jadi presiden, kursi wapres *kosong tujuh belas bulan*."},
    {title: "2001", body: "Gus Dur diberhentikan MPR. Megawati naik, kursi kosong *tiga hari*."},
    {title: "2026", body: "Gibran mundur. Kursi kosong lagi, dan kali ini *ada aturannya*."},
  ];
  const colors = [STAMP, TEAL, INK];
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: BODY_Y, width: CW}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", opacity: prog(f, 2, 16, eOut)}}>
          <div style={{fontFamily: TYPE, fontSize: 22, color: INK_S, letterSpacing: 1}}>{s.deck ?? "berkas 02 \u2014 era reformasi"}</div>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: STAMP}}>3 KEKOSONGAN</div>
        </div>
        <div style={{height: 10}} />
        <div style={{fontFamily: BIG, fontSize: 76, lineHeight: 0.94, color: INK, textTransform: "uppercase", letterSpacing: 0.5}}>
          {s.headline?.[0] ?? "KURSI ITU"}{" "}
          <span style={{color: STAMP}}>{s.headline?.[1] ?? "KEMBALI"}</span>
          <br />
          {s.headline?.[2] ?? "KOSONG"}
        </div>
        <div style={{height: 14}} />
        <div style={{height: 3, background: INK, width: `${prog(f, 10, 28, eOut) * 100}%`}} />
        <div style={{height: 26}} />
        <div style={{display: "flex", flexDirection: "column", gap: 26}}>
          {rows.slice(0, 3).map((r, i) => (
            <ArchItem key={i} n={i + 1} year={r.title} title={i === 0 ? "HABIBIE" : i === 1 ? "MEGAWATI" : "SEKARANG"} body={r.body} f={f} at={20 + i * 12} color={colors[i] ?? INK} />
          ))}
        </div>
      </div>

      <div style={{position: "absolute", left: M, top: 900, width: 300}}>
        <Photo w={300} h={330} f={f} at={34} look={SHIRT_ORANGE} expr="worried" scale={1.5} label="arsip — transisi" pose={{...idle(t, 11), shL: -20, shR: 20, headTilt: 4}} />
      </div>
      <div style={{position: "absolute", left: 400, top: 980, width: 560, textAlign: "right"}}>
        <StampSlam text={s.stamp ?? "SELALU TERULANG"} f={f} at={48} size={30} rot={-6} sub="pola 1956 → 2026" />
      </div>
    </div>
  );
};

/* =========================================================
 * 4. DOKUMEN — apa kata konstitusi
 * ========================================================= */

const Clause: React.FC<{no: string; text: string; f: number; at: number; color: string}> = ({no, text, f, at, color}) => {
  const k = prog(f, at, at + 20, eOut);
  const typed = Math.floor(clamp((f - at) / 26) * text.length);
  return (
    <div style={{display: "flex", gap: 14, opacity: k, transform: `translateY(${lerp(14, 0, k)}px)`}}>
      <div style={{width: 6, background: color, flexShrink: 0}} />
      <div style={{flex: 1}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 17, letterSpacing: 3, color}}>{no}</div>
        <div style={{height: 4}} />
        <div style={{fontFamily: TYPE, fontSize: 27, lineHeight: 1.36, color: INK}}>
          {text.slice(0, typed)}
          {typed < text.length ? <span style={{background: INK, display: "inline-block", width: 12, height: 26, marginLeft: 2, opacity: 0.7}} /> : null}
        </div>
      </div>
    </div>
  );
};

const DocScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const clauses = s.clauses ?? [
    {no: "SEBELUM 2001", text: "UUD 1945 tidak mengatur pengisian kursi wapres yang kosong."},
    {no: "PASAL 8 AYAT 2", text: "Presiden ajukan dua calon, MPR pilih wakil presiden dalam 60 hari."},
    {no: "AMANDEMEN 2001", text: "Aturan ini lahir dari Perubahan Ketiga UUD 1945, setelah reformasi."},
  ];
  const colors = [TEAL, STAMP, INK];
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: BODY_Y, width: CW}}>
        <div style={{fontFamily: TYPE, fontSize: 22, color: INK_S, letterSpacing: 1, opacity: prog(f, 2, 16, eOut)}}>
          {s.deck ?? "berkas 03 \u2014 salinan UUD 1945"}
        </div>
        <div style={{height: 10}} />
        <div style={{fontFamily: BIG, fontSize: 80, lineHeight: 0.94, color: INK, textTransform: "uppercase"}}>
          {s.headline?.[0] ?? "DULU TIDAK ADA"}{" "}
          <span style={{color: STAMP}}>{s.headline?.[1] ?? "ATURANNYA"}</span>
        </div>
        <div style={{height: 16}} />
        <div style={{height: 2, background: INK}} />
        <div style={{height: 22}} />
        <div style={{display: "flex", flexDirection: "column", gap: 22, width: CW - 20}}>
          {clauses.map((c, i) => (
            <Clause key={i} no={c.no} text={c.text} f={f} at={18 + i * 14} color={colors[i] ?? INK} />
          ))}
        </div>
      </div>

      <div style={{position: "absolute", left: M, top: 880, width: CW, display: "flex", gap: 22, alignItems: "flex-start"}}>
        <Photo w={300} h={340} f={f} at={30} look={JACKET_BLUE} expr="focused" scale={1.5} label="rapat paripurna" pose={{...idle(t, 7), shR: 26, elR: 26}} />
        <div style={{flex: 1}}>
          <DocCard f={f} at={38} rot={0.8} style={{padding: "16px 18px"}}>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: TEAL}}>SIMPULAN</div>
            <div style={{height: 6}} />
            <div style={{fontFamily: TYPE, fontSize: 25, lineHeight: 1.34, color: INK}}>
              {red(s.note ?? "Artinya: dulu kekosongan bisa *ber tahun-tahun* karena tidak ada mekanisme. Sekarang wajib selesai dalam *60 hari*.")}
            </div>
          </DocCard>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
 * 5. PROKONTRA
 * ========================================================= */

const Side: React.FC<{
  side: "pro" | "kontra"; title: string; body: string[]; f: number; at: number;
  look: Look; expr: Expr; seed: number;
}> = ({side, title, body, f, at, look, expr, seed}) => {
  const k = prog(f, at, at + 24, eOut);
  const t = f / FPS;
  const col = side === "pro" ? TEAL : STAMP;
  if (k <= 0.01) return null;
  return (
    <div style={{flex: 1, opacity: k, transform: `translateY(${lerp(24, 0, k)}px) rotate(${lerp(side === "pro" ? -2.2 : 2.2, side === "pro" ? -0.8 : 0.8, k)}deg)`}}>
      <div style={{background: col, color: PAPER_L, fontFamily: BIG, fontSize: 34, letterSpacing: 6, padding: "6px 0", textAlign: "center"}}>
        {side === "pro" ? "ARGUMEN PRO" : "ARGUMEN KONTRA"}
      </div>
      <div style={{border: `2px solid ${INK}`, borderTop: "none", background: PAPER_L, padding: "16px 16px 18px"}}>
        <div style={{fontFamily: BIG, fontSize: 38, lineHeight: 1, color: INK, textTransform: "uppercase"}}>{title}</div>
        <div style={{height: 10}} />
        <div style={{height: 250, position: "relative", border: `1px solid ${INK}55`, background: PAPER_D, overflow: "hidden"}}>
          <div style={{position: "absolute", inset: 0, background: `radial-gradient(${INK}44 1.3px, transparent 1.5px)`, backgroundSize: "7px 7px", opacity: 0.5, mixBlendMode: "multiply"}} />
          <svg viewBox="-172 -430 344 446" preserveAspectRatio="xMidYMax meet" style={{width: "100%", height: "100%"}}>
            <Stickman x={0} y={0} scale={1.52} facing={side === "pro" ? 1 : -1} pose={{...idle(t, seed), lean: 4}} look={look} expr={expr} />
          </svg>
        </div>
        <div style={{height: 12}} />
        {body.map((p, i) => (
          <div key={i} style={{fontFamily: TYPE, fontSize: 22, lineHeight: 1.32, color: INK_S, marginBottom: 8}}>{red(p)}</div>
        ))}
      </div>
    </div>
  );
};

const ProKontraScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: BODY_Y, width: CW}}>
        <div style={{fontFamily: TYPE, fontSize: 22, color: INK_S, letterSpacing: 1, opacity: prog(f, 2, 16, eOut)}}>
          {s.deck ?? "berkas 04 \u2014 dua pendapat"}
        </div>
        <div style={{height: 10}} />
        <div style={{fontFamily: BIG, fontSize: 74, lineHeight: 0.94, color: INK, textTransform: "uppercase"}}>
          {s.headline?.[0] ?? "PERLU"}{" "}
          <span style={{color: STAMP}}>{s.headline?.[1] ?? "WAPRES?"}</span>
        </div>
        <div style={{height: 14}} />
        <div style={{height: 3, background: INK}} />
        <div style={{height: 20}} />
        <div style={{display: "flex", gap: 20, alignItems: "flex-start"}}>
          <Side side="pro" title={s.pro ?? "TETAP PERLU"} body={s.proBody ?? ["Suksesi negara butuh lapis kedua.", "Presiden bisa menyusun tandem baru."]} f={f} at={18} look={JACKET_BLUE} expr="determined" seed={6} />
          <Side side="kontra" title={s.kontra ?? "CUMA SIMBOL"} body={s.kontraBody ?? ["Tanpa tugas teknis yang jelas.", "Ganti tandem = guncang politik."]} f={f} at={30} look={SHIRT_ORANGE} expr="worried" seed={9} />
        </div>
      </div>
    </div>
  );
};

/* =========================================================
 * 6. DAMPAK — kursi kosong vs negara jalan
 * ========================================================= */

const Meter: React.FC<{value: string; label: string; sub: string; f: number; at: number; color: string}> = ({value, label, sub, f, at, color}) => {
  const k = prog(f, at, at + 22, eOut);
  return (
    <div style={{opacity: k, transform: `translateY(${lerp(18, 0, k)}px)`}}>
      <div style={{fontFamily: BIG, fontSize: 96, lineHeight: 0.9, color}}>{value}</div>
      <div style={{height: 4}} />
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 17, letterSpacing: 2, color: INK}}>{label}</div>
      <div style={{fontFamily: TYPE, fontSize: 20, color: INK_S, marginTop: 3}}>{sub}</div>
    </div>
  );
};

const ImpactScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const pose = {...idle(t, 13), shL: -14, shR: 14, headTilt: -2, lookY: -0.4};
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: BODY_Y, width: CW}}>
        <div style={{fontFamily: TYPE, fontSize: 22, color: INK_S, letterSpacing: 1, opacity: prog(f, 2, 16, eOut)}}>
          {s.deck ?? "berkas 05 \u2014 dampaknya"}
        </div>
        <div style={{height: 8}} />
        <div style={{fontFamily: BIG, fontSize: 78, lineHeight: 0.94, color: INK, textTransform: "uppercase"}}>
          {s.headline?.[0] ?? "NEGARA"}{" "}
          <span style={{color: TEAL}}>{s.headline?.[1] ?? "TETAP JALAN"}</span>
        </div>
        <div style={{height: 12}} />
        <div style={{fontFamily: TYPE, fontSize: 25, lineHeight: 1.34, color: INK_S, maxWidth: 880, opacity: prog(f, 12, 28, eOut)}}>
          {red(s.note ?? "Yang berhenti bukan roda pemerintahan, tapi *lapis pengaman*: kalau presiden jatuh, siapa yang naik?")}
        </div>
        <div style={{height: 26}} />
        <div style={{display: "flex", gap: 12}}>
          <div style={{flex: 1}}><Meter value={s.stats?.[0]?.value ?? "17 TH"} label="KOSONG 1956-1973" sub="tanpa pengganti" f={f} at={20} color={STAMP} /></div>
          <div style={{width: 2, background: `${INK}33`}} />
          <div style={{flex: 1}}><Meter value={s.stats?.[1]?.value ?? "60 HARI"} label="BATAS SEKARANG" sub="wajib selesai" f={f} at={30} color={TEAL} /></div>
        </div>
      </div>

      <div style={{position: "absolute", left: M, top: 800, width: CW, display: "flex", gap: 24, alignItems: "flex-start"}}>
        <Photo w={420} h={420} f={f} at={26} pose={pose} look={CASUAL} expr={s.expr ?? "calm"} scale={1.8} label="layanan publik tetap jalan" />
        <div style={{flex: 1, paddingTop: 34}}>
          <DocCard f={f} at={36} rot={-1.1} style={{padding: "16px 18px"}}>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: STAMP}}>RISIKO</div>
            <div style={{height: 6}} />
            <div style={{fontFamily: TYPE, fontSize: 23, lineHeight: 1.32, color: INK}}>
              {s.pro ?? "Kalau presiden berhenti di tengah jalan dan kursi kosong, konstitusi harus punya jalan keluar yang jelas."}
            </div>
          </DocCard>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
 * 7. ENDING — pertanyaan menggantung
 * ========================================================= */

const EndingScene: React.FC<{s: SceneSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const quote = s.quote ?? ["KALAU 17 TAHUN", "BISA TANPA WAPRES,", "*KENAPA SEKARANG*", "PANIK?"];
  const pose = {...idle(t, 8), headTilt: 6, lookY: -0.3, shL: -16, elL: 18};
  return (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: M, top: BODY_Y, width: CW}}>
        <div style={{fontFamily: TYPE, fontSize: 22, color: INK_S, letterSpacing: 1, opacity: prog(f, 2, 16, eOut)}}>
          {s.deck ?? "lembar penutup \u2014 silakan simpulkan sendiri"}
        </div>
        <div style={{height: 16}} />
        <div style={{fontFamily: BIG, fontSize: 88, lineHeight: 0.94, color: INK, textTransform: "uppercase"}}>
          {quote.map((line, li) => (
            <div key={li} style={{overflow: "hidden"}}>
              <div style={{transform: `translateY(${lerp(108, 0, prog(f, 8 + li * 6, 26 + li * 6, eOut))}%)`}}>{red(line)}</div>
            </div>
          ))}
        </div>
        <div style={{height: 22}} />
        <div style={{height: 3, background: INK, width: `${prog(f, 26, 44, eOut) * 100}%`}} />
        <div style={{height: 16}} />
        <div style={{fontFamily: TYPE, fontSize: 27, lineHeight: 1.34, color: INK_S, maxWidth: 880, opacity: prog(f, 32, 48, eOut)}}>
          {s.note ?? "Atau pertanyaannya lain: kita butuh wapres, atau kita cuma butuh aturan yang jelas?"}
        </div>
      </div>

      <div style={{position: "absolute", left: M, top: 870, width: CW, display: "flex", gap: 24, alignItems: "flex-end"}}>
        <Photo w={350} h={350} f={f} at={30} pose={pose} look={SHIRT_ORANGE} expr={s.expr ?? "sad"} scale={1.6} label="penonton — tulis di komen" />
        <div style={{flex: 1, paddingBottom: 26}}>
          <StampSlam text={s.stamp ?? "TULIS DI KOMEN"} f={f} at={44} size={30} rot={-8} sub="pendapatmu" />
        </div>
      </div>
    </div>
  );
};

/* ---------- transisi: folder turun menimpa halaman ---------- */

const FolderDrop: React.FC<{len: number; fade: number; children: React.ReactNode}> = ({len, fade, children}) => {
  const f = useCurrentFrame();
  const kIn = clamp(f / fade);
  const kOut = clamp((f - len) / fade);
  const yIn = lerp(-90, 0, eOut(kIn));
  const yOut = lerp(0, 46, eOut(kOut));
  const op = f <= len ? clamp(kIn * 1.6) : 1 - kOut;
  const rot = lerp(-1.6, 0, eOut(kIn));
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <div style={{position: "absolute", inset: 0, transform: `translateY(${f <= len ? yIn : yOut}px) rotate(${f <= len ? rot : 0}deg)`, opacity: op}}>
        {children}
      </div>
      {/* bayangan folder di tepi atas */}
      <div style={{position: "absolute", left: 0, right: 0, top: 0, height: f <= len ? 140 * (1 - kIn) : 60 * kOut, background: `linear-gradient(180deg, ${INK}55, ${INK}00)`, pointerEvents: "none"}} />
      {/* garis lipatan kertas saat folder turun */}
      {f <= fade ? (
        <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 2, background: INK, opacity: 0.5 * (1 - kIn)}} />
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------- caption gaya arsip ---------- */

const ArsipCaptions: React.FC<{cues: CaptionCue[]}> = ({cues}) => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    {cues.map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={Math.max(1, c.to - c.from)}>
        <ArsipCue cue={c} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

const ArsipCue: React.FC<{cue: CaptionCue}> = ({cue}) => {
  const f = useCurrentFrame();
  const dur = Math.max(1, cue.to - cue.from);
  const kIn = clamp(f / 6);
  const kOut = clamp((dur - f) / 6);
  const k = Math.min(kIn, kOut);
  if (k <= 0.01) return null;
  const gf = cue.from + f;
  return (
    <div style={{position: "absolute", left: M, width: CW, top: 1312, opacity: k, transform: `translateY(${lerp(10, 0, kIn)}px)`}}>
      <div style={{display: "flex", alignItems: "center", gap: 10}}>
        <div style={{width: 10, height: 10, background: STAMP, opacity: 0.85}} />
        <div style={{flex: 1, height: 2, background: INK}} />
      </div>
      <div style={{
        marginTop: 12, fontFamily: TYPE, fontSize: 38, lineHeight: 1.3, color: INK, textAlign: "left",
        background: `${PAPER_L}D9`, padding: "2px 6px",
      }}>
        {cue.words && cue.words.length ? (
          cue.words.map((w, i) => {
            const active = gf >= w.from && gf < w.to;
            const past = gf >= w.to;
            return (
              <span key={i} style={{color: active ? STAMP : past ? "#8A7A63" : INK, fontWeight: 400}}>
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

/* =========================================================
 * LIVE STAGE — "Jendela Rekaman": foto arsip jadi adegan hidup
 * ========================================================= */

const STAGE_X = M - 10;
const STAGE_Y = 700;
const STAGE_W = CW + 20;
const STAGE_H = 515;

/** Jendela cutaway (frame lokal scene). Dipakai bareng oleh halaman & panel rekaman. */
const cutWindow = (len: number) => ({at: Math.round(len * 0.28), out: Math.round(len * 0.72)});
const cutOpacity = (f: number, at: number, out: number) =>
  Math.min(prog(f, at, at + 14, eOut), 1 - prog(f, out - 14, out, eOut));

/** Napas kamera: slow push-in + handheld drift supaya halaman tidak kaku. */
const CameraDrift: React.FC<{len: number; seed: number; children: React.ReactNode}> = ({len, seed, children}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const z = lerp(1.0, 1.035, clamp(f / Math.max(1, len)));
  const dx = noise(t * 0.55, seed) * 9;
  const dy = noise(t * 0.4, seed + 3) * 6;
  return (
    <div style={{position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px) scale(${z})`, transformOrigin: "50% 42%"}}>
      {children}
    </div>
  );
};

/** Props panggung sederhana (duotone, tipis). */
const EmptyChair: React.FC<{x: number; opacity?: number}> = ({x, opacity = 0.55}) => (
  <g transform={`translate(${x} 0)`} stroke={PAPER_L} fill="none" strokeWidth={3} opacity={opacity} strokeLinecap="round">
    <rect x={-44} y={-112} width={88} height={14} rx={3} />
    <rect x={-44} y={-206} width={14} height={100} rx={3} />
    <line x1={-34} y1={-98} x2={-34} y2={0} />
    <line x1={34} y1={-98} x2={34} y2={0} />
    <line x1={-44} y1={-190} x2={44} y2={-190} />
  </g>
);

const FolderProp: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x={-46} y={-30} width={92} height={60} rx={2} fill={PAPER_L} stroke={INK} strokeWidth={2.5} />
    <path d="M -46 -30 L -46 -38 L -8 -38 L 0 -30 Z" fill={PAPER_D} stroke={INK} strokeWidth={2.5} />
    <line x1={-30} y1={-8} x2={30} y2={-8} stroke={INK} strokeWidth={2} opacity={0.5} />
    <line x1={-30} y1={4} x2={18} y2={4} stroke={INK} strokeWidth={2} opacity={0.4} />
  </g>
);

const DocBoard: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-140} y={-170} width={280} height={340} rx={2} fill={PAPER_L} stroke={INK} strokeWidth={3} />
    <text x={0} y={-120} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={3} fill={STAMP}>PASAL 8</text>
    <line x1={-110} y1={-104} x2={110} y2={-104} stroke={INK} strokeWidth={2} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <line key={i} x1={-110} y1={-74 + i * 32} x2={i % 3 === 2 ? 40 : 110} y2={-74 + i * 32} stroke={INK} strokeWidth={3} opacity={0.35} />
    ))}
  </g>
);

type Act = "stare" | "leave" | "relay" | "sign" | "debate" | "guard" | "ask";
const ACTS: Act[] = ["stare", "leave", "relay", "sign", "debate", "guard", "ask"];

/** Adegan hidup: 1-2 stickman bergerak & berinteraksi, kamera zoom + pan. */
const LiveStage: React.FC<{s: SceneSpec; idx: number}> = ({s, idx}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const len = s.len;
  const act: Act = ACTS[idx] ?? "stare";
  const {at, out} = cutWindow(len);
  const kIn = prog(f, at, at + 14, eOut);
  const kOut = 1 - prog(f, out - 14, out, eOut);
  const k = Math.min(kIn, kOut);
  if (k <= 0.01) return null;

  // shutter: bar hitam menutup/membuka saat pindah shot
  const shut = 1 - Math.max(kIn, kOut);
  const flash = (1 - kIn) * 0.55;
  // kamera: zoom perlahan + punch di tengah + handheld drift
  const span = Math.max(1, out - at);
  const push = prog(f, at + 8, at + span * 0.82, eOut);
  const punch = Math.exp(-Math.pow((f - (at + span * 0.55)) / Math.max(1, span * 0.10), 2)) * 0.07;
  const zoomTarget = act === "guard" ? 1.02 : act === "ask" ? 1.46 : act === "stare" ? 1.38 : 1.26;
  const zoom = lerp(1.0, zoomTarget, push) + punch;
  const cx = act === "stare" ? 300 : 476;
  const cy = act === "ask" ? -258 : -180;
  const panX = act === "leave" ? lerp(0, -110, push) : act === "stare" ? lerp(0, 90, push) : 0;
  const handheld = noise(t * 0.7, idx * 2) * 0.5;

  const A = CASUAL, B = SHIRT_ORANGE, C = JACKET_BLUE;
  const walkerX = lerp(40, 880, prog(f, at + 10, out - 10, eOut));
  const turn = Math.sin(t * 1.7);
  const raise = prog(f, at + 24, at + 70, eOut);
  const lookK = prog(f, at + 16, at + 60, eOut);

  return (
    <div style={{position: "absolute", left: STAGE_X, top: STAGE_Y, width: STAGE_W, height: STAGE_H, opacity: k, transform: `translateY(${lerp(16, 0, kIn)}px) rotate(${handheld}deg)`}}>
      <div style={{position: "absolute", inset: 0, background: "#14110C", border: `3px solid ${INK}`, boxShadow: `0 0 0 6px ${PAPER_D}, 10px 12px 0 ${INK}33`}}>
        {/* sprocket holes kiri-kanan */}
        {Array.from({length: 9}, (_, i) => (
          <React.Fragment key={i}>
            <div style={{position: "absolute", left: 10, top: 18 + i * 57, width: 20, height: 30, background: PAPER_D, borderRadius: 3, opacity: 0.8}} />
            <div style={{position: "absolute", right: 10, top: 18 + i * 57, width: 20, height: 30, background: PAPER_D, borderRadius: 3, opacity: 0.8}} />
          </React.Fragment>
        ))}
        <div style={{position: "absolute", left: 44, right: 44, top: 12, bottom: 12, overflow: "hidden", background: "radial-gradient(ellipse at 50% 40%, #3A3026 0%, #14110C 78%)"}}>
          <svg viewBox="0 -440 952 528" preserveAspectRatio="xMidYMax meet" style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}>
            <g transform={`translate(${cx + panX} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`}>
              {/* lantai + garis bayang */}
              <line x1={40} y1={0} x2={912} y2={0} stroke={PAPER_L} strokeWidth={2} opacity={0.28} />
              <ellipse cx={476} cy={4} rx={330} ry={12} fill={PAPER_L} opacity={0.05} />

              {act === "stare" ? (
                <>
                  <EmptyChair x={690} />
                  <text x={690} y={-232} textAnchor="middle" fontFamily={BIG} fontSize={34} letterSpacing={4} fill={STAMP} opacity={0.85}>KOSONG</text>
                  <Stickman x={280} y={0} scale={1.28} pose={mix(idle(t, 2), point(idle(t, 2), lookK, 82), lookK)} look={A} expr="worried" />
                </>
              ) : null}

              {act === "leave" ? (
                <>
                  <EmptyChair x={250} opacity={0.4} />
                  <Stickman x={lerp(300, 760, prog(f, at + 12, out - 16, eOut))} y={0} scale={1.24} pose={walk((f - at) / 26, t, 3)} look={C} expr="determined" />
                  <FolderProp x={lerp(300, 760, prog(f, at + 12, out - 16, eOut)) + 74} y={-118} />
                </>
              ) : null}

              {act === "relay" ? (
                <>
                  <Stickman x={walkerX} y={0} scale={0.82} pose={walk((f - at) / 20, t, 7)} look={C} expr="focused" opacity={0.45} />
                  <Stickman x={270} y={0} scale={1.2} pose={point(idle(t, 5), clamp(0.5 + turn * 0.5), 88)} look={A} expr="focused" />
                  <Stickman x={700} y={0} scale={1.2} facing={-1} pose={point(idle(t, 9), clamp(0.5 - turn * 0.5), 88)} look={B} expr="calm" />
                  <FolderProp x={476} y={-108} />
                </>
              ) : null}

              {act === "sign" ? (
                <>
                  <DocBoard x={620} y={-180} />
                  <Stickman x={300} y={0} scale={1.24} pose={point(idle(t, 4), raise, 96)} look={C} expr="focused" />
                  <Stickman x={480} y={0} scale={1.1} facing={-1} pose={{...idle(t, 11), headTilt: 8 + Math.sin(t * 3) * 5}} look={B} expr="calm" />
                </>
              ) : null}

              {act === "debate" ? (
                <>
                  <Stickman x={290} y={0} scale={1.22} pose={turn > 0 ? point(idle(t, 6), clamp(turn), 100) : mix(idle(t, 6), cheer(t, 6), clamp(-turn) * 0.6)} look={C} expr="shout" />
                  <Stickman x={690} y={0} scale={1.22} facing={-1} pose={turn < 0 ? point(idle(t, 8), clamp(-turn), 100) : mix(idle(t, 8), cheer(t, 8), clamp(turn) * 0.6)} look={B} expr="determined" />
                  <line x1={476} y1={-330} x2={476} y2={-40} stroke={PAPER_L} strokeWidth={2} strokeDasharray="10 12" opacity={0.22} />
                </>
              ) : null}

              {act === "guard" ? (
                <>
                  <EmptyChair x={560} opacity={0.7} />
                  <Stickman x={350} y={0} scale={1.24} pose={{...idle(t, 12), shL: -34, shR: 34, lean: -3}} look={C} expr="determined" />
                  <Stickman x={walkerX} y={0} scale={0.9} pose={walk((f - at) / 22, t, 13)} look={B} expr="calm" opacity={0.7} />
                </>
              ) : null}

              {act === "ask" ? (
                <>
                  <Stickman x={476} y={0} scale={1.3} pose={mix(idle(t, 8), cheer(t, 8), raise * 0.55)} look={B} expr="surprised" />
                  <text x={700} y={-300} textAnchor="middle" fontFamily={BIG} fontSize={150} fill={STAMP} opacity={0.55 + Math.sin(t * 3) * 0.18}>?</text>
                </>
              ) : null}
            </g>
          </svg>
          {/* scanline + vignette */}
          <div style={{position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, transparent 1px, transparent 4px)", opacity: 0.5, pointerEvents: "none"}} />
          <div style={{position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, transparent 42%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none"}} />
          {flash > 0.01 ? <div style={{position: "absolute", inset: 0, background: PAPER_L, opacity: flash, pointerEvents: "none"}} /> : null}
          {/* shutter: pindah shot */}
          {shut > 0.01 ? (
            <>
              <div style={{position: "absolute", left: 0, right: 0, top: 0, height: `${shut * 50}%`, background: "#0B0907", pointerEvents: "none"}} />
              <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: `${shut * 50}%`, background: "#0B0907", pointerEvents: "none"}} />
            </>
          ) : null}
        </div>
        {/* label rekaman */}
        <div style={{position: "absolute", left: 52, top: 16, display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: 3, color: PAPER_L, zIndex: 2}}>
          <span style={{width: 9, height: 9, borderRadius: "50%", background: STAMP, opacity: 0.45 + Math.abs(Math.sin(t * 3)) * 0.55}} />
          REKAMAN ARSIP {String(idx + 1).padStart(2, "0")}
        </div>
        <div style={{position: "absolute", right: 52, top: 16, fontFamily: MONO, fontWeight: 600, fontSize: 15, letterSpacing: 2, color: PAPER_L, opacity: 0.75, zIndex: 2}}>
          TC {String(Math.floor(f / FPS / 60)).padStart(2, "0")}:{String(Math.floor(f / FPS) % 60).padStart(2, "0")}:{String(f % FPS).padStart(2, "0")}
        </div>
        {/* lower-third ala film dokumenter */}
        <div style={{position: "absolute", left: 52, right: 52, bottom: 22, zIndex: 2, display: "flex", alignItems: "flex-end", gap: 12}}>
          <div style={{width: 5, height: 40, background: STAMP}} />
          <div style={{fontFamily: TYPE, fontSize: 20, lineHeight: 1.2, color: PAPER_L, background: "rgba(20,17,12,0.72)", padding: "5px 10px", maxWidth: 760}}>
            {ACT_CAP[act]}
          </div>
        </div>
      </div>
    </div>
  );
};

const ACT_CAP: Record<Act, string> = {
  stare: "Kursi wakil presiden kosong. Ia menatapnya, lalu menoleh.",
  leave: "1 Desember 1956 \u2014 Hatta berdiri, lalu meninggalkan kursi itu.",
  relay: "Berkas berpindah tangan: 1998, 2001, 2026.",
  sign: "Pasal 8 ayat 2 \u2014 aturan yang dulu tidak ada.",
  debate: "Dua kubu berdebat soal perlu tidaknya wapres.",
  guard: "Roda pemerintahan jalan terus, lapis pengaman kosong.",
  ask: "Lalu, apa yang sebenarnya kita butuhkan?",
};

/* ---------- wiring ---------- */

const TYPES: Record<string, React.FC<{s: SceneSpec}>> = {
  hook: HookScene,
  timeline: TimelineScene,
  arch: ArchScene,
  dokumen: DocScene,
  prokontra: ProKontraScene,
  dampak: ImpactScene,
  ending: EndingScene,
};

const TAGS: Record<string, string> = {
  hook: "BERKAS BARU",
  timeline: "TIMELINE",
  arch: "ARSIP",
  dokumen: "DOKUMEN",
  prokontra: "DUA SISI",
  dampak: "DAMPAK",
  ending: "PENUTUP",
};

const CUT_TITLE: Record<Act, string> = {
  stare: "KURSI YANG DITINGGALKAN",
  leave: "1 DESEMBER 1956",
  relay: "TIGA KALI KOSONG",
  sign: "ATURAN YANG BARU ADA",
  debate: "PERLU ATAU SIMBOL",
  guard: "YANG BERHENTI",
  ask: "PERTANYAAN TERAKHIR",
};

/** Judul shot besar di ruang atas saat cutaway menyala. */
const CutTitle: React.FC<{idx: number; k: number; f: number; tag: string}> = ({idx, k, f, tag}) => {
  if (k <= 0.01) return null;
  const act: Act = ACTS[idx] ?? "stare";
  const rise = prog(f, 2, 20, eOut);
  return (
    <div style={{position: "absolute", left: M, top: 250, width: CW, opacity: k}}>
      <div style={{display: "flex", alignItems: "center", gap: 12, fontFamily: MONO, fontWeight: 700, fontSize: 17, letterSpacing: 4, color: STAMP}}>
        <span style={{width: 9, height: 9, borderRadius: "50%", background: STAMP}} />
        {tag} {"\u2022"} ADEGAN {String(idx + 1).padStart(2, "0")}
      </div>
      <div style={{height: 12}} />
      <div style={{fontFamily: BIG, fontSize: 92, lineHeight: 0.9, color: INK, textTransform: "uppercase", transform: `translateY(${lerp(28, 0, rise)}px)`}}>
        {CUT_TITLE[act].split(" ").map((w, i) => (
          <span key={i} style={{display: "inline-block", marginRight: "0.22em", opacity: prog(f, 4 + i * 4, 20 + i * 4, eOut)}}>{w}</span>
        ))}
      </div>
      <div style={{height: 14}} />
      <div style={{height: 3, background: INK, width: `${k * 100}%`}} />
    </div>
  );
};

/** Halaman arsip memudar saat cutaway rekaman menyala, lalu balik lagi. */
const SceneBody: React.FC<{s: SceneSpec; idx: number; tag: string}> = ({s, idx, tag}) => {
  const f = useCurrentFrame();
  const {at, out} = cutWindow(s.len);
  const k = cutOpacity(f, at, out);
  const Comp = TYPES[s.type] ?? HookScene;
  return (
    <>
      <div style={{position: "absolute", inset: 0, opacity: 1 - k, transform: `scale(${lerp(1, 1.04, k)})`}}>
        <CameraDrift len={s.len} seed={idx * 3 + 1}>
          <Comp s={s} />
          <ArchiveHead kicker={s.kicker ?? ""} idx={idx + 1} tag={tag} />
        </CameraDrift>
      </div>
      <CutTitle idx={idx} k={k} f={Math.max(0, f - at)} tag={tag} />
      <LiveStage s={s} idx={idx} />
    </>
  );
};

export const ArsipEngine: React.FC<{script: StoryScript; narration?: string}> = ({script, narration}) => {
  const total = script.total;
  return (
    <AbsoluteFill>
      <PaperBg />
      {script.scenes.map((s, i) => {
        const tag = TAGS[s.type] ?? "ARSIP";
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.len + FADE}>
            <FolderDrop len={s.len} fade={FADE}>
              <SceneBody s={s} idx={i} tag={tag} />
            </FolderDrop>
          </Sequence>
        );
      })}
      <Dust />
      <ArsipCaptions cues={script.scenes.flatMap((s) => s.cues ?? [])} />
      <TimeCode total={total} />
      <Narration file={narration} />
    </AbsoluteFill>
  );
};
