import React, {useId} from "react";
import {C, FONT} from "../styles/palette";

/*
 * Basic room pieces in world units. The ground line is FLOOR (y = 420 below the frame centre).
 * Flat shapes, one outline weight, soft radial glows for light. No photo textures.
 * Derived from the author's production room pieces, simplified for this starter. The Board is new.
 */

export const FLOOR = 420;

const sid = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "");

/** Soft radial light. */
export const Glow: React.FC<{x: number; y: number; r: number; color: string; opacity?: number}> = ({x, y, r, color, opacity = 0.5}) => {
  const id = "g" + sid(useId());
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="45%" stopColor={color} stopOpacity={opacity * 0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={r} ry={r} fill={`url(#${id})`} />
    </>
  );
};

/** Light cone from (x, y), spreading downward (angle 0). */
export const Cone: React.FC<{x: number; y: number; len: number; spread: number; color: string; opacity?: number}> = ({x, y, len, spread, color, opacity = 0.18}) => {
  const id = "c" + sid(useId());
  const w = Math.tan((spread * Math.PI) / 360) * len;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M -6 0 L 6 0 L ${w} ${len} L ${-w} ${len} Z`} fill={`url(#${id})`} />
    </g>
  );
};

/** A wall band from x0 to x1 and from y0 down to y1. */
export const Wall: React.FC<{x0: number; x1: number; y0: number; y1: number; color?: string}> = ({x0, x1, y0, y1, color = C.wall}) => (
  <g>
    <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={color} />
    <rect x={x0} y={y1 - 18} width={x1 - x0} height={18} fill={C.wallLine} />
  </g>
);

/** Floor from x0 to x1, starting at y, with a soft gradient and a dark front edge. */
export const Floor: React.FC<{x0: number; x1: number; y?: number; depth?: number}> = ({x0, x1, y = FLOOR, depth = 900}) => {
  const id = "f" + sid(useId());
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.07} />
          <stop offset="35%" stopColor="#FFFFFF" stopOpacity={0.02} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.45} />
        </linearGradient>
      </defs>
      <rect x={x0} y={y} width={x1 - x0} height={depth} fill={C.floor} />
      <rect x={x0} y={y} width={x1 - x0} height={depth} fill={`url(#${id})`} />
      <rect x={x0} y={y} width={x1 - x0} height={6} fill={C.ink} opacity={0.6} />
    </g>
  );
};

/** Desk: a top at `top` above the floor, with a side panel. */
export const Desk: React.FC<{x: number; w: number; top?: number; y?: number}> = ({x, w, top = 150, y = FLOOR}) => (
  <g>
    <rect x={x - w / 2} y={y - top} width={w} height={16} rx={3} fill={C.wood} stroke={C.ink} strokeWidth={3} />
    <rect x={x - w / 2 + 14} y={y - top + 16} width={12} height={top - 16} fill={C.woodDark} />
    <rect x={x + w / 2 - 26} y={y - top + 16} width={12} height={top - 16} fill={C.woodDark} />
  </g>
);

/**
 * Monitor on a stand, with its bottom edge at y. `screen` is drawn inside the screen rectangle
 * (local coordinates 0..w, 0..h). Nothing is drawn on the screen unless you pass it.
 */
export const Monitor: React.FC<{x: number; y: number; w?: number; h?: number; on?: number; screen?: React.ReactNode}> = ({x, y, w = 230, h = 140, on = 1, screen}) => {
  const id = "m" + sid(useId());
  return (
    <g>
      <rect x={x - 10} y={y} width={20} height={34} fill={C.steel} />
      <rect x={x - 40} y={y + 30} width={80} height={8} rx={3} fill={C.steel} stroke={C.ink} strokeWidth={2} />
      <rect x={x - w / 2 - 8} y={y - h - 8} width={w + 16} height={h + 16} rx={6} fill={C.ink} />
      <defs>
        <clipPath id={id}>
          <rect x={x - w / 2} y={y - h} width={w} height={h} />
        </clipPath>
      </defs>
      <rect x={x - w / 2} y={y - h} width={w} height={h} fill="#0B1B24" />
      <g clipPath={`url(#${id})`} opacity={on}>
        <rect x={x - w / 2} y={y - h} width={w} height={h} fill={C.cyan} opacity={0.12} />
        <g transform={`translate(${x - w / 2} ${y - h})`}>{screen}</g>
      </g>
    </g>
  );
};

/** Office chair. Its backrest is on the side given by facing (+1 backrest on the left). */
export const OfficeChair: React.FC<{x: number; y?: number; facing?: 1 | -1; seat?: number; color?: string}> = ({x, y = FLOOR, facing = 1, seat = 87, color = "#2B2D31"}) => (
  <g transform={`translate(${x} ${y}) scale(${facing} 1)`}>
    <line x1={0} y1={-seat + 6} x2={0} y2={-18} stroke={C.steel} strokeWidth={8} />
    <path d="M -46 -4 L 46 -4" stroke={C.steel} strokeWidth={6} strokeLinecap="round" />
    <circle cx={-46} cy={-2} r={6} fill={C.ink} />
    <circle cx={46} cy={-2} r={6} fill={C.ink} />
    <rect x={-58} y={-seat - 4} width={100} height={18} rx={8} fill={color} stroke={C.ink} strokeWidth={3} />
    <rect x={-74} y={-seat - 150} width={22} height={160} rx={10} fill={color} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** Whiteboard on two legs. Its face is from x - w/2 to x + w/2 and from y - h to y. `children` are drawn inside. */
export const Board: React.FC<{x: number; y: number; w: number; h: number; children?: React.ReactNode}> = ({x, y, w, h, children}) => (
  <g>
    <rect x={x - 10} y={y} width={20} height={FLOOR - y} fill={C.steel} />
    <rect x={x - w / 2 - 10} y={y - h - 10} width={w + 20} height={h + 20} rx={6} fill={C.steel} stroke={C.ink} strokeWidth={3} />
    <rect x={x - w / 2} y={y - h} width={w} height={h} fill={C.bone} />
    <g transform={`translate(${x - w / 2} ${y - h})`}>{children}</g>
  </g>
);

/** Text label for on-screen notes (uses the palette font). */
export const Label: React.FC<{x: number; y: number; text: string; size?: number; color?: string; anchor?: "start" | "middle" | "end"}> = ({x, y, text, size = 30, color = C.bone, anchor = "middle"}) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={FONT} fontWeight={700} fontSize={size} fill={color}>
    {text}
  </text>
);
