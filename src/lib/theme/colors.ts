/**
 * Theme system: two themes (Candy + Platinum), each with light + dark.
 *
 * Backward compat: `colors` object exports CSS var references so existing
 * code (`colors.primary`) keeps working and reacts to theme changes at runtime.
 *
 * For canvas / Three.js / SVG that needs real hex values, use
 * `useTheme()` from ThemeProvider to get the resolved palette.
 */

export type ThemeName = 'candy' | 'platinum';
export type ThemeMode = 'light' | 'dark';

export interface ThemePalette {
  // Surfaces
  background: string;
  cardBg: string;
  cardBgHover: string;
  cardBorder: string;

  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;
  primaryBorder: string;

  // Accent (Candy: warm yellow / Platinum: electric lime)
  accent: string;
  accentLight: string;
  accentDark: string;
  accentHover: string;

  // Premium (gold/champagne for Mega packs, top tiers)
  premium: string;
  premiumLight: string;
  premiumDark: string;

  // Aluminum/platinum (Robinhood ring vibe — for hero illustrations / borders)
  metallic: string;
  metallicLight: string;

  // Secondary (legacy slot)
  secondary: string;
  secondaryLight: string;

  // Subjects (preserved across themes — kid identity)
  reading: string;
  readingLight: string;
  math: string;
  mathLight: string;
  physics: string;
  physicsLight: string;
  chemistry: string;
  chemistryLight: string;
  sadhana: string;
  sadhanaLight: string;
  philosophy: string;
  philosophyLight: string;
  labyrinth: string;
  labyrinthLight: string;

  // Gradients (background hero / overlays)
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  overlayFrom: string;
  overlayTo: string;

  // Token tiers
  tokenCopper: string;
  tokenCopperLight: string;
  tokenSilver: string;
  tokenSilverLight: string;
  tokenGold: string;
  tokenGoldLight: string;
  tokenPlatinum: string;
  tokenPlatinumLight: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Semantic — same across themes (WCAG / universal meaning)
  success: string;
  warning: string;
  error: string;
}

const SUBJECTS = {
  reading: '#00b894',
  readingLight: '#55efc4',
  math: '#0984e3',
  mathLight: '#74b9ff',
  physics: '#6c5ce7',
  physicsLight: '#a29bfe',
  chemistry: '#e17055',
  chemistryLight: '#fab1a0',
  sadhana: '#d63384',
  sadhanaLight: '#f48fb1',
  philosophy: '#8e44ad',
  philosophyLight: '#c39bd3',
  labyrinth: '#f39c12',
  labyrinthLight: '#fcd29f',
} as const;

const SEMANTIC = {
  success: '#00b894',
  warning: '#ffd93d',
  error: '#ff6b6b',
} as const;

// ---------- CANDY (current playful look) ----------

const candyLight: ThemePalette = {
  background: '#fff9f0',
  cardBg: '#ffffff',
  cardBgHover: '#fffaf5',
  cardBorder: 'rgba(10, 99, 117, 0.12)',

  primary: '#0a6375',
  primaryLight: '#4ecdc4',
  primaryDark: '#074a58',
  primaryBg: 'rgba(10, 99, 117, 0.08)',
  primaryBorder: 'rgba(10, 99, 117, 0.2)',

  accent: '#ffd93d',
  accentLight: '#ffe57f',
  accentDark: '#f0c400',
  accentHover: '#fcd116',

  premium: '#d4af37',
  premiumLight: '#f5d76e',
  premiumDark: '#a88a25',

  metallic: '#a8adb4',
  metallicLight: '#d4d7dc',

  secondary: '#ff6b6b',
  secondaryLight: '#ff8e8e',

  ...SUBJECTS,

  gradientFrom: '#0a6375',
  gradientVia: '#2d8a99',
  gradientTo: '#4ecdc4',
  overlayFrom: 'rgba(10, 99, 117, 0.85)',
  overlayTo: 'rgba(78, 205, 196, 0.75)',

  tokenCopper: '#cd7f32',
  tokenCopperLight: '#e4a668',
  tokenSilver: '#a8adb4',
  tokenSilverLight: '#d4d7dc',
  tokenGold: '#d4af37',
  tokenGoldLight: '#f5d76e',
  tokenPlatinum: '#7570a0',
  tokenPlatinumLight: '#b8b2c7',

  textPrimary: '#2d3436',
  textSecondary: '#636e72',
  textMuted: '#b2bec3',

  ...SEMANTIC,
};

const candyDark: ThemePalette = {
  ...candyLight,
  background: '#1a1614',
  cardBg: '#2a2420',
  cardBgHover: '#332c27',
  cardBorder: 'rgba(255, 255, 255, 0.08)',

  primary: '#4ecdc4',
  primaryLight: '#7eddd6',
  primaryDark: '#0a6375',
  primaryBg: 'rgba(78, 205, 196, 0.12)',
  primaryBorder: 'rgba(78, 205, 196, 0.28)',

  textPrimary: '#f5e6d3',
  textSecondary: '#b8a99a',
  textMuted: '#7a6f63',
};

// ---------- PLATINUM (Robinhood-inspired premium) ----------

