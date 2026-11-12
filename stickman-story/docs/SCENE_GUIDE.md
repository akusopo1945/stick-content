# Scene guide

A scene is one React component that draws the world for a given frame. A film is a list of scenes placed one after another.
This guide shows how to build a room, add characters and objects, and join scenes.

## The three rules

1. **Everything depends on the frame.** Use `useCurrentFrame()` for time. Do not use timers, random numbers or the current date.
   The same frame must always draw the same picture, or the render will flicker.
2. **Only the camera moves the world.** Characters and objects keep their world positions. You move them by changing their `x`
   and `y`, not by moving the camera for them.
3. **Use frames for timing.** Frames are easier to match to narration than seconds. There are 30 frames per second.

## A minimal scene

```tsx
import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {Floor, FLOOR, Wall} from "../environment/Furniture";
import {CASUAL} from "../rig/looks";
import {idle} from "../rig/poses";
import {Stickman} from "../rig/Stickman";
import {FPS} from "../styles/palette";

export const MyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill>
      <Camera2D cam={{x: 0, y: 100, zoom: 1, rot: 0}} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Stickman x={0} y={FLOOR} scale={1.5} pose={idle(t)} look={CASUAL} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};
```

Register the scene in `src/Root.tsx`:

```tsx
<Composition id="My-Scene" component={MyScene} durationInFrames={150} fps={FPS} width={W} height={H} />
```

## Build a room

Draw the room from the back to the front. Things drawn later cover things drawn earlier:

| Order | Piece | Layer |
|---|---|---|
| 1 | `Wall` | depth 0.5 (background) |
| 2 | `Floor` | depth 1 |
| 3 | `Glow`, `Cone` (light) | depth 1 |
| 4 | `OfficeChair`, `Desk`, `Board` | depth 1 |
| 5 | `Monitor` | depth 1 |
| 6 | Characters | depth 1 |

Desks are drawn at `top` above the floor. For the desk top to sit at `FLOOR - top`, keep `top` at 150 unless you have a reason.

Place a monitor on a desk: its base sits on the desk top, so `y = FLOOR - desk.top - 38`:

```tsx
const DESK = {x: 180, w: 440, top: 150};
const MONITOR = {x: 240, y: FLOOR - DESK.top - 38};

<Desk x={DESK.x} w={DESK.w} top={DESK.top} />
<Monitor x={MONITOR.x} y={MONITOR.y} w={230} h={140} screen={<MyScreen />} />
```

### Put something on the monitor

`screen` is drawn in a rectangle with local coordinates from 0 to `w` across and 0 to `h` down. Draw with plain SVG:

```tsx
const Bars: React.FC<{k: number}> = ({k}) => (
  <g>
    <rect width={230} height={140} fill="#0B1B24" />
    {[0.8, 0.5, 0.7].map((h, i) => (
      <rect key={i} x={30 + i * 60} y={120 - 80 * h * k} width={38} height={80 * h * k} fill="#35CBFA" />
    ))}
  </g>
);
```

`k` is a value from 0 to 1 that grows the bars over time: `prog(frame, start, end)`.

## Put a whiteboard in the scene

`Board` draws a whiteboard. Its face runs from `x - w/2` to `x + w/2` and from `y - h` to `y`. Anything in `children`
is drawn inside the face, in local coordinates:

```tsx
<Board x={-200} y={FLOOR - 120} w={400} h={260}>
  <Label x={200} y={70} text="IDEA" size={44} color="#111213" />
</Board>
```

## Show a sequence of steps

Draw each step when its time comes, by fading it in:

```tsx
import {eInOut, prog} from "../motion/ease";

const steps = ["Input", "Process", "Output"];
{steps.map((label, i) => {
  const appear = prog(frame, 10 + i * 18, 28 + i * 18, eInOut);
  return <g key={label} opacity={appear}>{/* box and label */}</g>;
})}
```

## Join scenes into a film

Use `Sequence` to place scenes one after another. Inside each scene, `useCurrentFrame()` starts again from 0:

```tsx
import {AbsoluteFill, Sequence} from "remotion";

<AbsoluteFill>
  <Sequence from={0} durationInFrames={90}><SceneA /></Sequence>
  <Sequence from={90} durationInFrames={120}><SceneB /></Sequence>
  <Sequence from={210} durationInFrames={120}><SceneC /></Sequence>
</AbsoluteFill>
```

The composition's `durationInFrames` must equal the last scene's end (here 330). `Example03MiniDocumentary.tsx` is a working example.

### Keep joins clean

- Start each scene from the same camera position where the last one ended, so the cut does not jump.
- Put a short hold (no movement for about half a second) at the end of a scene before a cut.
- If two scenes share a character, give that character the same `x`, `y` and pose at the join.

## Scene checklist

- [ ] Every position is a world number, not a screen number.
- [ ] Characters are on a depth-1 layer.
- [ ] Seated characters use `seatedAnchor` and `anchor="hip"`.
- [ ] Every camera object has `rot`.
- [ ] The composition length matches the scene timing.
- [ ] `npm run typecheck` passes.
