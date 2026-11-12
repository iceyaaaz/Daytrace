import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Collapse, DatePicker, Icon, TimeBar, dateText, useReveal, weekdayText } from '../components/DiaryUI.jsx';
import { QueryState } from '../components/Feedback.jsx';
import { RecordList } from '../components/RecordList.jsx';
import { useQuery } from '../components/useQuery.js';
import { addDays } from '../domain/dates.js';
import { formatDuration } from '../domain/records.js';
import { minutesTotal } from '../domain/statistics.js';

function useHistoryRecords(repository, today, pages, extraDates, version) {
  const cache = useRef(new Map());
  const last = useRef({ records: [], earliest: today });
  const ranges = useMemo(() => [
    ...Array.from({ length: pages }, (_, index) => ({
      start: addDays(today, -(index * 30 + 29)), end: addDays(today, -index * 30),
    })),
    ...extraDates.filter((date) => date < addDays(today, -(pages * 30 - 1)))
      .map((date) => ({ start: date, end: date })),
  ], [today, pages, extraDates]);
  const load = useCallback(async (signal) => {
    const results = await Promise.all(ranges.map(async ({ start, end }) => {
      const key = `${start}:${end}`;
      const cached = cache.current.get(key);
      if (cached?.version === version) return cached.records;
      const records = await repository.listRecords({ start, end }, signal);
      if (!signal.aborted) cache.current.set(key, { version, records });
      return records;
    }));
    return { records: results.flat(), earliest: ranges[pages - 1].start };
  }, [pages, ranges, repository, version]);
  const query = useQuery(load, load);
  useEffect(() => { if (query.status === 'ready') last.current = query.data; }, [query.status, query.data]);
  return { query, ...(query.data ?? last.current) };
}

function groupMonths(records) {
  const months = new Map();
  const dates = new Map();
  for (const record of records) {
    const date = record.record_date;
    if (!dates.has(date)) dates.set(date, []);
    dates.get(date).push(record);
  }
  for (const date of [...dates.keys()].sort().reverse()) {
    const month = date.slice(0, 7);
    if (!months.has(month)) months.set(month, []);
    months.get(month).push({ date, records: dates.get(date) });
  }
  return months;
}

function MonthTitle({ month, entries, earliest, today, repository, version }) {
  const start = `${month}-01`;
  const partial = start < earliest;
  const year = Number(month.slice(0, 4));
  const number = Number(month.slice(5));
  const firstOfNextMonth = number === 12 ? `${String(year + 1).padStart(4, '0')}-01-01`
    : `${month.slice(0, 4)}-${String(number + 1).padStart(2, '0')}-01`;
  const lastOfMonth = addDays(firstOfNextMonth, -1);
  const end = lastOfMonth < today ? lastOfMonth : today;
  const load = useCallback(async (signal) => partial
    ? minutesTotal(await repository.listRecords({ start, end, summary: true }, signal))
    : null, [partial, repository, start, end]);
  const query = useQuery(load, `${start}:${version}:${partial}`, { retain: true });
  const total = partial ? query.data : entries.reduce((sum, { records }) => sum + minutesTotal(records), 0);
  return <h2 className="month-title"><span>{year} 年 {number} 月</span>
    {total != null && <small>合计 {formatDuration(total)}</small>}</h2>;
}

function Day({ date, records, today, expanded, highlighted, onToggle, cards, ...props }) {
  const id = useId();
  const total = minutesTotal(records);
  return <section className="day-card card" aria-label={`${date} 的历史记录`} data-highlighted={highlighted}
    ref={(node) => { cards.current[date] = node; }}>
    <h3>
      <button type="button" className="day-button" onClick={onToggle} aria-expanded={expanded} aria-controls={id}>
        <span className="day-heading">
          <time dateTime={date}>{dateText(date)}</time>
          <small>{weekdayText(date)}</small>
          {date === today && <span className="today-pill">今天</span>}
        </span>
        <span className="day-duration">{formatDuration(total)}</span>
        <Icon as={ChevronRight} className="day-arrow" />
      </button>
    </h3>
    <TimeBar records={records} total={total} />
    <Collapse id={id} open={expanded}><RecordList records={records} {...props} /></Collapse>
  </section>;
}

export function History({ today, repository, tags, createTag, version, onChange, notify, navigate }) {
  const [pages, setPages] = useState(1);
  const [extraDates, setExtraDates] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [jump, setJump] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const cards = useRef({});
  const reveal = useReveal();
  const { query, records, earliest: loadedFrom } = useHistoryRecords(repository, today, pages, extraDates, version);
  const months = useMemo(() => groupMonths(records), [records]);
  const days = [...months.values()].flat();
  const newest = days[0]?.date;
  const earliest = addDays(today, -(pages * 30 - 1));
  const visible = expanded ?? new Set(newest ? [newest] : []);
  const allExpanded = days.length > 0 && days.every(({ date }) => visible.has(date));

  useEffect(() => {
    if (query.status === 'ready' && expanded === null) setExpanded(new Set(newest ? [newest] : []));
  }, [expanded, newest, query.status]);

  useLayoutEffect(() => {
    if (!jump || query.status !== 'ready') return;
    const { date } = jump;
    if (!cards.current[date]) notify('这一天没有记录');
    else {
      setExpanded((current) => new Set([...(current ?? []), date]));
      setHighlight(jump);
      reveal(cards.current[date]);
    }
    setJump(null);
  }, [jump, query.status]); // 等跳转日期读完再定位。

  useEffect(() => {
    if (!highlight) return undefined;
    const timer = setTimeout(() => setHighlight(null), 1200);
    return () => clearTimeout(timer);
  }, [highlight]);

  function jumpTo(date) {
    if (date < earliest) {
      setExtraDates((current) => current.includes(date) ? current : [...current, date]);
    }
    setJump({ date });
  }

  function toggle(date) {
    const next = new Set(visible);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setExpanded(next);
  }

  return <div className="page">
    <div className="history-heading">
      <div className="page-heading">
        <h1>历史</h1>
        <div className="history-actions">
          <DatePicker date={today} today={today} onChoose={jumpTo} jump />
          <button type="button" className="text-button" disabled={!days.length} onClick={() =>
            setExpanded(new Set(allExpanded ? [] : days.map(({ date }) => date)))}>
            {allExpanded ? '全部折叠' : '全部展开'}
          </button>
        </div>
      </div>
      <p className="muted">按日期回看，也可以直接编辑。</p>
    </div>
    {query.status === 'ready' && !days.length && <section className="card empty-state">
      <Icon as={BookOpen} /><h2>还没有记录</h2><p className="muted">去今日页记下第一条吧</p>
      <button type="button" className="primary" onClick={() => navigate('today')}>去记录</button>
    </section>}
    {[...months].map(([month, entries]) => <section key={month} className="history-month">
      <MonthTitle month={month} entries={entries} earliest={loadedFrom} today={today}
        repository={repository} version={version} />
      {entries.map(({ date, records: items }) => <Day key={date} date={date} records={items} today={today}
        expanded={visible.has(date)} highlighted={highlight?.date === date} onToggle={() => toggle(date)}
        cards={cards} repository={repository} tags={tags} createTag={createTag} onChange={onChange} />)}
    </section>)}
    <QueryState query={query} />
    <button type="button" className="load-more" disabled={query.status !== 'ready'}
      onClick={() => setPages((count) => count + 1)}>加载更多</button>
  </div>;
}