const platinumDark: ThemePalette = {
  background: '#000000',
  cardBg: '#0F0F0F',
  cardBgHover: '#1A1A1A',
  cardBorder: 'rgba(255, 255, 255, 0.08)',

  // In Platinum the "primary" is the electric lime — used as primary accent
  primary: '#C3F54C',
  primaryLight: '#DCFA6E',
  primaryDark: '#8FB833',
  primaryBg: 'rgba(195, 245, 76, 0.10)',
  primaryBorder: 'rgba(195, 245, 76, 0.28)',

  accent: '#C3F54C',
  accentLight: '#DCFA6E',
  accentDark: '#8FB833',
  accentHover: '#D8FF6A',

  premium: '#C8B88A',
  premiumLight: '#E8D9A8',
  premiumDark: '#9C8A5E',

  // The aluminum-violet ring color
  metallic: '#9F9AAB',
  metallicLight: '#B8B2C7',

  secondary: '#FF4B6E',
  secondaryLight: '#FF7A93',

  ...SUBJECTS,

  // Subject colors stay the same hue but slightly brighter for dark bg
  readingLight: '#6FF0C9',
  mathLight: '#80C0FF',
  physicsLight: '#B5ADFF',
  chemistryLight: '#FFB098',
  sadhanaLight: '#FF9DC4',
  philosophyLight: '#D4A5E8',
  labyrinthLight: '#FFD580',

  gradientFrom: '#000000',
  gradientVia: '#0a0a0a',
  gradientTo: '#1A1A1A',
  overlayFrom: 'rgba(0, 0, 0, 0.92)',
  overlayTo: 'rgba(20, 20, 20, 0.78)',

  tokenCopper: '#cd7f32',
  tokenCopperLight: '#e4a668',
  tokenSilver: '#B8B2C7',
  tokenSilverLight: '#D6D2DC',
  tokenGold: '#C8B88A',
  tokenGoldLight: '#E8D9A8',
  tokenPlatinum: '#9F9AAB',
  tokenPlatinumLight: '#C7C1D6',

  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#48484A',

  ...SEMANTIC,
};

const platinumLight: ThemePalette = {
  background: '#FAFAF7',
  cardBg: '#FFFFFF',
  cardBgHover: '#F5F5F2',
  cardBorder: 'rgba(0, 0, 0, 0.08)',

  primary: '#1A1A1A',
  primaryLight: '#3A3A3A',
  primaryDark: '#000000',
  primaryBg: 'rgba(0, 0, 0, 0.05)',
  primaryBorder: 'rgba(0, 0, 0, 0.12)',

  // On light, lime is too bright — use a deeper green-olive for the accent
  accent: '#8FB833',
  accentLight: '#B0D157',
  accentDark: '#6A8E1F',
  accentHover: '#A0C840',

  premium: '#9C8A5E',
  premiumLight: '#C8B88A',
  premiumDark: '#6E5F3D',

  metallic: '#7570A0',
  metallicLight: '#9F9AAB',

  secondary: '#D63E5C',
  secondaryLight: '#E87689',

  ...SUBJECTS,

  gradientFrom: '#FAFAF7',
  gradientVia: '#F0EFE9',
  gradientTo: '#E5E2D7',
  overlayFrom: 'rgba(255, 255, 255, 0.9)',
  overlayTo: 'rgba(245, 244, 240, 0.75)',

  tokenCopper: '#a36426',
  tokenCopperLight: '#cd7f32',
  tokenSilver: '#7570A0',
  tokenSilverLight: '#9F9AAB',
  tokenGold: '#9C8A5E',
  tokenGoldLight: '#C8B88A',
  tokenPlatinum: '#5A5478',
  tokenPlatinumLight: '#7570A0',

  textPrimary: '#1A1A1A',
  textSecondary: '#5C5C5C',
  textMuted: '#A0A0A0',

  ...SEMANTIC,
};

export const themes: Record<ThemeName, Record<ThemeMode, ThemePalette>> = {
  candy: { light: candyLight, dark: candyDark },
  platinum: { light: platinumLight, dark: platinumDark },
};

export const DEFAULT_THEME: ThemeName = 'candy';
export const DEFAULT_MODE: ThemeMode = 'light';

/**
 * Token names that map 1:1 to CSS variables on `:root`.
 * The list determines what gets injected into the document.
 */
export const TOKEN_KEYS: (keyof ThemePalette)[] = [
  'background',
  'cardBg',
  'cardBgHover',
  'cardBorder',
  'primary',
  'primaryLight',
  'primaryDark',
  'primaryBg',
  'primaryBorder',
  'accent',
  'accentLight',
  'accentDark',
  'accentHover',
  'premium',
  'premiumLight',
  'premiumDark',
  'metallic',
  'metallicLight',
  'secondary',
  'secondaryLight',
  'reading',
  'readingLight',
  'math',
  'mathLight',
  'physics',
  'physicsLight',
  'chemistry',
  'chemistryLight',
  'sadhana',
  'sadhanaLight',
  'philosophy',
  'philosophyLight',
  'labyrinth',
  'labyrinthLight',
  'gradientFrom',
  'gradientVia',
  'gradientTo',
  'overlayFrom',
  'overlayTo',
  'tokenCopper',
  'tokenCopperLight',
  'tokenSilver',
  'tokenSilverLight',
  'tokenGold',
  'tokenGoldLight',
  'tokenPlatinum',
  'tokenPlatinumLight',
  'textPrimary',
  'textSecondary',
  'textMuted',
  'success',
  'warning',
  'error',
];

/** camelCase → kebab-case for CSS var names */
export function toCssVarName(key: string): string {
  return `--theme-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
}

/**
 * Backward-compatible `colors` export: every key returns its CSS var reference,
 * so all existing `colors.primary` usages keep working AND react to theme switches.
 */
type ColorsProxy = Record<keyof ThemePalette, string>;

export const colors: ColorsProxy = TOKEN_KEYS.reduce((acc, key) => {
  acc[key] = `var(${toCssVarName(key)})`;
  return acc;
}, {} as ColorsProxy);
