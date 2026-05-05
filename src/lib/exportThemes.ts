// ─── Export Theme System ────────────────────────────────────────────────────
// All PDF exports use this shared theme palette.
// Couples pick a theme once and it applies to every downloaded document.

export type ThemeKey = "gold" | "rose" | "sage" | "navy" | "ivory" | "dark";

export interface ExportTheme {
  key: ThemeKey;
  name: string;
  emoji: string;
  // PDF color triplets [R, G, B]
  accent:       [number, number, number]; // primary brand color
  accentLight:  [number, number, number]; // soft tint of accent
  accentText:   [number, number, number]; // text on accent backgrounds
  bg:           [number, number, number]; // page / card background
  surface:      [number, number, number]; // alternating row / card fill
  text:         [number, number, number]; // primary text
  muted:        [number, number, number]; // secondary / caption text
  border:       [number, number, number]; // rule lines
  white:        [number, number, number]; // white (stays white in all themes)
}

export const EXPORT_THEMES: Record<ThemeKey, ExportTheme> = {
  gold: {
    key: "gold", name: "Classic Gold", emoji: "✨",
    accent:      [175, 140,  78],
    accentLight: [245, 235, 210],
    accentText:  [255, 252, 242],
    bg:          [252, 249, 244],
    surface:     [246, 240, 228],
    text:        [ 52,  45,  35],
    muted:       [140, 122,  95],
    border:      [210, 195, 165],
    white:       [255, 255, 255],
  },
  rose: {
    key: "rose", name: "Dusty Rose", emoji: "🌸",
    accent:      [185, 115, 115],
    accentLight: [248, 232, 232],
    accentText:  [255, 248, 248],
    bg:          [253, 248, 248],
    surface:     [249, 238, 238],
    text:        [ 58,  38,  38],
    muted:       [168, 125, 125],
    border:      [220, 185, 185],
    white:       [255, 255, 255],
  },
  sage: {
    key: "sage", name: "Sage Garden", emoji: "🌿",
    accent:      [ 95, 138, 108],
    accentLight: [218, 238, 225],
    accentText:  [242, 252, 246],
    bg:          [247, 252, 248],
    surface:     [230, 244, 235],
    text:        [ 32,  52,  38],
    muted:       [105, 142, 118],
    border:      [180, 218, 192],
    white:       [255, 255, 255],
  },
  navy: {
    key: "navy", name: "Navy & Gold", emoji: "⚓",
    accent:      [ 42,  70, 138],
    accentLight: [208, 220, 248],
    accentText:  [230, 238, 255],
    bg:          [247, 249, 254],
    surface:     [225, 232, 250],
    text:        [ 22,  32,  62],
    muted:       [ 95, 118, 168],
    border:      [175, 195, 235],
    white:       [255, 255, 255],
  },
  ivory: {
    key: "ivory", name: "Modern Ivory", emoji: "🕊️",
    accent:      [ 68,  62,  52],
    accentLight: [236, 232, 222],
    accentText:  [252, 250, 245],
    bg:          [255, 254, 250],
    surface:     [245, 242, 234],
    text:        [ 44,  40,  33],
    muted:       [142, 136, 118],
    border:      [210, 205, 190],
    white:       [255, 255, 255],
  },
  dark: {
    key: "dark", name: "Dark Romance", emoji: "🌹",
    accent:      [195, 152,  85],
    accentLight: [ 68,  52,  80],
    accentText:  [252, 242, 220],
    bg:          [ 28,  22,  34],
    surface:     [ 42,  34,  52],
    text:        [238, 230, 215],
    muted:       [165, 148, 125],
    border:      [ 72,  58,  88],
    white:       [248, 242, 230],
  },
};

export const DEFAULT_THEME: ThemeKey = "gold";
