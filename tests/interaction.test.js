import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatMonthDay } from '../src/domain/dates.js';
import { effectiveMotion, greetingByHour, mascotState, pupilOffset, timeBand } from '../src/domain/interaction.js';
import { durationOptionLabel, durationOptions, formatDuration } from '../src/domain/records.js';

const at = (hour, minute = 0) => new Date(2026, 10, 14, hour, minute);

test('X-01、X-02：三种动效偏好和系统偏好的六种组合', () => {
  for (const reduced of [false, true]) {
    assert.equal(effectiveMotion('system', reduced), !reduced);
    assert.equal(effectiveMotion('on', reduced), true);
    assert.equal(effectiveMotion('off', reduced), false);
  }
});

test('X-03：问候语切换边界及跨午夜', () => {
  const expected = new Map([
    [5, '早上好，今天想记点什么？'], [11, '中午好，吃饭了吗？'],
    [14, '下午好，来记一笔吧'], [18, '晚上好，今天过得怎么样？'],
    [23, '夜深了，早点休息'],
  ]);
  for (const [hour, line] of expected) {
    assert.equal(greetingByHour(hour), line);
    assert.notEqual(greetingByHour(hour - 1), line);
  }
  assert.equal(greetingByHour(0), greetingByHour(23));
});

test('X-04：瞳孔偏移保留方向、近处线性且远处有上限', () => {
  assert.deepEqual(pupilOffset(0, 0), [0, 0]);
  assert.deepEqual(pupilOffset(30, 0), [1, 0]);
  assert.deepEqual(pupilOffset(0, -600), [0, -4.5]);
  assert.ok(Math.abs(Math.hypot(...pupilOffset(300, 600)) - 4.5) < 1e-9);
});

test('X-16：四种角色状态及午夜、05:00、22:00 和 120 分钟的优先级', () => {
  assert.equal(mascotState(at(0), 200, 3), 'sleep');
  assert.equal(mascotState(at(4, 59), 200, 3), 'sleep');
  assert.equal(mascotState(at(5), 0, 0), 'idle');
  assert.equal(mascotState(at(5), 0, 1), 'active');
  assert.equal(mascotState(at(21, 59), 119, 2), 'active');
  assert.equal(mascotState(at(21, 59), 120, 2), 'happy');
  assert.equal(mascotState(at(22), 120, 2), 'sleep');
});

test('X-22：光影时段纯函数在边界和跨午夜正确', () => {
  for (const [hour, minute, band] of [
    [0, 0, 'night'], [4, 59, 'night'], [5, 0, 'morning'], [8, 59, 'morning'],
    [9, 0, 'day'], [15, 59, 'day'], [16, 0, 'dusk'], [18, 59, 'dusk'], [19, 0, 'night'], [23, 59, 'night'],
  ]) assert.equal(timeBand(at(hour, minute)), band);
});

test('X-21：时长、时间选项和日期的数字与汉字之间没有空格', () => {
  const values = [...durationOptions.flatMap((minutes) => [formatDuration(minutes), durationOptionLabel(minutes)]),
    formatDuration(440), formatDuration(-80), formatMonthDay('2026-11-14')];
  values.forEach((value) => assert.doesNotMatch(value, /\d\s+\p{Script=Han}|\p{Script=Han}\s+\d/u));
  assert.equal(formatDuration(440), '7小时20分钟');
  assert.equal(formatMonthDay('2026-11-14'), '11月14日');
});
