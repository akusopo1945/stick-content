import React from "react";
import {AbsoluteFill} from "remotion";
import {noise} from "../motion/ease";
import {H, W} from "../styles/palette";

/*
 * A virtual 2D camera. World units: 1 unit = 1 px at zoom 1, and the camera centre is the frame centre.
 * Layers carry a depth factor: 1 = the action plane (moves with the camera), below 1 = background
 * (moves less), above 1 = foreground (moves more). Characters should sit on a depth-1 Layer.
 * Derived from the author's production rig, simplified for this starter. Blur and screen-space helpers left out.
 */

export type Cam = {x: number; y: number; zoom: number; rot: number};
export const CAM0: Cam = {x: 0, y: 0, zoom: 1, rot: 0};

type Ctx = {cam: Cam; cx: number; cy: number};
const CamContext = React.createContext<Ctx>({cam: CAM0, cx: W / 2, cy: H / 2});

/** handheld: 0 = still, about 1 = a gentle drift. t: the current time in seconds (needed for the drift). */
export const Camera2D: React.FC<{cam: Cam; t?: number; handheld?: number; background?: string; children: React.ReactNode}> = ({cam, t = 0, handheld = 0, background = "#0E0F11", children}) => {
  const c: Cam = handheld
    ? {
        x: cam.x + (noise(t * 0.7, 1) * 7 * handheld) / cam.zoom,
        y: cam.y + (noise(t * 0.6, 2) * 6 * handheld) / cam.zoom,
        zoom: cam.zoom,
        rot: cam.rot + noise(t * 0.5, 3) * 0.35 * handheld,
      }
    : cam;
  return (
    <AbsoluteFill style={{backgroundColor: background, overflow: "hidden"}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", left: 0, top: 0}}>
        <CamContext.Provider value={{cam: c, cx: W / 2, cy: H / 2}}>{children}</CamContext.Provider>
      </svg>
    </AbsoluteFill>
  );
};

/** A parallax layer. Transform: scale 1 + (zoom - 1) * depth, offset by the camera position times depth. */
export const Layer: React.FC<{depth?: number; opacity?: number; children: React.ReactNode}> = ({depth = 1, opacity = 1, children}) => {
  const {cam, cx, cy} = React.useContext(CamContext);
  const s = 1 + (cam.zoom - 1) * depth;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${cam.rot}) scale(${s}) translate(${-cam.x * depth} ${-cam.y * depth})`} opacity={opacity}>
      {children}
    </g>
  );
};
