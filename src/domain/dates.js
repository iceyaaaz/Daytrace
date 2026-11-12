export function localDate(date = new Date()) {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 按自然日加减，避免夏令时和 UTC 转换导致日期偏移。
export function addDays(date, offset) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + offset);
  return localDate(value);
}

export function weekday(date) {
  return new Date(`${date}T12:00:00`).getDay();
}

export function isRecordDate(date, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '0001-01-01' || date > today) return false;
  return addDays(date, 0) === date;
}

export function weekRange(date) {
  const start = addDays(date, -((weekday(date) + 6) % 7));
  return { start, end: addDays(start, 6) };
}

export function statsRange(period, today) {
  const starts = { '7': addDays(today, -6), '30': addDays(today, -29), month: `${today.slice(0, 7)}-01` };
  return { start: starts[period], end: today };
}

export function quoteForDate(quotes, date) {
  // 先确定本地日期，再以 UTC 的日历标尺计算天数差。
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.UTC(2020, 0, 1)) / 86_400_000);
  const index = ((days % quotes.length) + quotes.length) % quotes.length;
  return quotes[index];
}
