import {loadFont as loadInter} from "@remotion/google-fonts/Inter";

// Starter palette: a dark, minimal look with bone-white figures and a warm accent.
// Change these values to restyle every character and room at once.
export const C = {
  charcoal: "#191A1B",
  olive: "#414B34",
  orange: "#C45D31",
  yellow: "#E8C763",
  bone: "#E9E7DF",
  plum: "#34263F",
  cyan: "#35CBFA",

  ink: "#111213", // outlines
  night: "#0E0F11", // deepest background
  wall: "#24262A",
  wallLine: "#1C1D20",
  floor: "#17181A",
  trousers: "#34373B",
  shoe: "#141516",
  wood: "#4A3A2C",
  woodDark: "#33281F",
  steel: "#5A6068",
  red: "#D2483C",
};

// Inter (SIL Open Font License) is loaded through @remotion/google-fonts.
export const FONT = loadInter("normal", {weights: ["600", "700", "800"], subsets: ["latin"]}).fontFamily;

export const W = 1080;
export const H = 1920;
export const FPS = 30;
