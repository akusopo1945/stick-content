import React from "react";
import {Audio, staticFile} from "remotion";

/*
 * Optional narration. Put your own MP3 in public/audio/ and pass its file name, for example
 *   <Narration file="audio/my-narration.mp3" />
 * Nothing is played when no file is given, so the examples work silently out of the box.
 * The MP3 is not included in this kit: record or export your own, and you own its rights.
 */
export const Narration: React.FC<{file?: string; volume?: number}> = ({file, volume = 0.9}) => {
  if (!file) return null;
  return <Audio src={staticFile(file)} volume={volume} />;
};
