import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import { applyPreference, getPreference, getScheme, savePreference, type Scheme, type ThemePreference } from '@/constants/brand';

interface ThemeState {
  /** What the person chose: light, dark, or follow the phone. */
  preference: ThemePreference;
  /** What is showing now. */
  scheme: Scheme;
  setPreference(p: ThemePreference): void;
}

const Ctx = createContext<ThemeState | null>(null);

export function useTheme(): ThemeState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used inside ThemeProvider');
  return v;
}

/**
 * Light / dark / match-device. Changing the theme swaps the palette and remounts the screens (the root layout keys
 * its navigator on `scheme`). The navigation state is kept, so the person stays on the same screen with the same Back history.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<ThemePreference>(getPreference);
  const [scheme, setScheme] = useState<Scheme>(getScheme);

  const switchTo = useCallback((p: ThemePreference) => {
    const before = getScheme();
    const after = applyPreference(p);
    setPref(p);
    if (after !== before) setScheme(after);
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    savePreference(p);
    switchTo(p);
  }, [switchTo]);

  // Follow the phone's setting while "Match device" is chosen.
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => { if (getPreference() === 'system') switchTo('system'); });
    return () => sub.remove();
  }, [switchTo]);

  const value = useMemo(() => ({ preference, scheme, setPreference }), [preference, scheme, setPreference]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
