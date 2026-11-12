# Examples

Each example is a small, complete composition. Read them in order: each one adds a new idea.

| # | Composition | Length | New ideas |
|---|---|---|---|
| 1 | `Example01-WalkingStickman` | 5 s (150 frames) | Walking, camera following, parallax, one caption |
| 2 | `Example02-OfficeScene` | 12 s (360 frames) | Sitting, typing, a desk and monitor, camera push-in, three captions |
| 3 | `Example03-MiniDocumentary` | 11 s (330 frames) | Three scenes, pointing, an explanatory diagram, optional narration |

Render any of them with:

```bash
npm run render -- <Composition-id> out/<name>.mp4
```

---

## Example 01 — Walking stickman

**File:** `src/scenes/Example01WalkingStickman.tsx`

A stickman stands for half a second, walks from the left edge of the room to the right, then stands at the end. The camera follows
at half speed, so the wall moves more slowly than the floor.

**Timeline**

| Frames | What happens |
|---|---|
| 0–15 | Standing (`idle`) |
| 15–135 | Walking (`walk`), from x −420 to x 420 |
| 135–150 | Standing at the end |

**Things to change**

- `START_X` and `END_X` set the walk's distance.
- `scale` on the `Stickman` makes the character bigger or smaller.
- `cam` multiplies the character's `x` by `0.5`. Use `1` to make the camera move with the character, or `0` to keep it still.
- `CUES` sets the caption text and timing.

**What it demonstrates:** `walk` with a phase from distance, `idle` for standing, a depth-0.5 wall for parallax, and `CaptionTrack`.

---

## Example 02 — Office scene

**File:** `src/scenes/Example02OfficeScene.tsx`

A stickman walks to a desk, sits in a chair, types, and looks at a monitor where three bars grow. The camera follows the walk, then pushes in
on the monitor. The sitting step is built from `seatedAnchor`, so the seat and feet line up with the chair.

**Timeline**

| Frames | What happens |
|---|---|
| 0–90 | Walk toward the chair (`walk`, feet on the floor) |
| 90–120 | Sit down: the pelvis and feet move from the standing spot to the seat anchor |
| 120–300 | Type (`typing`), with both hands reaching the keyboard |
| 150–270 | The monitor bars grow |
| 150–300 | Camera pushes in on the character and the monitor (it holds on the wide shot until frame 150) |

**Things to change**

- `CHAIR` moves the chair. `DESK` moves the desk. `MONITOR` is derived from the desk.
- `WALK_END` is where the character stops before sitting. It is set from the seat, so change `CHAIR` rather than `WALK_END`.
- `KEYBOARD_Y` and the `keyL` and `keyR` targets set the hand positions. Keep them within reach of the seated shoulder (about 140 units).
- The `keysObj` list sets the camera. The last key frames the character and the monitor together.
- `CUES` sets the three captions.

**What it demonstrates:** `seatedAnchor`, `anchor="hip"` with `footL` and `footR`, `reachL` and `reachR`, a custom screen drawn inside `Monitor`, and a multi-stage camera.

**Note on the sit:** the feet move from the walking position to the seat during the one-second sit, so they can slide a little. For a starter
scene this is acceptable. A more exact version would lift the feet and step them into place.

---

## Example 03 — Mini documentary

**File:** `src/scenes/Example03MiniDocumentary.tsx`

Three short scenes, joined with `Sequence`:

| Scene | Frames | What happens |
|---|---|---|
| 1 — Introduction | 0–90 | A character stands in the middle of the frame. Caption: "Meet our stickman." |
| 2 — Pointing | 90–210 | The character points at a board marked IDEA while the camera pushes in. Caption: "Here is the first idea." |
| 3 — Diagram | 210–330 | Three boxes appear one after another: Input, Process, Output. Caption: "Input, process, output." |

**Optional narration:** pass a file under `public/` through the `narration` prop. The composition plays it from the start. Example:

```bash
npm run render -- Example03-MiniDocumentary out/mini-narrated.mp4 --props='{"narration":"audio/my-narration.mp3"}'
```

**Things to change**

- `SCENE1`, `SCENE2` and `SCENE3` set each scene's start and length. Keep them matched to your narration.
- The board text (`IDEA`) and the three diagram labels (`steps`) are plain text.
- `CAPTIONS` sets the captions and their frames.

**What it demonstrates:** `Sequence` for scenes, `point` for a pointing arm, `Board` and `Label`, a fade-in on each step, and the `Narration` component.

**Original content:** the board, the diagram and the captions are written for this kit. They do not use any existing documentary's story,
characters or artwork.
