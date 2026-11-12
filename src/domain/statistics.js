import { addDays } from './dates.js';
import { categoryIds } from './records.js';

const emptyTotals = () => Object.fromEntries(categoryIds.map((category) => [category, 0]));

export function minutesTotal(records) {
  return records.reduce((sum, row) => sum + row.minutes, 0);
}

export function summarize(records, { start, end }) {
  const totals = emptyTotals();
  const byDate = new Map();
  const byTag = new Map();
  let firstDate = start;
  let lastDate = end;
  let total = 0;

  for (const { record_date: date, category, minutes, tags } of records) {
    if ((start && date < start) || (end && date > end)) continue;
    if (!firstDate || date < firstDate) firstDate = date;
    if (!lastDate || date > lastDate) lastDate = date;
    total += minutes;
    totals[category] += minutes;
    if (!byDate.has(date)) byDate.set(date, emptyTotals());
    byDate.get(date)[category] += minutes;
    if (category === 'skill') {
      for (const tag of new Set(tags)) byTag.set(tag, (byTag.get(tag) ?? 0) + minutes);
    }
  }

  const breakdown = categoryIds.map((category) => ({ category, minutes: totals[category], tenths: 0 }));
  if (total > 0) {
    // 用最大余数法分配 0.1 个百分点，显示值相加正好为 100.0%。
    const remainders = breakdown.map((item) => {
      item.tenths = Math.floor(item.minutes * 1000 / total);
      return { item, remainder: item.minutes * 1000 % total };
    }).sort((a, b) => b.remainder - a.remainder);
    const missing = 1000 - breakdown.reduce((sum, item) => sum + item.tenths, 0);
    for (const { item } of remainders.slice(0, missing)) item.tenths += 1;
  }

  const days = [];
  if (firstDate && lastDate) {
    for (let date = firstDate; date <= lastDate; date = addDays(date, 1)) {
      days.push({ date, minutes: byDate.get(date) ?? null });
    }
  }
  const tags = [...byTag].map(([name, minutes]) => ({ name, minutes }))
    .sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name, 'zh-CN'));
  return { total, breakdown, days, recordedDays: byDate.size, tags };
}

export function withWeekComparison(current, previous) {
  return current.breakdown.map((item, index) => ({
    ...item,
    delta: item.minutes - previous.breakdown[index].minutes,
  }));
}
