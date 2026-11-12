import assert from 'node:assert/strict';
import { test } from 'node:test';
import { csvFilename, recordsCsv } from '../src/domain/csv.js';

test('CSV 使用 BOM、中文表头、分号标签并保留引号和换行', () => {
  const csv = recordsCsv([{
    record_date: '2026-11-10', category: 'book', tags: ['读书', '摘录'],
    content: '他说 "读一页",\n再做一条笔记', gain: null, minutes: 25,
    created_at: '2026-11-10T03:00:00Z',
  }]);
  assert.deepEqual([...Buffer.from(csv).subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.equal(csv, '\uFEFF"日期","板块","标签","内容","收获/感触/可改变的点","时间（分钟）","创建时间"\r\n' +
    '"2026-11-10","读书","读书;摘录","他说 ""读一页"",\n再做一条笔记","",25,"2026-11-10T03:00:00Z"\r\n');
  assert.equal(csvFilename(new Date(2026, 10, 10, 0, 25)), 'growth-diary-20261110.csv');
});

test('空备份保留表头，公式样式的内容按文本导出', () => {
  assert.equal(recordsCsv([]).split('\r\n').length, 2);
  const csv = recordsCsv([{ record_date: '2026-11-10', category: 'skill', tags: ['@标签'],
    content: '  =1+2', gain: '-测试', minutes: 5 }]);
  assert.ok(csv.includes(`"'@标签","'  =1+2","'-测试",5`));
});
