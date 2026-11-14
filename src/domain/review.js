import { addDays, weekRange } from './dates.js';
import { categoryIds } from './records.js';
import { formatDuration } from './records.js';

export function shiftMonth(date, offset) {
  const [year, month] = date.split('-').map(Number);
  const index = year * 12 + month - 1 + offset;
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String(index % 12 + 1).padStart(2, '0')}-01`;
}

export function reviewRange(view, today, offset = 0) {
  if (view === 'week') return weekRange(addDays(today, offset * 7));
  if (view === 'month') {
    const start = shiftMonth(today, offset);
    return { start, end: addDays(shiftMonth(start, 1), -1) };
  }
  return {};
}

export function reviewBuckets(records, view, today, range) {
  const monthly = view === 'all';
  const dates = [];
  if (monthly) {
    const latest = shiftMonth(today, 0);
    const start = records.reduce((first, row) => {
      const month = shiftMonth(row.record_date, 0);
      return month < first ? month : first;
    }, shiftMonth(latest, -11));
    for (let month = start; month <= latest; month = shiftMonth(month, 1)) dates.push(month);
  } else {
    for (let date = range.start; date <= range.end; date = addDays(date, 1)) dates.push(date);
  }
  const buckets = new Map(dates.map((date) => [date, { date, total: 0, parts: {} }]));
  for (const row of records) {
    const bucket = buckets.get(monthly ? shiftMonth(row.record_date, 0) : row.record_date);
    if (!bucket) continue;
    bucket.parts[row.category] = (bucket.parts[row.category] ?? 0) + row.minutes;
    bucket.total += row.minutes;
  }
  return [...buckets.values()];
}

export const dailyAverage = (total, days) => days ? Math.round(total / days) : null;

export function percentage(minutes, total) {
  if (!total || !minutes) return '0%';
  const share = minutes * 100 / total;
  return share < 1 ? '<1%' : `${Math.round(share)}%`;
}

export function weekComparison(total, previous, previousDays) {
  if (!previousDays) return '上周没有记录';
  const delta = total - previous;
  if (!delta) return '与上周持平';
  return `比上周${delta > 0 ? '多' : '少'}${formatDuration(Math.abs(delta))}`;
}

export function reviewCategories(records) {
  const byCategory = new Map();
  for (const { category, minutes } of records) {
    byCategory.set(category, (byCategory.get(category) ?? 0) + minutes);
  }
  return categoryIds.filter((category) => byCategory.has(category))
    .map((category) => ({ category, minutes: byCategory.get(category) }))
    .sort((a, b) => b.minutes - a.minutes);
}

export function chartMaximum(total) {
  const step = total < 60 ? 5 : 60;
  return Math.max(step, Math.ceil(total / step) * step);
}
