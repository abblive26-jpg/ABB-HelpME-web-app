import { Appearance, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Colours follow the supplied Stitch reference. No official ABB assets are bundled.
//
// Two palettes, light and dark, chosen (not inverted). `colors`, `accents` and `shadow` always hold the
// active palette; stylesheets made with `themed()` are rebuilt when the theme changes.

const LIGHT = {
  red: '#E4002B',
  redDark: '#B80022',
  redTint: '#FDECEF',
  redLine: '#F5B8C2',
  /** Main text. */
  navy: '#0F1B33',
  /** Secondary text. */
  navy2: '#3B4863',
  muted: '#6B7690',
  border: '#E3E7EF',
  /** Hairline around cards. */
  line: '#EEF0F5',
  surface: '#FFFFFF',
  bg: '#FAF8F6',
  success: '#1E8E5A',
  warning: '#C77700',
  /** The navy hero cards (Home, profile, contribution). Dark in both themes, with light text on top. */
  hero: '#0F1B33',
  heroText: '#FFFFFF',
  heroMuted: '#C9D1E2',
  /** A white plate behind Cappy on dark cards. */
  plate: '#FFFFFF',
  scrim: '#0F1B3366',
  selected: '#FFF7F8',
  // category pastels (never the only signal — always paired with label + icon)
  blush: '#FDE8EC',
  blue: '#E6F0FD',
  green: '#E3F5EC',
  purple: '#EEE8FB',
  teal: '#E0F4F3',
  sand: '#F1EFEC',
  orange: '#FDEFD9',
  /** Text on the pastel badges. */
  onTeal: '#0B5E5A',
  onGreen: '#0F6B43',
  onOrange: '#8A5300',
};
export type Palette = typeof LIGHT;

const DARK: Palette = {
  red: '#FF3D5E',
  redDark: '#FF8095',
  redTint: '#3A1720',
  redLine: '#6B2433',
  navy: '#EEF1F7',
  navy2: '#C3CAD8',
  muted: '#8E98AD',
  border: '#2B3243',
  line: '#232A39',
  surface: '#171C26',
  bg: '#0E1117',
  success: '#45C988',
  warning: '#F2AC3B',
  hero: '#1A2440',
  heroText: '#FFFFFF',
  heroMuted: '#B4BED3',
  plate: '#E9EDF5',
  scrim: '#000000AA',
  selected: '#2A1A21',
  blush: '#3A1A22',
  blue: '#16263D',
  green: '#13301F',
  purple: '#251E3D',
  teal: '#0F2E2C',
  sand: '#1E2430',
  orange: '#3A2A12',
  onTeal: '#62D6CB',
  onGreen: '#6BD8A2',
  onOrange: '#F5BC5C',
};

const LIGHT_ACCENTS = {
  rose: { bg: '#FDE8EC', fg: '#D1103A' },
  blue: { bg: '#E4EEFD', fg: '#2563C9' },
  violet: { bg: '#EEE8FB', fg: '#6D45C9' },
  green: { bg: '#E1F4EA', fg: '#1A8452' },
  teal: { bg: '#DDF3F1', fg: '#0E7F78' },
  amber: { bg: '#FDEFD9', fg: '#B86A00' },
  slate: { bg: '#ECEFF5', fg: '#3B4863' },
};
const DARK_ACCENTS: typeof LIGHT_ACCENTS = {
  rose: { bg: '#3A1A22', fg: '#FF8DA1' },
  blue: { bg: '#16263D', fg: '#7FB0FF' },
  violet: { bg: '#251E3D', fg: '#B49BFF' },
  green: { bg: '#13301F', fg: '#5FD39A' },
  teal: { bg: '#0F2E2C', fg: '#4FD1C5' },
  amber: { bg: '#3A2A12', fg: '#F5B547' },
  slate: { bg: '#232B3A', fg: '#B4BED1' },
};

const LIGHT_SHADOW = { shadowColor: '#0F1B33', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 };
const DARK_SHADOW: typeof LIGHT_SHADOW = { shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 };

// ---- theme preference ---------------------------------------------------------------------------
export type Scheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';
const PREF_KEY = 'abbhelpme.theme';

function readPreference(): ThemePreference {
  try {
    const v = Platform.OS === 'web' ? globalThis.localStorage?.getItem(PREF_KEY) : SecureStore.getItem(PREF_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function savePreference(p: ThemePreference) {
  try {
    if (Platform.OS === 'web') {
      if (p === 'system') globalThis.localStorage?.removeItem(PREF_KEY); else globalThis.localStorage?.setItem(PREF_KEY, p);
    } else if (p === 'system') {
      void SecureStore.deleteItemAsync(PREF_KEY);
    } else {
      SecureStore.setItem(PREF_KEY, p);
    }
  } catch { /* not remembered; the choice still applies until the app closes */ }
}

export const resolveScheme = (p: ThemePreference): Scheme => (p === 'system' ? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light') : p);

let preference: ThemePreference = readPreference();
let current: Scheme = resolveScheme(preference);

export const colors: Palette = { ...(current === 'dark' ? DARK : LIGHT) };
export const accents = { ...(current === 'dark' ? DARK_ACCENTS : LIGHT_ACCENTS) };
export type Accent = keyof typeof accents;
export const shadow = { ...(current === 'dark' ? DARK_SHADOW : LIGHT_SHADOW) };

export const getPreference = () => preference;
export const getScheme = () => current;

/** Switches the palette in place. Screens must re-render (the root layout remounts them) to pick it up. */
export function applyPreference(p: ThemePreference): Scheme {
  preference = p;
  current = resolveScheme(p);
  Object.assign(colors, current === 'dark' ? DARK : LIGHT);
  Object.assign(accents, current === 'dark' ? DARK_ACCENTS : LIGHT_ACCENTS);
  Object.assign(shadow, current === 'dark' ? DARK_SHADOW : LIGHT_SHADOW);
  return current;
}

/**
 * A stylesheet that follows the theme: `const styles = themed(() => StyleSheet.create({...}))`.
 * It is built on first use and rebuilt after the theme changes; `styles.card` works as usual.
 */
export function themed<T extends object>(make: () => T): T {
  let built: { scheme: Scheme; value: T } | null = null;
  const get = () => {
    if (!built || built.scheme !== current) built = { scheme: current, value: make() };
    return built.value;
  };
  return new Proxy({} as T, {
    get: (_t, key) => (get() as Record<string | symbol, unknown>)[key],
    has: (_t, key) => key in get(),
    ownKeys: () => Reflect.ownKeys(get()),
    getOwnPropertyDescriptor: (_t, key) => Object.getOwnPropertyDescriptor(get(), key),
  });
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;
export const MIN_TOUCH = 48;
