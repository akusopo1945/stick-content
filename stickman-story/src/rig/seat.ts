import {Pt, RIG} from "./Stickman";

/*
 * Chair anchor system. A chair publishes its seat and backrest geometry; seatedAnchor() turns that into a
 * pelvis position plus floor contact points, so a seated character rests on the cushion, leans back against
 * the backrest, and has both feet planted on the floor in front.
 * Use with <Stickman anchor="hip" x={a.hip.x} y={a.hip.y} footL={a.footL} footR={a.footR} />.
 * Geometry matches the <OfficeChair> in src/environment/Furniture.tsx.
 */

export type ChairGeom = {x: number; floorY: number; seat?: number; facing?: 1 | -1};

export const chairSeatTop = (c: ChairGeom) => c.floorY - (c.seat ?? 87) - 4;
export const chairBackInner = (c: ChairGeom) => c.x - 52 * (c.facing ?? 1);

export type SeatAnchor = {hip: Pt; footL: Pt; footR: Pt; facing: 1 | -1};

export const seatedAnchor = (c: ChairGeom, scale: number, build = 1): SeatAnchor => {
  const f = c.facing ?? 1;
  const halfTorso = (RIG.torsoW * build * scale) / 2;
  const hip = {
    x: chairBackInner(c) + f * (halfTorso + 2),
    // the torso rectangle extends 8 rig units below the hip joint; that edge rests on the cushion
    y: chairSeatTop(c) - 8 * scale,
  };
  // thighs roughly level, shins roughly vertical: feet land about one thigh-length ahead of the hip
  return {
    hip,
    footL: {x: hip.x + f * 70 * scale, y: c.floorY},
    footR: {x: hip.x + f * 84 * scale, y: c.floorY},
    facing: f,
  };
};
