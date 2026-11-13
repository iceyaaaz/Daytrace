import { useEffect, useLayoutEffect, useState } from 'react';
import { completeWelcome, enabledThemes, readPreferences, resolveMode, themeKeys } from './index.js';

export function useAppearance() {
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const [settings, setSettings] = useState(() => {
    try { return readPreferences(localStorage, enabledThemes, themeKeys); }
    catch { return readPreferences(undefined, enabledThemes, themeKeys); }
  });
  const [preview, setPreview] = useState(null);
  const theme = preview ?? settings.theme;
  const mode = resolveMode(theme, preview ? 'system' : settings.preference, systemDark);

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    root.dataset.mode = mode;
    const color = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (color) document.querySelector('meta[name="theme-color"]').content = color;
  }, [theme.id, mode]);

  useEffect(() => {
    try {
      localStorage.setItem(themeKeys.theme, settings.theme.id);
      localStorage.setItem(themeKeys.mode, settings.preference);
      if (settings.welcomeSeen) localStorage.setItem(themeKeys.welcome, 'true');
    } catch { /* 保留本次会话的选择。 */ }
  }, [settings]);

  return {
    ...settings, systemDark, mode,
    setTheme: (next) => setSettings((current) => ({ ...current, theme: next })),
    setPreference: (preference) => setSettings((current) => ({ ...current, preference })),
    setPreview,
    finishWelcome: (next) => {
      setPreview(null);
      setSettings((current) => completeWelcome(current, next));
    },
  };
}
