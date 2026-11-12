import assert from 'node:assert/strict';
import { test } from 'node:test';
import { entryPanel, hasEntryChanges } from '../src/domain/entryPanel.js';
import { durationOptionLabel, formatDuration } from '../src/domain/records.js';

test('V-05、V-14、V-15：面板区分空白、未保存内容与保存后再记', () => {
  let state = entryPanel(null, { type: 'open', category: 'idea', id: 'first' });
  assert.equal(hasEntryChanges(state.draft), false);
  state = entryPanel(state, { type: 'patch', patch: { content: '虚构灵感' }, id: 'first' });
  assert.equal(hasEntryChanges(state.draft), true);
  state = entryPanel(state, { type: 'confirm', value: true });
  state = entryPanel(state, { type: 'confirm', value: false });
  assert.equal(state.draft.content, '虚构灵感');
  state = entryPanel(state, { type: 'again' });
  assert.equal(state.draft.category, 'idea');
  assert.equal(hasEntryChanges(state.draft), false);
  assert.equal(entryPanel(state, { type: 'close' }), null);
});

test('旧面板的异步结果不会修改新面板', () => {
  const state = entryPanel(null, { type: 'open', category: 'book', id: 'new' });
  assert.equal(entryPanel(state, { type: 'patch', patch: { tags: ['旧标签'] }, id: 'old' }), state);
  assert.equal(entryPanel(null, { type: 'patch', patch: { tags: ['旧标签'] }, id: 'old' }), null);
});

test('V-08、V-20：新界面采用紧凑的中文时长格式', () => {
  assert.equal(formatDuration(80, { compact: true }), '1小时20分钟');
  assert.equal(formatDuration(0, { compact: true }), '0分钟');
  assert.equal(durationOptionLabel(90, true), '1.5小时');
});
