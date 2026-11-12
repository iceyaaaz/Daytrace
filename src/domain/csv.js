import { localDate } from './dates.js';
import { categories } from './records.js';

const headers = ['日期', '板块', '标签', '内容', '收获/感触/可改变的点', '时间（分钟）', '创建时间'];

function csvCell(value) {
  if (typeof value === 'number') return String(value);
  let cell = String(value ?? '');
  // 防止 Excel 把用户输入的内容或标签当成公式运行。
  if (/^[\s\uFEFF]*[=+\-@＝＋－＠]|^[\t\r\n]/u.test(cell)) cell = `'${cell}`;
  return `"${cell.replaceAll('"', '""')}"`;
}

export function recordsCsv(records) {
  const rows = records.map((row) => [
    row.record_date, categories[row.category].label, row.tags.join(';'),
    row.content, row.gain, row.minutes, row.created_at,
  ]);
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export function csvFilename(date = new Date()) {
  return `growth-diary-${localDate(date).replaceAll('-', '')}.csv`;
}
