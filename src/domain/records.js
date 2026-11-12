export const categories = {
  idea: { label: '点子灵感', content: '灵感内容', required: true, color: '#8a65b5' },
  book: { label: '读书', tags: '书名', content: '学到的智慧', gain: '我能改变的点', required: true, color: '#28756a' },
  skill: { label: '学习技能', tags: '技能标签', content: '学习内容', color: '#456ab1' },
  exercise: { label: '运动', tags: '运动类型', content: '备注', color: '#8a6d2e' },
  news: { label: '新闻', content: '看了什么新闻', gain: '感触', required: true, color: '#ba6259' },
  fun_offline: { label: '线下娱乐', content: '娱乐内容', gain: '收获', required: true, color: '#69803b' },
  fun_phone: { label: '手机娱乐', content: '娱乐内容', gain: '收获', required: true, color: '#91647d' },
};

export const categoryIds = Object.keys(categories);
export const tagCategories = categoryIds.filter((id) => categories[id].tags);
export const durationOptions = [
  ...Array.from({ length: 12 }, (_, i) => i * 5),
  ...Array.from({ length: 23 }, (_, i) => 60 + i * 30),
];

export function durationOptionLabel(minutes) {
  return minutes < 60 ? `${minutes}min` : `${minutes / 60}h`;
}

export function durationText(minutes) {
  const sign = minutes < 0 ? '−' : '';
  const value = Math.abs(minutes);
  if (value < 60) return `${sign}${value}分钟`;
  const remaining = value % 60;
  return `${sign}${Math.floor(value / 60)}小时${remaining ? `${remaining}分钟` : ''}`;
}

export function durationDelta(minutes) {
  const value = Math.abs(minutes);
  const sign = minutes > 0 ? '+' : minutes < 0 ? '-' : '';
  if (value < 60 || value % 30 === 0) return `${sign}${durationOptionLabel(value)}`;
  return `${sign}${Math.floor(value / 60)}h ${value % 60}min`;
}

export function emptyRecord(category) {
  return { category, minutes: category === 'idea' ? 0 : '', tags: [], content: '', gain: '' };
}

export function recordValues(draft) {
  const category = categories[draft.category];
  const content = draft.content?.trim() ?? '';
  const gain = draft.gain?.trim() ?? '';
  const tags = category.tags ? [...new Set(draft.tags)] : [];
  const minutes = Number(draft.minutes);
  if (category.required && !content) throw new Error(`请填写${category.content}`);
  if (!durationOptions.includes(minutes) || (draft.category !== 'idea' && minutes <= 0)) {
    throw new Error('请选择大于 0 分钟的时间');
  }
  if (draft.category === 'skill' && tags.length === 0) throw new Error('请至少选择 1 个技能标签');
  return { category: draft.category, minutes, tags, content: content || null, gain: category.gain ? gain || null : null };
}

export function tagName(value) {
  const name = value.trim();
  if ([...name].length < 1 || [...name].length > 20) throw new Error('标签名称须为 1–20 个字');
  return name;
}
