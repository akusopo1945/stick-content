import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {C, FONT, W} from "../styles/palette";

/*
 * Timed captions. Each cue is a phrase with start/end frame (absolute, 30 fps).
 * Optional `words` (also absolute frames) drives a karaoke highlight: the active
 * word is yellow + bold, spoken words dim, upcoming words bright bone.
 *
 * Positions are the top edge of the caption block, in 1080 x 1920 frame pixels:
 *   top 420 | upper 620 | mid 860 | lower 1380 (default)
 */

export type Word = {t: string; from: number; to: number};

export type CaptionCue = {
  from: number;   // first frame on screen
  to: number;     // first frame after the caption leaves
  text: string;   // one phrase; use "\n" for a second line
  pos?: keyof typeof POS_Y;
  y?: number;
  words?: Word[];
};

export const POS_Y = {top: 420, upper: 620, mid: 860, lower: 1380};

const RISE = 7;   // frames for the rise-in
const FADE = 6;   // frames for the fade-out

const CueView: React.FC<{text: string; top: number; dur: number; base: number; words?: Word[]; comic?: boolean}> = ({text, top, dur, base, words, comic}) => {
  const f = useCurrentFrame();
  const kIn = interpolate(f, [0, RISE], [0, 1], {extrapolateRight: "clamp"});
  const kOut = interpolate(f, [dur - FADE, dur], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const k = Math.min(kIn, kOut);
  if (k <= 0.001) return null;
  const gf = base + f;
  if (comic) {
    return (
      <div
        style={{
          position: "absolute",
          left: 90,
          width: W - 180,
          top,
          display: "flex",
          justifyContent: "center",
          opacity: k,
          transform: `translateY(${(1 - kIn) * 14}px) rotate(${-1 + Math.sin(base) * 0.5}deg)`,
        }}
      >
        <div
          style={{
            position: "relative",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 50,
            lineHeight: 1.18,
            color: C.ink,
            textAlign: "center",
            whiteSpace: "pre-line",
            background: "#FFFDF5",
            border: `4px solid ${C.ink}`,
            borderRadius: 24,
            padding: "22px 28px",
            boxShadow: "4px 6px 0 rgba(26,26,26,0.16)",
            maxWidth: W - 220,
          }}
        >
          {words && words.length ? (
            words.map((w, i) => {
              const active = gf >= w.from && gf < w.to;
              const past = gf >= w.to;
              return (
                <span
                  key={i}
                  style={{
                    color: active ? C.red : past ? "#9A9384" : C.ink,
                    fontWeight: active ? 900 : 800,
                  }}
                >
                  {w.t}{" "}
                </span>
              );
            })
          ) : (
            text
          )}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        width: W - 180,
        top,
        display: "flex",
        justifyContent: "center",
        opacity: k,
        transform: `translateY(${(1 - kIn) * 14}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.18,
          color: C.bone,
          textAlign: "center",
          whiteSpace: "pre-line",
          textShadow: "0 3px 12px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.95)",
        }}
      >
        {words && words.length ? (
          words.map((w, i) => {
            const active = gf >= w.from && gf < w.to;
            const past = gf >= w.to;
            return (
              <span
                key={i}
                style={{
                  color: active ? C.yellow : past ? "rgba(233,231,223,0.45)" : C.bone,
                  fontWeight: active ? 900 : 800,
                }}
              >
                {w.t}{" "}
              </span>
            );
          })
        ) : (
          text
        )}
      </div>
    </div>
  );
};

export const CaptionTrack: React.FC<{cues: CaptionCue[]; comic?: boolean}> = ({cues, comic}) => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    {cues.map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={Math.max(1, c.to - c.from)}>
        <CueView text={c.text} top={c.y ?? POS_Y[c.pos ?? "lower"]} dur={Math.max(1, c.to - c.from)} base={c.from} words={c.words} comic={comic} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
