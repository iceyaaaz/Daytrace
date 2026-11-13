export const themes = [
  { id: 'beast', name: '兽 · 动物', mood: '软乎乎的小窝', kind: 'style', modes: ['light', 'dark'], enabled: true },
  { id: 'forest', name: '森 · 植物', mood: '叶子的影子，安静的一天', kind: 'style', modes: ['light', 'dark'] },
  { id: 'neon', name: '霓 · 赛博', mood: '夜里亮着的网格', kind: 'style', modes: ['dark'] },
  { id: 'candy', name: '星糖 · 二次元氛围', mood: '糖果色的小宇宙', kind: 'style', modes: ['light', 'dark'] },
  { id: 'blocks', name: '色块 · 抽象艺术', mood: '大胆一点的拼贴画', kind: 'style', modes: ['light'] },
  { id: 'paper', name: '纸页', mood: '安静的白纸', kind: 'solid', modes: ['light', 'dark'], enabled: true },
  { id: 'mist', name: '雾蓝', mood: '冷静清爽', kind: 'solid', modes: ['light', 'dark'], enabled: true },
  { id: 'oat', name: '奶咖', mood: '燕麦拿铁的温柔', kind: 'solid', modes: ['light'], enabled: true },
  { id: 'blush', name: '樱雾', mood: '淡淡的粉色', kind: 'solid', modes: ['light'], enabled: true },
  { id: 'ink', name: '墨夜', mood: '深夜里的专注', kind: 'solid', modes: ['dark'], enabled: true },
];

export const enabledThemes = themes.filter((theme) => theme.enabled);
export const defaultTheme = enabledThemes[0];
export const themeKeys = { theme: 'riji.theme', mode: 'riji.modePref', welcome: 'riji.welcomeSeen' };
export const modeLabels = { system: '跟随系统', light: '浅色', dark: '深色' };

export function resolveMode(theme, preference, systemDark) {
  if (theme.modes.length === 1) return theme.modes[0];
  return preference === 'light' || preference === 'dark' ? preference : systemDark ? 'dark' : 'light';
}

export function readPreferences(storage, available, keys) {
  const fallback = { theme: available[0], preference: 'system', welcomeSeen: false };
  try {
    const savedTheme = storage.getItem(keys.theme);
    const savedMode = storage.getItem(keys.mode) ?? storage.getItem('daytrace-theme');
    return {
      theme: available.find(({ id }) => id === savedTheme) ?? fallback.theme,
      preference: ['light', 'dark'].includes(savedMode) ? savedMode : 'system',
      welcomeSeen: storage.getItem(keys.welcome) === 'true',
    };
  } catch {
    return fallback;
  }
}

export function completeWelcome(settings, theme) {
  return { ...settings, theme, welcomeSeen: true };
}
