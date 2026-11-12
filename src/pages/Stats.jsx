import { useCallback, useMemo, useState } from 'react';
import { QueryState } from '../components/Feedback.jsx';
import { StatisticsPanel } from '../components/StatisticsPanel.jsx';
import { useQuery } from '../components/useQuery.js';
import { addDays, statsRange, weekRange } from '../domain/dates.js';
import { summarize, withWeekComparison } from '../domain/statistics.js';

const periods = [['7', '近 7 天'], ['30', '近 30 天'], ['month', '本月'], ['all', '全部']];

export function Stats({ repository, today, version }) {
  const [period, setPeriod] = useState('30');
  const { start, end } = statsRange(period, today);
  const load = useCallback((signal) => repository.listRecords({ start, end, summary: true }, signal), [start, end, repository]);
  const query = useQuery(load, `${period}:${start}:${end}:${version}`);
  const summary = useMemo(() => query.data && summarize(query.data, { start, end }), [query.data, start, end]);
  return <div className="page">
    <div className="page-heading"><div><h1>时间统计</h1><p className="muted">看看时间花在了哪里。</p></div></div>
    <div className="actions filters" role="group" aria-label="统计时间范围">
      {periods.map(([id, name]) => (
        <button key={id} type="button" aria-pressed={period === id} onClick={() => setPeriod(id)}>{name}</button>
      ))}
    </div>
    <QueryState query={query}>
      {summary && <>
        {summary.total === 0 && <p className="notice">暂无数据</p>}
        {summary.recordedDays > 0 && <StatisticsPanel summary={summary} tagCount={10} />}
      </>}
    </QueryState>
  </div>;
}

export function Weekly({ repository, today, version }) {
  const [offset, setOffset] = useState(0);
  const { start, end } = weekRange(addDays(today, offset * 7));
  const previousStart = addDays(start, -7);
  const previousEnd = addDays(start, -1);
  const load = useCallback((signal) => repository.listRecords({ start: previousStart, end, summary: true }, signal), [previousStart, end, repository]);
  const query = useQuery(load, `${start}:${version}`);
  const current = useMemo(() => query.data && summarize(query.data, { start, end }), [query.data, start, end]);
  const previous = useMemo(() => query.data && summarize(query.data, { start: previousStart, end: previousEnd }),
    [query.data, previousStart, previousEnd]);
  return <div className="page">
    <div className="page-heading"><div><h1>每周回顾</h1><p className="muted">从周一到周日，留一点时间回看。</p></div></div>
    <div className="card week-switch">
      <button type="button" onClick={() => setOffset((value) => value - 1)}>上一周</button>
      <div aria-live="polite"><strong>{offset === 0 ? '本周' : '所选周'}</strong><p>{start} 至 {end}</p></div>
      <button type="button" onClick={() => setOffset((value) => value + 1)}>下一周</button>
    </div>
    <QueryState query={query}>
      {current && (current.recordedDays === 0 ? <p className="notice">这周还没有记录</p>
        : <StatisticsPanel summary={current} rows={withWeekComparison(current, previous)} tagCount={5} weekly />)}
    </QueryState>
  </div>;
}
