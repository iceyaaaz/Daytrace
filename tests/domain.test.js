import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, isRecordDate, localDate, quoteForDate, weekRange } from '../src/domain/dates.js';
import { categoryIds, durationOptionLabel, durationOptions, emptyRecord, formatDuration, recordValues, tagName } from '../src/domain/records.js';
import { minutesTotal, summarize } from '../src/domain/statistics.js';

const entry = (record_date, category, minutes, tags = []) => ({ record_date, category, minutes, tags });

test('T-10：同一天引语固定，相邻日期换句，支持 2020 年之前的日期', () => {
  const quotes = ['甲', '乙', '丙'];
  assert.equal(quoteForDate(quotes, '2020-01-01'), '甲');
  assert.equal(quoteForDate(quotes, '2020-01-01'), '甲');
  assert.equal(quoteForDate(quotes, '2020-01-02'), '乙');
  assert.equal(quoteForDate(quotes, '2019-12-31'), '丙');
});

test('T-11、T-17：按本地日历取日期，闰年有效，未来日期拒绝', () => {
  assert.equal(localDate(new Date(2026, 10, 10, 0, 25)), '2026-11-10');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(isRecordDate('2026-11-11', '2026-11-10'), false);
  assert.equal(isRecordDate('2026-02-29', '2026-11-10'), false);
  assert.equal(isRecordDate('2024-02-29', '2026-11-10'), true);
});

test('T-12：完整 35 档与时长文字', () => {
  assert.equal(durationOptions.length, 35);
  assert.equal(new Set(durationOptions).size, 35);
  assert.deepEqual(durationOptions.slice(0, 12), [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  assert.ok(durationOptions.slice(12).every((value, index) => value === 60 + index * 30));
  assert.equal(durationOptions.at(-1), 720);
  assert.equal(durationOptionLabel(55), '55分钟');
  assert.equal(durationOptionLabel(90), '1.5小时');
  assert.deepEqual([0, 5, 55, 60, 80, 90, 720].map((minutes) => formatDuration(minutes)), [
    '0分钟', '5分钟', '55分钟', '1小时', '1小时20分钟', '1小时30分钟', '12小时',
  ]);
});

test('T-13、T-18：各板块校验必填项和允许留空的字段', () => {
  const withoutContent = new Set(['skill', 'exercise']);
  for (const category of categoryIds) {
    assert.throws(() => recordValues(emptyRecord(category)));
    const draft = { ...emptyRecord(category), content: withoutContent.has(category) ? '' : '测试', minutes: category === 'idea' ? 0 : 30 };
    if (category === 'skill') {
      assert.throws(() => recordValues(draft), /技能标签/);
      draft.tags = ['甲', '乙', '甲'];
    }
    assert.equal(recordValues(draft).minutes, draft.minutes);
    assert.equal(recordValues(draft).gain, null);
    if (category !== 'idea') assert.throws(() => recordValues({ ...draft, minutes: 0 }));
  }
  assert.throws(() => recordValues({ ...emptyRecord('idea'), content: '想法', minutes: 65 }));
});

test('T-16、T-22：合计可超过 24 小时，标签去掉两端空白并限制 20 个字', () => {
  assert.equal(minutesTotal([{ minutes: 720 }, { minutes: 720 }, { minutes: 5 }]), 1445);
  assert.equal(tagName('  读书  '), '读书');
  assert.equal(tagName('📝'.repeat(20)).length, 40);
  assert.throws(() => tagName('读'.repeat(21)));
  assert.throws(() => tagName('  '));
});

test('T-33、T-34：缺失日为空，标签各计入完整时长', () => {
  const result = summarize([
    entry('2026-11-08', 'book', 30), entry('2026-11-08', 'idea', 30),
    entry('2026-11-10', 'skill', 30, ['Python', '数据分析']), entry('2026-11-10', 'idea', 0),
  ], { start: '2026-11-08', end: '2026-11-10' });
  assert.equal(result.total, 90);
  assert.equal(result.days[0].minutes.book, 30);
  assert.deepEqual(result.days[1], { date: '2026-11-09', minutes: null });
  assert.deepEqual(result.tags.map((tag) => tag.minutes), [30, 30]);
  assert.equal(result.recordedDays, 2);
  assert.equal(summarize([entry('2026-11-10', 'idea', 0)], {}).total, 0);
});

test('T-35：周日属于上一周的周一范围', () => {
  assert.deepEqual(weekRange('2026-11-08'), { start: '2026-11-02', end: '2026-11-08' });
  assert.deepEqual(weekRange('2026-11-09'), { start: '2026-11-09', end: '2026-11-15' });
  const entries = [entry('2026-11-08', 'book', 60), entry('2026-11-09', 'book', 30), entry('2026-11-15', 'idea', 0)];
  const current = summarize(entries, weekRange('2026-11-09'));
  assert.equal(current.recordedDays, 2);
  assert.equal(current.days.length, 7);
});
