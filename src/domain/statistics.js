import { addDays } from './dates.js';
import { categoryIds } from './records.js';

const emptyTotals = () => Object.fromEntries(categoryIds.map((category) => [category, 0]));

export function minutesTotal(records) {
  return records.reduce((sum, row) => sum + row.minutes, 0);
}

export function summarize(records, { start, end }) {
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
    if (!byDate.has(date)) byDate.set(date, emptyTotals());
    byDate.get(date)[category] += minutes;
    if (category === 'skill') {
      for (const tag of new Set(tags)) byTag.set(tag, (byTag.get(tag) ?? 0) + minutes);
    }
  }

  const days = [];
  if (firstDate && lastDate) {
    for (let date = firstDate; date <= lastDate; date = addDays(date, 1)) {
      days.push({ date, minutes: byDate.get(date) ?? null });
    }
  }
  const tags = [...byTag].map(([name, minutes]) => ({ name, minutes }))
    .sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name, 'zh-CN'));
  return { total, days, recordedDays: byDate.size, tags };
}
