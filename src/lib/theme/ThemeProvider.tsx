'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  themes,
  toCssVarName,
  TOKEN_KEYS,
  DEFAULT_THEME,
  DEFAULT_MODE,
  type ThemeName,
  type ThemeMode,
  type ThemePalette,
} from './colors';
import { buildMuiTheme } from './theme';

const STORAGE_THEME = 'bk-theme';
const STORAGE_MODE = 'bk-theme-mode';

interface ThemeContextValue {
  themeName: ThemeName;
  mode: ThemeMode;
  palette: ThemePalette;
  setTheme: (name: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyCssVars(palette: ThemePalette, themeName: ThemeName, mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const key of TOKEN_KEYS) {
    root.style.setProperty(toCssVarName(key), palette[key]);
  }
  root.dataset.theme = themeName;
  root.dataset.mode = mode;
  root.style.colorScheme = mode;
}

function readStoredTheme(): { themeName: ThemeName; mode: ThemeMode } {
  if (typeof window === 'undefined') {
    return { themeName: DEFAULT_THEME, mode: DEFAULT_MODE };
  }
  try {
    const t = (localStorage.getItem(STORAGE_THEME) as ThemeName | null) ?? DEFAULT_THEME;
    const m = (localStorage.getItem(STORAGE_MODE) as ThemeMode | null) ?? DEFAULT_MODE;
    return {
      themeName: t === 'platinum' || t === 'candy' ? t : DEFAULT_THEME,
      mode: m === 'dark' || m === 'light' ? m : DEFAULT_MODE,
    };
  } catch {
    return { themeName: DEFAULT_THEME, mode: DEFAULT_MODE };
  }
}

export function BrainKidsThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from storage on first render (client) — SSR will use defaults,
  // but the inline anti-flash script in <head> already set the right vars.
  const [themeName, setThemeName] = useState<ThemeName>(DEFAULT_THEME);
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = readStoredTheme();
    setThemeName(stored.themeName);
    setModeState(stored.mode);
  }, []);

  const palette = themes[themeName][mode];

  // Apply CSS variables every time theme/mode changes
  useEffect(() => {
    applyCssVars(palette, themeName, mode);
  }, [palette, themeName, mode]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    try {
      localStorage.setItem(STORAGE_THEME, name);
    } catch {}
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_MODE, m);
    } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(STORAGE_MODE, next);
      } catch {}
      return next;
    });
  }, []);

  const muiTheme = useMemo(() => buildMuiTheme(palette, themeName), [palette, themeName]);

  const ctx = useMemo<ThemeContextValue>(
    () => ({ themeName, mode, palette, setTheme, setMode, toggleMode }),
    [themeName, mode, palette, setTheme, setMode, toggleMode],
  );

  return (
    <ThemeContext.Provider value={ctx}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <BrainKidsThemeProvider>');
  }
  return ctx;
}

/**
 * Inline script that sets data-theme + CSS vars BEFORE first paint
 * to prevent flash of wrong theme. Defaults (Candy Light) live in globals.css
 * so SSR has them; this script overrides based on user preference.
 */
export function ThemeAntiFlashScript() {
  const script = `
(function(){
  try {
    var t = localStorage.getItem('${STORAGE_THEME}');
    var m = localStorage.getItem('${STORAGE_MODE}');
    if (t !== 'candy' && t !== 'platinum') t = '${DEFAULT_THEME}';
    if (m !== 'light' && m !== 'dark') m = '${DEFAULT_MODE}';
    var THEMES = ${JSON.stringify(themes)};
    var p = THEMES[t][m];
    var root = document.documentElement;
    for (var k in p) {
      root.style.setProperty('--theme-' + k.replace(/[A-Z]/g, function(c){ return '-' + c.toLowerCase(); }), p[k]);
    }
    root.dataset.theme = t;
    root.dataset.mode = m;
    root.style.colorScheme = m;
  } catch(e) {}
})();
`.trim();

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
