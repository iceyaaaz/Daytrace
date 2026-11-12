import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRepository } from '../src/data/repository.js';
import { summarize } from '../src/domain/statistics.js';

function localClient(rows, cap) {
  const calls = [];
  return { calls, from(table) {
    assert.equal(table, 'records');
    const call = {};
    calls.push(call);
    return {
      select() { return this; }, order() { return this; }, limit(value) { call.limit = value; return this; },
      gte(_, date) { call.start = date; return this; }, lte(_, date) { call.end = date; return this; },
      or(filter) { [, call.date, call.id] = /eq\.([^,]+),id\.gt\.([^)]+)/.exec(filter); return this; },
      then(resolve) {
        const data = rows.filter(({ record_date: date, id }) =>
          (!call.start || date >= call.start) && (!call.end || date <= call.end) &&
          (!call.date || date > call.date || (date === call.date && id > call.id)));
        return Promise.resolve(resolve({ data: data.slice(0, Math.min(cap, call.limit)) }));
      },
    };
  } };
}

test('T-36：1000 条限制，2041 条跨页，同日超过 1000 条也无遗漏', async () => {
  const rows = Array.from({ length: 2041 }, (_, index) => ({
    id: String(index).padStart(5, '0'), record_date: index < 1700 ? '2026-11-01' : '2026-11-02',
    category: 'skill', minutes: 5, tags: ['测试'],
  }));
  const client = localClient(rows, 1000);
  const actual = await createRepository(client).listRecords({ end: '2026-11-02' });
  assert.deepEqual(actual, rows);
  assert.equal(client.calls.length, 4);
  assert.equal(summarize(actual, {}).total, 10205);
  const capped = await createRepository(localClient(rows, 300)).listRecords({ start: '2026-11-02' });
  assert.equal(capped.length, 341);
});
