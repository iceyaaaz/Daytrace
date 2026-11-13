export function groupMonths(records) {
  const days = new Map();
  for (const record of records) {
    const date = record.record_date;
    if (!days.has(date)) days.set(date, []);
    days.get(date).push(record);
  }
  const months = new Map();
  for (const date of [...days.keys()].sort().reverse()) {
    const month = date.slice(0, 7);
    if (!months.has(month)) months.set(month, []);
    months.get(month).push({ date, records: days.get(date) });
  }
  return months;
}

export function matchParts(value, keyword) {
  if (!keyword) return [value];
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value.split(new RegExp(`(${escaped})`, 'giu'));
}
