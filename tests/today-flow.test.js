import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayFlow, entryKey, initialToday, toastAfterUndo, todayFlow } from '../src/domain/todayFlow.js';

const date = '2026-11-11';
const change = (state, type, category, details) => todayFlow(state, { type, date, category, ...details });

test('U-02、U-03、U-05、U-06、U-07：板块保存流转并保留下一张及其他日期的草稿', () => {
  let state = initialToday;
  assert.equal(dayFlow(state, date).open, 'idea');
  state = change(state, 'draft', 'book', { patch: { content: '虚构读书草稿' } });
  state = change(state, 'draft', 'skill', { patch: { content: '虚构学习草稿' } });
  state = todayFlow(state, { type: 'draft', date: '2026-11-10', category: 'book', patch: { content: '另一日' } });
  state = change(state, 'toggle', 'book');
  state = change(state, 'saved', 'book', { again: true });
  assert.equal(dayFlow(state, date).open, 'book');
  assert.equal(state.drafts[entryKey(date, 'book')], undefined);
  state = change(state, 'saved', 'book');
  assert.equal(dayFlow(state, date).open, 'skill');
  assert.equal(state.drafts[entryKey(date, 'skill')].content, '虚构学习草稿');
  assert.equal(state.drafts[entryKey('2026-11-10', 'book')].content, '另一日');
  state = change(state, 'toggle', 'fun_phone');
  state = change(state, 'saved', 'fun_phone');
  assert.deepEqual(dayFlow(state, date), { open: null, finished: true });
});

test('保存请求返回时已展开其他板块，保留当前操作', () => {
  const state = change(change(initialToday, 'draft', 'idea', { patch: { content: '虚构' } }), 'toggle', 'news');
  const next = change(state, 'saved', 'idea');
  assert.equal(dayFlow(next, date).open, 'news');
  assert.equal(next.drafts[entryKey(date, 'idea')], undefined);
});

test('U-08：撤销反馈持续两秒，晚到的撤销不覆盖新反馈', () => {
  const original = { message: '已保存：读书', recordId: 'fixture-1', duration: 5000 };
  const latest = { message: '已保存：运动', recordId: 'fixture-2', duration: 5000 };
  assert.deepEqual(toastAfterUndo(original, original), { message: '已撤销', duration: 2000 });
  assert.equal(toastAfterUndo(latest, original), latest);
  assert.equal(toastAfterUndo(null, original), null);
});
