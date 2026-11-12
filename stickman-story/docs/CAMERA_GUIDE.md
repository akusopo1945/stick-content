# Camera guide

The camera is a virtual window onto a flat 2D world. You give it a position, a zoom and a rotation for each moment,
and the frame draws whatever is inside that window.

## The camera object

```ts
type Cam = {x: number; y: number; zoom: number; rot: number};
```

| Field | Meaning |
|---|---|
| `x`, `y` | The world point at the centre of the frame |
| `zoom` | `1` shows the whole 1080 wide world; `2` makes everything twice as big |
| `rot` | Rotation in **degrees**. Positive turns clockwise on screen. Use `0` for no rotation |

At `{x: 0, y: 0, zoom: 1, rot: 0}`, the world point `(0, 0)` is the centre of the frame. The floor is at `y = 420` (`FLOOR`), so it appears
below the centre.

## Use the camera

Wrap your scene in `Camera2D`, and put the things that move with the camera inside a `Layer`:

```tsx
import {Camera2D, Layer} from "../camera/Camera2D";
import {Floor, FLOOR} from "../environment/Furniture";

<Camera2D cam={{x: 0, y: 100, zoom: 1, rot: 0}} t={t}>
  <Layer depth={1}>
    <Floor x0={-1400} x1={1400} />
    <Stickman x={0} y={FLOOR} scale={1.5} look={CASUAL} />
  </Layer>
</Camera2D>
```

- `t` is the current time in seconds. Pass it when you use `handheld`, so the drift changes over time.
- `handheld={0.5}` adds a gentle wobble. Leave it at `0` (the default) for a still camera.
- `background` sets the colour behind the world. The default is near black.

## Layers and depth

Each `Layer` has a `depth`:

| Depth | Effect |
|---|---|
| `1` | Moves exactly with the camera. Put characters and the floor here. |
| `0.5` | Moves half as much as the camera. Good for a far wall (parallax). |
| `0` | Stays fixed on screen (no zoom or pan). It still rotates with `rot`. |
| `1.5` | Moves faster than the camera. Good for something close to the lens. |

Characters must stay at depth `1`. At any other depth their feet slide away from the floor during a zoom.

## Move the camera with keyframes

Give the camera a list of key moments and let the kit fill in the values between them:

```tsx
import {keysObj, spline, prog, eInOut} from "../motion/ease";

// one camera object, moving between keys
const cam = keysObj(frame, [
  [0,   {x: -300, y: 100, zoom: 1,   rot: 0}],
  [120, {x: 0,    y: 100, zoom: 1,   rot: 0}],
  [300, {x: 240,  y: 200, zoom: 1.7, rot: 0}],
]);
```

- Time is in **frames** when you use `frame` as the input, and in **seconds** when you use `t`. The examples use frames.
- `keysObj` moves in straight segments with easing. Every object in one call must have the same fields, including `rot`.
- For separate numbers, use `spline`. It flows through each key without stopping:

```tsx
const x = spline(frame, [[0, -300], [120, 0], [300, 240]]);
const zoom = spline(frame, [[0, 1], [300, 1.7]], true); // true = zoom in log space
const cam = {x, y: 100, zoom, rot: 0};
```

Use `log = true` for zoom. It makes the zoom feel even across the move.

For a single move between two moments, use `prog` to get a value from 0 to 1 and interpolate yourself:

```tsx
const k = prog(frame, 90, 150, eInOut); // 0 before frame 90, 1 after frame 150
const x = -40 + (240 - -40) * k;
```

## Follow a character

Make the camera's `x` a fraction of the character's `x`. The example in `Example01WalkingStickman.tsx` uses half speed:

```tsx
const cam = {x: characterX * 0.5, y: 100, zoom: 1, rot: 0};
```

Half speed makes the room move more slowly than the character, which reads as depth.

## Push in on an object

To frame a point at the centre of the screen, set the camera to that point. Zoom makes it bigger:

```tsx
const target = {x: 240, y: 200}; // the monitor's centre in world units
const cam = {x: target.x, y: target.y, zoom: 2, rot: 0};
```

To frame two things together, use the midpoint between them, then choose a zoom so both fit:

```tsx
const cam = {x: (characterX + monitorX) / 2, y: 200, zoom: 1.7, rot: 0};
```

Check your choice with a still image. The width of the visible world is `1080 / zoom`.

## Common mistakes

- **Missing `rot`.** Every camera object needs `rot`, or TypeScript reports an error.
- **Wrong `t`.** If `handheld` seems to stop, check that you pass `t={t}` to `Camera2D`.
- **Characters outside a depth-1 layer.** Their feet will drift off the floor during zooms.
- **Zoom without `log`.** A long zoom with plain interpolation looks as if it stalls at the start.
- **Rotation in radians.** `rot` is in degrees.
