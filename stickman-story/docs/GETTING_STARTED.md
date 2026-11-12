# Getting started

This guide takes you from an empty folder to an MP4 of a stickman walking across a room.

## 1. What you need

- **Node.js 22 or newer.** Check with `node -v`. Download from [nodejs.org](https://nodejs.org) if needed.
- **A terminal.** Windows PowerShell, Git Bash, macOS Terminal or Linux shell all work.
- **About 1 GB of free disk space** for the packages and a Chromium browser that Remotion downloads on first use.
- **Internet access** for the first install and for loading the Inter font when you render.

You do not need any account or API key.

## 2. Install

From the project folder:

```bash
npm install
```

This installs the exact versions the kit was tested with: Remotion 4.0.535, React 19.2.3 and TypeScript 5.9.3.

If npm asks you to approve an install script for `esbuild`, run `npm approve-scripts` and accept it. The kit already lists
that approval in `package.json`, so this should not happen.

## 3. Check that it works

```bash
npm run typecheck
```

A clean run prints nothing and exits with code 0. Then list the compositions:

```bash
npx remotion compositions src/index.ts
```

You should see three compositions:

```
Example01-WalkingStickman    30    1080x1920    150 (5.00 sec)
Example02-OfficeScene        30    1080x1920    360 (12.00 sec)
Example03-MiniDocumentary    30    1080x1920    330 (11.00 sec)
```

## 4. Preview

```bash
npm run studio
```

This starts the Remotion Studio server. Open `http://localhost:3000` in your browser (the terminal says so when the server is ready).
Pick a composition from the list and drag the timeline to scrub through it. Changes to the code appear as soon as you save.

## 5. Render an MP4

```bash
npm run render -- Example01-WalkingStickman out/example01.mp4
```

The file is written to `out/example01.mp4`. Remotion creates the `out/` folder if it is missing. Render time depends on your
machine; the kit's own tests rendered all four test MP4s without problems.

To render just a few frames, which is useful for checking a single moment:

```bash
npm run still -- Example02-OfficeScene out/check.png --frame=300
```

## 6. Change something

Open `src/scenes/Example01WalkingStickman.tsx` and change the walk's end point:

```tsx
const END_X = 420;   // change this to 200 to make the walk shorter
```

Save the file. The studio updates at once. Then read the [character guide](CHARACTER_GUIDE.md) to change the clothes.

## 7. Troubleshooting

**`Cannot find module 'remotion'` or similar.** The packages are not installed. Run `npm install` in the project folder.

**The render stops with an error about Chromium.** Remotion downloads a headless browser the first time. Check your internet
connection and run the command again. If a proxy blocks the download, see the Remotion documentation for setting a browser path.

**The captions look like a generic sans-serif.** The Inter font is loaded from Google Fonts when the project starts. If the font
cannot load, check your internet connection and try again.

**`tsc` reports a type error after you edit a scene.** The most common cause is a camera keyframe missing `rot`. Every camera
object needs `x`, `y`, `zoom` and `rot`. Add `rot: 0`.

**A caption covers the figure.** Move the caption with a different `pos` (`top`, `upper`, `mid`, `lower`) or set `y` to a pixel
value. See [the audio and captions guide](AUDIO_CAPTIONS.md).

**The character floats above the floor or sinks into it.** A seated character must use `anchor="hip"` with `seatedAnchor`. A
standing character uses `anchor="feet"` (the default) and `y` set to `FLOOR`.

**The MP4 has no sound.** The examples have no audio on purpose. To add narration, see [the audio and captions guide](AUDIO_CAPTIONS.md).
