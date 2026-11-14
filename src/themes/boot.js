import { effectiveMotion, motionKey } from '../domain/interaction.js';
import { defaultTheme, enabledThemes, readPreferences, resolveMode, themeKeys } from './index.js';

export function themeBoot(palettes) {
  const backgrounds = Object.fromEntries([...palettes.matchAll(
    /\[data-theme="([^"]+)"\]\[data-mode="([^"]+)"\]\s*\{\s*--bg:\s*([^;]+);/g,
  )].map(([, theme, mode, color]) => [`${theme}:${mode}`, color]));

  const script = `(() => {
    const read = ${readPreferences.toString()};
    const resolve = ${resolveMode.toString()};
    let storage;
    try { storage = localStorage; } catch {}
    const { theme, preference } = read(storage, ${JSON.stringify(enabledThemes)}, ${JSON.stringify(themeKeys)});
    const mode = resolve(theme, preference, matchMedia('(prefers-color-scheme: dark)').matches);
    const motion = ${effectiveMotion.toString()};
    let preferenceMotion;
    try { preferenceMotion = storage?.getItem(${JSON.stringify(motionKey)}); } catch {}
    document.documentElement.dataset.motion = motion(preferenceMotion, matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'on' : 'off';
    document.documentElement.dataset.theme = theme.id;
    document.documentElement.dataset.mode = mode;
    document.querySelector('meta[name="theme-color"]').content = ${JSON.stringify(backgrounds)}[theme.id + ':' + mode];
  })();`;
  return { script, themeColor: backgrounds[`${defaultTheme.id}:light`] };
}
