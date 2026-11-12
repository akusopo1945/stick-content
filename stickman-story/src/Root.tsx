import {KursiStory, KursiStory_FRAMES} from "./scenes/KursiStory";
import {KoranStory, KoranStory_FRAMES} from "./scenes/KoranStory";
import {PemakzulanStory, PemakzulanStory_FRAMES} from "./scenes/PemakzulanStory";
import {WapresStory, WapresStory_FRAMES} from "./scenes/WapresStory";
import React from "react";
import {Composition} from "remotion";
import {Example01WalkingStickman, EXAMPLE01_FRAMES} from "./scenes/Example01WalkingStickman";
import {Example02OfficeScene, EXAMPLE02_FRAMES} from "./scenes/Example02OfficeScene";
import {Example03MiniDocumentary, EXAMPLE03_FRAMES} from "./scenes/Example03MiniDocumentary";
import {AiStory, AISTORY_FRAMES} from "./scenes/AiStory";
import {FPS, H, W} from "./styles/palette";

// One composition per example. Render with: npx remotion render src/index.ts <Id> out/<name>.mp4
export const Root: React.FC = () => (
  <>
    <Composition id="Example01-WalkingStickman" component={Example01WalkingStickman} durationInFrames={EXAMPLE01_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Example02-OfficeScene" component={Example02OfficeScene} durationInFrames={EXAMPLE02_FRAMES} fps={FPS} width={W} height={H} />
    <Composition
      id="Example03-MiniDocumentary"
      component={Example03MiniDocumentary}
      durationInFrames={EXAMPLE03_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: undefined}}
    />
    <Composition
      id="AiStory"
      component={AiStory}
      durationInFrames={AISTORY_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/narration.mp3"}}
    />
    <Composition
      id="WapresStory"
      component={WapresStory}
      durationInFrames={WapresStory_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/Wapres_narration.mp3"}}
    />
    <Composition
      id="PemakzulanStory"
      component={PemakzulanStory}
      durationInFrames={PemakzulanStory_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/Pemakzulan_narration.mp3"}}
    />
    <Composition
      id="KoranStory"
      component={KoranStory}
      durationInFrames={KoranStory_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/Koran_narration.mp3"}}
    />
    <Composition
      id="KursiStory"
      component={KursiStory}
      durationInFrames={KursiStory_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/Kursi_narration.mp3"}}
    />
  </>
);
