import assert from 'node:assert/strict';
import test from 'node:test';
import { addDays } from '../src/domain/dates.js';
import { groupMonths, matchParts } from '../src/domain/history.js';
import { dailyAverage, percentage, reviewBuckets, reviewCategories, reviewRange, weekComparison } from '../src/domain/review.js';
import { summarize } from '../src/domain/statistics.js';

const row = (record_date, category, minutes, tags = []) => ({ record_date, category, minutes, tags });

test('周一跨年和闰年月份按自然日分桶，空日期保留位置', () => {
  const week = reviewRange('week', '2027-01-01');
  assert.deepEqual(week, { start: '2026-12-28', end: '2027-01-03' });
  const days = reviewBuckets([row('2026-12-31', 'book', 30)], 'week', '2027-01-01', week);
  assert.equal(days.length, 7);
  assert.deepEqual(days[3], { date: '2026-12-31', total: 30, parts: { book: 30 } });
  assert.equal(days[4].total, 0);
  const month = reviewRange('month', '2024-03-01', -1);
  assert.deepEqual(month, { start: '2024-02-01', end: '2024-02-29' });
  assert.equal(reviewBuckets([], 'month', '2024-03-01', month).length, 29);
});

test('全部视图默认最近十二个月，并保留更早记录和中间空月份', () => {
  const today = '2027-01-02';
  const recent = reviewBuckets([], 'all', today, {});
  assert.equal(recent.length, 12);
  assert.equal(recent[0].date, '2026-02-01');
  const all = reviewBuckets([row('2025-12-31', 'idea', 5), row('2027-01-01', 'skill', 15)], 'all', today, {});
  assert.equal(all.length, 14);
  assert.deepEqual(all[0], { date: '2025-12-01', total: 5, parts: { idea: 5 } });
  assert.equal(all[1].total, 0);
  assert.equal(all.at(-1).total, 15);
});

test('24 条记录手算：本周 240 分钟，4 天，日均 60，比上周多 120，学习占 75%', () => {
  const today = '2026-11-12';
  const records = Array.from({ length: 24 }, (_, index) => index < 12
    ? row(addDays(today, -(index % 4)), index < 6 ? 'skill' : 'book', index < 6 ? 30 : 10, ['甲', '乙'])
    : row('2026-11-08', 'book', 10));
  const current = summarize(records, reviewRange('week', today));
  const previous = summarize(records, reviewRange('week', today, -1));
  assert.equal(current.total, 240);
  assert.equal(current.recordedDays, 4);
  assert.equal(dailyAverage(current.total, current.recordedDays), 60);
  assert.equal(weekComparison(current.total, previous.total, previous.recordedDays), '比上周多2小时');
  assert.equal(percentage(180, 240), '75%');
  assert.deepEqual(current.tags.map(({ minutes }) => minutes), [180, 180]);
  assert.deepEqual(reviewCategories(records.slice(0, 12)), [{ category: 'skill', minutes: 180 }, { category: 'book', minutes: 60 }]);
});

test('无记录、有零分钟的记录、非整除日均、持平和不足 1%', () => {
  assert.equal(dailyAverage(0, 0), null);
  assert.equal(dailyAverage(5, 2), 3);
  assert.equal(weekComparison(5, 0, 0), '上周没有记录');
  assert.equal(weekComparison(5, 0, 1), '比上周多5分钟');
  assert.equal(weekComparison(5, 10, 1), '比上周少5分钟');
  assert.equal(weekComparison(0, 0, 1), '与上周持平');
  assert.equal(percentage(0, 0), '0%');
  assert.equal(percentage(5, 1000), '<1%');
  assert.equal(percentage(1, 3), '33%');
});

test('历史日期倒序分组，文本高亮按字面匹配搜索字符', () => {
  const records = [row('2026-01-02', 'idea', 0), row('2026-02-01', 'book', 30), row('2026-01-31', 'book', 15)];
  const months = [...groupMonths(records)];
  assert.deepEqual(months.map(([month]) => month), ['2026-02', '2026-01']);
  assert.equal(months[1][1][0].date, '2026-01-31');
  assert.deepEqual(matchParts('进度 70% 与 90%', '%'), ['进度 70', '%', ' 与 90', '%', '']);
  assert.deepEqual(matchParts('aXb a_b', '_'), ['aXb a', '_', 'b']);
  assert.deepEqual(matchParts('a(b) C[?]', '[?]'), ['a(b) C', '[?]', '']);
});
