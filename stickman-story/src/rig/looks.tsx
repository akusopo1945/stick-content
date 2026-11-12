import React from "react";
import {C} from "../styles/palette";
import {Look} from "./Stickman";

/*
 * Starter looks: clothing colours and simple hair. Copy one, change the colours, and you have a new character.
 *   const TEACHER: Look = {...CASUAL, top: "#6B3E2E", coat: "#2A2D33"};
 */

/** Short hair cap, drawn over the top of the head (use as headExtra). */
export const ShortHair: React.FC<{color: string}> = ({color}) => (
  <path d="M -36 -4 A 36 36 0 0 1 36 -4 Q 0 -24 -36 -4 Z" fill={color} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
);

/** Curly hair: a row of bumps around the top of the head (use as headBack, so it sits behind the face). */
export const CurlyHair: React.FC<{color: string}> = ({color}) => (
  <g fill={color} stroke={C.ink} strokeWidth={3}>
    <circle cx={-26} cy={-22} r={13} />
    <circle cx={-6} cy={-32} r={14} />
    <circle cx={16} cy={-32} r={14} />
    <circle cx={30} cy={-20} r={13} />
  </g>
);

/** Round glasses (use as headExtra, over the hair). */
export const RoundGlasses: React.FC = () => (
  <g fill="none" stroke={C.ink} strokeWidth={2.4}>
    <circle cx={-11} cy={-3} r={7} />
    <circle cx={11} cy={-3} r={7} />
    <line x1={-4} y1={-3} x2={4} y2={-3} />
  </g>
);

/** Plain casual look: green shirt, dark trousers, short hair. */
export const CASUAL: Look = {
  top: "#4E6B5A",
  trousers: "#2E3135",
  headExtra: <ShortHair color="#2A2420" />,
};

/** Orange shirt with curly hair. */
export const SHIRT_ORANGE: Look = {
  top: C.orange,
  sleeve: C.orange,
  headBack: <CurlyHair color="#3A2A1E" />,
};

/** Blue-grey jacket over a dark shirt, with glasses. */
export const JACKET_BLUE: Look = {
  top: "#2E3A4A",
  sleeve: "#2E3A4A",
  coat: "#3E4A5C",
  headExtra: (
    <g>
      <ShortHair color="#1E1E22" />
      <RoundGlasses />
    </g>
  ),
};
