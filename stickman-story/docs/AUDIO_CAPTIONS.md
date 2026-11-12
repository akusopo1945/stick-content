# Audio and captions

The kit ships with no audio and no voice. You bring your own narration MP3, and you place captions by hand.

## Narration

### Add your MP3

1. Put the file in `public/audio/`, for example `public/audio/my-narration.mp3`.
2. Pass its path to `Example03MiniDocumentary` as the `narration` prop, relative to `public/`:

```bash
npm run render -- Example03-MiniDocumentary out/mini.mp4 --props='{"narration":"audio/my-narration.mp3"}'
```

Or change the default in `src/Root.tsx`:

```tsx
defaultProps={{narration: "audio/my-narration.mp3"}}
```

To add narration to your own scene, place the `Narration` component anywhere inside the scene:

```tsx
import {Narration} from "../audio/Narration";

<Narration file="audio/my-narration.mp3" volume={0.9} />
```

The narration starts at the beginning of the scene where it is placed. `volume` is from 0 (silent) to 1.

### Keep the timing

- Set the composition length to match your narration. Measure the MP3 length in seconds and multiply by 30 for frames. A 10.5-second
  narration needs 315 frames. Round up so the last word is not cut.
- Place each scene's start frame at the moment its narration begins. Scenes can be longer than their narration, but never
  shorter.
- Adjust each scene's length in frames in `Example03MiniDocumentary.tsx` (`SCENE1`, `SCENE2`, `SCENE3`).

### Rights

Only use audio you have the right to use. The kit does not include, and does not link to, any recording.

## Captions

### Write a caption

Captions are plain objects in a list. Each one has a start frame, an end frame and the text:

```tsx
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";

const CAPTIONS: CaptionCue[] = [
  {from: 10, to: 80, text: "Meet our stickman.", pos: "lower"},
  {from: 100, to: 200, text: "Here is the first idea.", pos: "lower"},
  {from: 225, to: 325, text: "Input, process, output.", pos: "lower"},
];

<CaptionTrack cues={CAPTIONS} />
```

- `from` is the first frame the caption is on screen. `to` is the first frame after it leaves (the caption is visible for `to - from` frames).
- Frames are counted from the start of the composition, not the scene, when you put `CaptionTrack` at the top level, as `Example03` does.
- A caption fades in over 7 frames and out over 6 frames. You do not need to set this.

### Two lines at most

Use `\n` for a second line. Keep phrases short, about 30 characters per line, so the text fits the 900-pixel width:

```tsx
{from: 40, to: 130, text: "Each step passes the\nresult to the next."}
```

If a caption is too long, split it into two cues rather than making the font smaller. The font size is fixed at 54 pixels.

### Choose a position

Captions have five named positions. Each is the top edge of the caption block, in pixels from the top of the 1080 × 1920 frame:

| `pos` | Top (px) | Use it when |
|---|---|---|
| `top` | 420 | The lower part of the frame has the action |
| `upper` | 620 | The centre of the frame is busy and the lower part is clear |
| `mid` | 860 | The action is in the upper half |
| `lower` | 1380 | **The default.** The lower third, clear of the bottom of the frame |

Use `y` for any other height:

```tsx
{from: 0, to: 90, text: "A caption at a custom height.", y: 1200}
```

### Basic manual placement

Captions are not moved for you. Check each one yourself:

1. Render a still at the middle of the caption, with the caption on screen:

   ```bash
   npm run still -- Example02-OfficeScene out/check.png --frame=150
   ```

2. Open `out/check.png` and look at where the text lands.
3. If the caption covers a face, a hand, a key number or a label, change the `pos`, or set a `y` value that clears it.
4. Repeat for each caption whose on-screen content changes.

Good habits:

- Keep important objects out of the lower third when you use the default position.
- Keep captions inside the 90-pixel margin on each side. The kit does this for you, but a very wide line can still get close.
- Keep text away from the bottom 300 pixels of the frame. Phone apps draw their own buttons there.
- Keep captions readable: the text has a dark shadow, so light text on a light background is still a problem. Move the caption
  to a darker area.
- Use one caption at a time for a clear reading order. The examples never overlap two captions.

### Why placement is manual

The kit does not detect where objects are on screen. Automatic collision checks would need the scene's geometry and camera
at every frame, which is more machinery than a beginner needs. Checking a few stills takes less time than building that system.

## Subtitles in the final file

The caption layer is part of the rendered MP4. The kit does not write a separate subtitle file (SRT). If you need one, write the
cues out yourself from the same list.
