import test from 'node:test';
import assert from 'node:assert/strict';
import { completeWelcome, defaultTheme, enabledThemes, readPreferences, resolveMode, themeKeys, themes } from '../src/themes/index.js';
import { tokensFor } from '../scripts/check-contrast.js';

test('十套主题含合法明暗与必填令牌，W1 启用六套', () => {
  assert.equal(new Set(themes.map(({ id }) => id)).size, 10);
  assert.equal(enabledThemes.length, 6);
  assert.equal(defaultTheme.id, 'beast');
  const required = ['bg', 'surface', 'fill', 'hairline', 'text', 'text-2', 'text-3', 'brand', 'accent', 'danger', 'warn',
    'on-brand', 'on-cat', 'c-idea', 'c-book', 'c-skill', 'c-exercise', 'c-news', 'c-fun-offline', 'c-fun-phone',
    'r-card', 'r-control', 'hairline-w', 'glow', 'card-border', 'card-shadow'];
  for (const theme of themes) {
    assert(theme.modes.length > 0 && theme.modes.length <= 2);
    assert.equal(new Set(theme.modes).size, theme.modes.length);
    for (const mode of theme.modes) {
      assert(['light', 'dark'].includes(mode));
      const tokens = tokensFor(theme.id, mode);
      for (const name of required) assert(tokens['--' + name], theme.id + '/' + mode + '/' + name);
    }
  }
});

test('单版本固定明暗，双版本覆盖三种偏好和两种系统明暗', () => {
  for (const theme of themes) for (const dark of [false, true]) {
    assert.equal(resolveMode(theme, 'system', dark), theme.modes.length === 1 ? theme.modes[0] : dark ? 'dark' : 'light');
    assert.equal(resolveMode(theme, 'light', dark), theme.modes.length === 1 ? theme.modes[0] : 'light');
    assert.equal(resolveMode(theme, 'dark', dark), theme.modes.length === 1 ? theme.modes[0] : 'dark');
  }
});

test('欢迎页完成后记住选择，兼容已有明暗偏好，忽略未启用主题', () => {
  const storage = new Map([['daytrace-theme', 'dark']]);
  const read = () => readPreferences({ getItem: (key) => storage.get(key) }, enabledThemes, themeKeys);
  assert.deepEqual(read(), { theme: defaultTheme, preference: 'dark', welcomeSeen: false });
  const saved = completeWelcome(read(), enabledThemes[1]);
  storage.set(themeKeys.theme, saved.theme.id);
  storage.set(themeKeys.welcome, String(saved.welcomeSeen));
  assert.deepEqual(read(), saved);
  storage.set(themeKeys.theme, 'forest');
  assert.equal(read().theme.id, 'beast');
});
