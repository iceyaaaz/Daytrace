import { categories } from './categories.js';
export { categories, categoryIds, tagCategories } from './categories.js';
export const durationOptions = [
  ...Array.from({ length: 12 }, (_, i) => i * 5),
  ...Array.from({ length: 23 }, (_, i) => 60 + i * 30),
];

export function formatDuration(minutes, { option = false, compact = false } = {}) {
  const sign = minutes < 0 ? '−' : '';
  const value = Math.abs(minutes);
  const gap = compact ? '' : ' ';
  if (value < 60) return `${sign}${value}${gap}分钟`;
  if (option) return `${sign}${value / 60}${gap}小时`;
  const remaining = value % 60;
  return `${sign}${Math.floor(value / 60)}${gap}小时${remaining ? `${gap}${remaining}${gap}分钟` : ''}`;
}

export const durationText = (minutes) => formatDuration(minutes);
export const durationOptionLabel = (minutes, compact = false) => formatDuration(minutes, { option: true, compact });

export function durationDelta(minutes) {
  if (!minutes) return '—';
  return `${minutes > 0 ? '▲' : '▼'} ${formatDuration(Math.abs(minutes))}`;
}

export function emptyRecord(category) {
  return { category, minutes: category === 'idea' ? 0 : '', tags: [], content: '', gain: '' };
}

export function recordErrors(draft) {
  const errors = {};
  if (categories[draft.category].required && !draft.content?.trim()) {
    errors.content = draft.category === 'idea' ? '请填写灵感内容' : '请填写内容';
  }
  const minutes = Number(draft.minutes);
  if (!durationOptions.includes(minutes) || (draft.category !== 'idea' && minutes <= 0)) errors.minutes = '请选择时长';
  if (draft.category === 'skill' && !draft.tags.length) errors.tags = '请至少选择一个技能标签';
  return errors;
}

export function recordValues(draft) {
  const error = Object.values(recordErrors(draft))[0];
  if (error) throw new Error(error);
  const category = categories[draft.category];
  const content = draft.content?.trim() ?? '';
  const gain = draft.gain?.trim() ?? '';
  const tags = category.tags ? [...new Set(draft.tags)] : [];
  const minutes = Number(draft.minutes);
  return { category: draft.category, minutes, tags, content: content || null, gain: category.gain ? gain || null : null };
}

export function tagName(value) {
  const name = value.trim();
  if ([...name].length < 1 || [...name].length > 20) throw new Error('标签名称须为1–20个字');
  return name;
}
