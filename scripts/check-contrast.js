import { readFileSync } from 'node:fs';
import { themes } from '../src/themes/index.js';

export const paletteCss = readFileSync(new URL('../src/themes/palettes.css', import.meta.url), 'utf8');
const rules = [...paletteCss.matchAll(/((?:\[data-(?:theme|mode)="[^"]+"\])+)[\s]*\{([^}]+)\}/g)];
const declarations = (body) => Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)]
  .map(([, name, value]) => [name, value.trim()]));
const modeTokens = (selector) => declarations(rules.find((rule) => rule[1] === selector)?.[2] ?? '');

export const tokensFor = (id, mode) => ({
  ...modeTokens(`[data-mode="${mode}"]`),
  ...modeTokens(`[data-theme="${id}"][data-mode="${mode}"]`),
});

const pairs = [
  ...['--text', '--text-2', '--text-3'].flatMap((ink) => ['--bg', '--surface'].map((bg) => [ink, bg])),
  ['--on-brand', '--brand'], ['--accent', '--bg'], ['--danger', '--surface'], ['--warn', '--surface'],
];

function luminance(hex) {
  if (!/^#[a-f\d]{6}$/i.test(hex)) throw new Error(`无法读取颜色令牌 ${hex}`);
  const channels = hex.slice(1).match(/../g).map((pair) => parseInt(pair, 16) / 255);
  return channels.reduce((total, value, index) => total + [0.2126, 0.7152, 0.0722][index] *
    (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4), 0);
}

export function contrast(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

if (process.argv[1] && new URL(import.meta.url).pathname.endsWith('/' + process.argv[1].split(/[\\/]/).at(-1))) {
  for (const theme of themes) for (const mode of theme.modes) {
    const tokens = tokensFor(theme.id, mode);
    const ratios = pairs.map(([foreground, background]) => ({ foreground, background,
      value: contrast(tokens[foreground], tokens[background]) }));
    const worst = ratios.reduce((lowest, pair) => pair.value < lowest.value ? pair : lowest);
    const pass = worst.value >= 4.5;
    console.log(`${pass ? '通过' : '未通过'} ${theme.id}/${mode}，最低 ${worst.value.toFixed(2)}:1（${worst.foreground} / ${worst.background}）`);
    if (!pass) process.exitCode = 1;
  }
}
