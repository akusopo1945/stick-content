# CLAUDE.md — Stickman Documentary Starter

Guide for building simple stickman animations in this Remotion project (1080 × 1920, 30 fps, TypeScript + React).
Read this file first. It is short on purpose: open only the files it points to.

## Where things are

| Need | File |
|---|---|
| The stickman (body, limbs, face, hands) | `src/rig/Stickman.tsx` |
| Poses (`idle, walk, sit, typing, point, cheer, mix`) | `src/rig/poses.ts` |
| Clothing presets (`CASUAL, SHIRT_ORANGE, JACKET_BLUE`) and hair | `src/rig/looks.tsx` |
| Sitting on a chair (`seatedAnchor`) | `src/rig/seat.ts` |
| Camera and layers (`Camera2D`, `Layer`) | `src/camera/Camera2D.tsx` |
| Easing and keyframes (`prog, keys, keysObj, spline`) | `src/motion/ease.ts` |
| Floor, wall, desk, monitor, chair, board, label | `src/environment/Furniture.tsx` |
| Captions (`CaptionTrack`, cues with `from`, `to`, `text`, `pos`, `y`) | `src/captions/CaptionTrack.tsx` |
| Optional narration (`Narration`) | `src/audio/Narration.tsx` |
| Colours, font, frame size | `src/styles/palette.ts` |
| The list of videos you can render | `src/Root.tsx` |

## Available animations

- **Standing:** `idle(t)` breathing and blinking; `cheer(t)` arms up.
- **Walking:** `walk(phase, t)`. Use `phase = distance / (STRIDE * scale)` so the feet stay on the ground.
- **Sitting:** `seatedAnchor(chair, scale)` gives `hip, footL, footR`. Use `anchor="hip"`, then `sit(t)` or `typing(t)`.
- **Pointing:** `point(base, k)`, where `k` goes from 0 to 1.
- **Blending:** `mix(poseA, poseB, k)`.
- **Hands:** `reachL` and `reachR` set world positions for the hands (keep them within about 140 units of the shoulder).

## Reuse first (REUSE → RESKIN → NEW)

1. **REUSE** a working example. The three in `src/scenes/` cover most needs. Copy one and edit it.
2. **RESKIN** by changing colours, text, positions, `look` presets, frame numbers and captions. Most new work is this.
3. **NEW** code only when 1 and 2 can't do it. Add new reusable parts to the matching folder under `src/`.

## Build a simple scene

- A scene is a React component. Get the frame with `useCurrentFrame()`. The same frame must always draw the same picture: no timers, no unseeded random numbers.
- Put characters and the floor on `<Layer depth={1}>`. Put walls on `<Layer depth={0.5}>`.
- Every camera object needs `x, y, zoom, rot`. `rot` is in degrees; use `0` for none.
- Seated characters: `anchor="hip"` with `footL` and `footR` from `seatedAnchor`.
- Add the scene to `src/Root.tsx` as a `<Composition>` with `durationInFrames`, `fps={FPS}`, `width={W}` and `height={H}`.
- For a multi-scene film, use `<Sequence from={...} durationInFrames={...}>` for each scene inside one composition.

## Validate and render

```bash
npm run typecheck                                              # must exit 0 before you render
npx remotion compositions src/index.ts                         # lists the compositions
npm run still -- <Id> out/check.png --frame=<n>                # one frame, to check a position or caption
npm run render -- <Id> out/<name>.mp4                          # full MP4
```

Check a still at each caption's start and at any camera move before a full render.

## Common tasks (REUSE → RESKIN first)

- **Start a new scene:** copy the closest example in `src/scenes/`, rename it, register it in `src/Root.tsx`, and change its numbers.
- **Modify a character:** reskin a look in `src/rig/looks.tsx` (change `top`, `trousers`, `coat`, `headExtra`), or write `{...CASUAL, top: "#..."}`.
- **Add an environment:** use `Wall, Floor, Desk, Monitor, OfficeChair, Board, Label` from `src/environment/Furniture.tsx`, on `Layer` depths 0.5 (back) and 1 (front).
- **Import audio:** put the user's MP3 in `public/audio/`, then pass `narration: "audio/file.mp3"` (see `Example03MiniDocumentary`).
- **Add captions:** a list of `{from, to, text, pos?, y?}` frames, passed to `<CaptionTrack cues={...} />`. Check placement with a still.
- **Render:** `npm run render -- <Id> out/<name>.mp4`. Check a still first with `npm run still -- <Id> out/check.png --frame=<n>`.

## Save tokens

- Don't read every file. Start from the table above and open only the file you need.
- Read a whole example only when you're changing it. Otherwise read the part you need, with line ranges.
- Don't re-check the whole project for a small change. Run `npm run typecheck` once at the end.
- Prefer editing numbers (frames, positions, colours) to rewriting code.
- Keep the kit's docs for detail: `docs/` holds the guides, so this file doesn't have to repeat them.

## Read more when needed

- `README.md`: what the kit is, install, commands, troubleshooting.
- `docs/GETTING_STARTED.md`: first run, rendering, troubleshooting.
- `docs/CHARACTER_GUIDE.md`: looks, poses, sitting, reaching.
- `docs/CAMERA_GUIDE.md`: keyframes, layers, follow and push-in.
- `docs/SCENE_GUIDE.md`: rooms, multi-scene films, checklist.
- `docs/AUDIO_CAPTIONS.md`: narration files, caption timing and placement.
- `docs/EXAMPLES.md`: each example, frame by frame.

## Rules for this project

- Don't add a watermark, handle or logo unless the user asks for one.
- Use text labels for on-screen names. Don't add artwork or logos from any brand.
- Don't add audio or voice files. The user supplies narration in `public/audio/`.
- Don't commit or publish anything without the user's say-so.
