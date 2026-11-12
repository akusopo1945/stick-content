# Character guide

A stickman in this kit is one `Stickman` component. You control it with four things: where it is, how it is posed,
what it wears, and whether it is standing or sitting.

## Place a stickman

```tsx
import {Stickman} from "../rig/Stickman";
import {CASUAL} from "../rig/looks";
import {FLOOR} from "../environment/Furniture";

<Stickman x={0} y={FLOOR} scale={1.5} facing={1} look={CASUAL} />
```

- `x` and `y` are the **ground point between the feet** when the character stands (the default `anchor="feet"`).
  Use `y={FLOOR}` to stand on the floor.
- `scale={1.5}` is the size the examples use. Bigger numbers make the character bigger on screen.
- `facing={1}` faces right. `facing={-1}` faces left.
- `expr` changes the face: `"neutral"`, `"happy"`, `"surprised"`, `"worried"`, `"focused"`, `"determined"`, `"calm"`,
  `"shout"`, `"smug"` or `"sad"`.

## Change the clothes

A look is an object with colours and optional extras. Use a preset, then change a few fields:

```tsx
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import type {Look} from "../rig/Stickman";

const TEACHER: Look = {...CASUAL, top: "#6B3E2E", coat: "#2A2D33"};
```

| Field | What it changes |
|---|---|
| `top` | Shirt colour (required) |
| `sleeve` | Sleeve colour. Defaults to `top` |
| `trousers` | Trouser colour |
| `shoe` | Shoe colour |
| `skin` | Head and hand colour |
| `build` | Body width. `1` is standard, `1.18` is heavier |
| `coat` | An open jacket over the shirt |
| `tie`, `belt` | A tie or belt colour |
| `hat` | `"none"`, `"cap"`, `"beanie"` or `"helmet"` |
| `hatColor` | Hat colour |
| `headBack` | Something behind the head, such as `<CurlyHair color="#3A2A1E" />` |
| `headExtra` | Something over the face, such as `<ShortHair color="#2A2420" />` or `<RoundGlasses />` |

The three presets are `CASUAL` (green shirt, short hair), `SHIRT_ORANGE` (orange shirt, curly hair) and `JACKET_BLUE`
(blue-grey jacket, glasses). They are in `src/rig/looks.tsx`.

## Pose the body

Poses are objects with joint angles. The easiest way is to use a ready-made pose function:

```tsx
import {idle, walk, sit, typing, point, cheer} from "../rig/poses";

<Stickman x={0} y={FLOOR} pose={idle(t)} look={CASUAL} />      // standing, breathing, blinking
<Stickman x={x} y={FLOOR} pose={walk(phase, t)} look={CASUAL} /> // one walk cycle
```

| Function | What it does |
|---|---|
| `idle(t)` | Standing, with a slight breathing bob and occasional blinks. `t` is the time in seconds. |
| `walk(phase, t)` | A walk cycle. `phase` is distance divided by `STRIDE * scale`. See below. |
| `sit(t)` | Thighs forward and shins down. Use it with a chair (see below). |
| `typing(t)` | Seated, forearms forward, alternating taps. |
| `point(base, k, height)` | Right arm points forward. `k` from 0 to 1. |
| `cheer(t)` | Both arms up. |
| `mix(a, b, k)` | Blends two poses. `k` from 0 (pose `a`) to 1 (pose `b`). |

### Make the walk match the distance

A walk cycle is driven by distance, so the feet stay on the ground:

```tsx
import {STRIDE, walk} from "../rig/poses";

const distance = 300;                  // world units walked so far
const phase = distance / (STRIDE * 1.5); // 1.5 is the scale used
<Stickman x={startX + distance} y={FLOOR} scale={1.5} pose={walk(phase)} look={CASUAL} />
```

If the feet slide, check that `phase` uses the same `scale` as the `Stickman`.

## Sit on a chair

Sitting needs two things: the pelvis (`anchor="hip"`) and the feet on the floor. `seatedAnchor` works out both from the chair:

```tsx
import {seatedAnchor} from "../rig/seat";
import {OfficeChair, FLOOR} from "../environment/Furniture";

const CHAIR = {x: -20, floorY: FLOOR, facing: 1 as const, seat: 87};
const seat = seatedAnchor(CHAIR, 1.5);

<OfficeChair x={CHAIR.x} y={CHAIR.floorY} facing={CHAIR.facing} seat={CHAIR.seat} />
<Stickman
  x={seat.hip.x}
  y={seat.hip.y}
  anchor="hip"
  scale={1.5}
  facing={1}
  pose={typing(t)}
  look={JACKET_BLUE}
  footL={seat.footL}
  footR={seat.footR}
/>
```

Rules for seated characters:

- Always use `anchor="hip"` and pass the pelvis position as `x` and `y`.
- Always pass `footL` and `footR` so the legs reach the floor.
- Use the same `facing` as the chair's `facing`.

## Reach for objects

`reachL` and `reachR` are world positions for the hands. The arms bend to reach them:

```tsx
<Stickman ... anchor="hip" reachL={{x: 70, y: keyboardY}} reachR={{x: 100, y: keyboardY}} />
```

Keep hand targets within about 140 units of the shoulder, or the arm will stretch and look wrong. For a seated character,
a keyboard about 100 units in front of the hip works.

## Troubleshooting

- **The character floats.** A standing character needs `y={FLOOR}` and `anchor="feet"`. A seated character needs `anchor="hip"`.
- **The hands float off an object.** The target is too far from the shoulder. Move the object closer, or move the chair.
- **The character faces the wrong way.** Change `facing`. Set `facing={-1}` for left.
- **A TypeScript error mentions `rot` on a camera.** Every camera object needs `x`, `y`, `zoom` and `rot`. Add `rot: 0` to the object.
