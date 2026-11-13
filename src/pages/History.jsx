import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CalendarDays, ChevronRight, Search } from 'lucide-react';
import { Collapse, Icon, useReveal, weekdayText } from '../components/DiaryUI.jsx';
import { QueryState } from '../components/Feedback.jsx';
import { HistoryEditor, HistoryRecord } from '../components/HistoryRecord.jsx';
import { Panel } from '../components/Panel.jsx';
import { useQuery } from '../components/useQuery.js';
import { addDays, isRecordDate } from '../domain/dates.js';
import { groupMonths } from '../domain/history.js';
import { formatDuration } from '../domain/records.js';
import { shiftMonth } from '../domain/review.js';
import { minutesTotal } from '../domain/statistics.js';

const dayLabel = (date) => `${Number(date.slice(5, 7))}月${Number(date.slice(8))}日`;
const monthLabel = (month) => `${Number(month.slice(0, 4))}年${Number(month.slice(5, 7))}月`;

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
    const earliest = ranges[pages - 1].start;
    const more = earliest > '0001-01-01' && await repository.hasRecordsBefore(earliest, signal);
    return { records: results.flat(), earliest, more };
  }, [pages, ranges, repository, version]);
  const query = useQuery(load, load);
  useEffect(() => { if (query.status === 'ready') last.current = query.data; }, [query.status, query.data]);
  return { query, ...(query.data ?? last.current) };
}

function MonthTitle({ month, entries, earliest, today, repository, version }) {
  const start = `${month}-01`;
  const partial = start < earliest;
  const lastOfMonth = addDays(shiftMonth(start, 1), -1);
  const end = lastOfMonth < today ? lastOfMonth : today;
  const load = useCallback(async (signal) => partial
    ? minutesTotal(await repository.listRecords({ start, end, summary: true }, signal))
    : null, [partial, repository, start, end]);
  const query = useQuery(load, `${start}:${version}:${partial}`, { retain: true });
  const total = partial ? query.data : entries.reduce((sum, { records }) => sum + minutesTotal(records), 0);
  return <h2 className="v2-month-title"><span>{monthLabel(month)}</span>
    {total != null && <small>合计 {formatDuration(total)}</small>}</h2>;
}

function DateJump({ today, onChoose, onDismiss }) {
  const [date, setDate] = useState(today);
  const form = useId();
  return <Panel title="跳到日期" onDismiss={(close) => close(onDismiss)}
    submit={<button type="submit" className="v1-text" form={form} disabled={!isRecordDate(date, today)}>确定</button>}>
    {(close) => <form id={form} className="v2-date-form" onSubmit={(event) => {
      event.preventDefault();
      if (isRecordDate(date, today)) close(() => { onDismiss(); onChoose(date); });
    }}>
      <label>选择日期<input type="date" min="0001-01-01" max={today} required value={date}
        onChange={(event) => setDate(event.target.value)} /></label>
    </form>}
  </Panel>;
}

function Day({ date, today, records, expanded, highlighted, onToggle, rows, renderRecord }) {
  const id = useId();
  const yesterday = date === addDays(today, -1);
  return <section className="v2-day" aria-label={`${date} 的历史记录`} data-highlighted={highlighted}
    ref={(node) => { if (node) rows.current.set(date, node); else rows.current.delete(date); }}>
    <h3><button type="button" className="v2-day-button" onClick={onToggle} aria-expanded={expanded} aria-controls={id}>
      <time dateTime={date}>{date === today ? '今天' : yesterday ? '昨天' : dayLabel(date)}</time>
      {date !== today && !yesterday && <span className="v2-subtle">{weekdayText(date)}</span>}
      <span className="v2-day-total">{formatDuration(minutesTotal(records))}</span>
      <Icon as={ChevronRight} className="v2-arrow" />
    </button></h3>
    <Collapse id={id} open={expanded}>{records.map((record) => renderRecord(record))}</Collapse>
  </section>;
}

function Skeleton() {
  return <div className="v1-group" role="status" aria-label="正在读取历史记录">
    {Array.from({ length: 5 }, (_, index) => <div className="v2-skeleton-row" key={index}>
      <span className="v1-skeleton" />
    </div>)}
  </div>;
}

export function History({ today, repository, tags, createTag, version, onChange, notify, navigate }) {
  const [pages, setPages] = useState(1);
  const [extraDates, setExtraDates] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [jump, setJump] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const [searching, setSearching] = useState(false);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState({ keyword: '', pages: 1 });
  const inputRef = useRef(null);
  const searchButton = useRef(null);
  const rows = useRef(new Map());
  const reveal = useReveal();
  const { query, records, earliest, more } = useHistoryRecords(repository, today, pages, extraDates, version);
  const months = useMemo(() => groupMonths(records), [records]);
  const newest = months.values().next().value?.[0].date;
  const visible = expanded ?? new Set(newest ? [newest] : []);

  useEffect(() => {
    if (query.status === 'ready' && newest && expanded === null) setExpanded(new Set([newest]));
  }, [expanded, newest, query.status]);

  useEffect(() => {
    if (!searching || input.trim() === search.keyword) return undefined;
    const timer = setTimeout(() => setSearch({ keyword: input.trim(), pages: 1 }), 300);
    return () => clearTimeout(timer);
  }, [input, searching, search.keyword]);

  useLayoutEffect(() => {
    if (searching) inputRef.current?.focus();
  }, [searching]);

  const fetchSearch = useCallback(async (signal) => {
    if (!search.keyword || !searching) return { records: [], more: false };
    const results = await Promise.all(Array.from({ length: search.pages }, (_, page) =>
      repository.searchRecords(search.keyword, page, signal)));
    return { records: results.flatMap((page) => page.records), more: results.at(-1).more };
  }, [repository, search, searching]);
  const results = useQuery(fetchSearch, `${search.keyword}:${search.pages}:${version}:${searching}`);

  useLayoutEffect(() => {
    if (!jump || query.status !== 'ready') return;
    const node = rows.current.get(jump.date);
    if (!node) notify('这一天没有记录');
    else {
      setExpanded(new Set([...visible, jump.date]));
      setHighlight(jump);
      reveal(node);
    }
    setJump(null);
  }, [jump, query.status]); // 等目标日期读取完成后再定位。

  useEffect(() => {
    if (!highlight) return undefined;
    const timer = setTimeout(() => setHighlight(null), 1200);
    return () => clearTimeout(timer);
  }, [highlight]);

  function jumpTo(date) {
    if (date < earliest) setExtraDates((current) => current.includes(date) ? current : [...current, date]);
    setJump({ date });
  }

  function exitSearch() {
    setSearching(false);
    setInput('');
    setSearch({ keyword: '', pages: 1 });
    setRevealed(null);
    searchButton.current?.focus({ preventScroll: true });
  }

  function toggle(date) {
    const next = new Set(visible);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setExpanded(next);
    setRevealed(null);
  }

  function renderRecord(record, keyword) {
    return <HistoryRecord key={record.id} record={record} keyword={keyword}
      revealed={revealed === record.id} onReveal={setRevealed}
      onEdit={() => setEditing({ record })} onDelete={() => setEditing({ record, deleting: true })} />;
  }

  const activeSearch = searching && input.trim() === search.keyword && search.keyword;
  return <div className="v2-history">
    <header className="v1-large-head">
      <h1>历史</h1>
      <div className="v2-actions">
        <button type="button" className="v1-icon" aria-label="搜索" aria-expanded={searching} ref={searchButton}
          onClick={() => { if (searching) inputRef.current?.focus(); else { setRevealed(null); setSearching(true); } }}><Icon as={Search} /></button>
        <button type="button" className="v1-icon" aria-label="跳到日期" aria-haspopup="dialog" onClick={() => {
          if (searching) exitSearch();
          setPicker(true);
        }}><Icon as={CalendarDays} /></button>
      </div>
    </header>
    {searching ? <>
      <div className="v2-search">
        <label><Icon as={Search} /><input ref={inputRef} type="search" aria-label="搜索记录" placeholder="搜索"
          value={input} onChange={(event) => { setInput(event.target.value); setRevealed(null); }} /></label>
        <button className="v1-text" type="button" onClick={exitSearch}>取消</button>
      </div>
      {activeSearch && <QueryState query={results}>
        {results.data?.records.length === 0 && <p className="v2-empty" role="status">没有找到相关记录</p>}
        {results.data && [...groupMonths(results.data.records).values()].flat().map(({ date, records: items }) =>
          <section key={date} className="v2-search-day">
            <h2>{dayLabel(date)} {weekdayText(date)}</h2>
            <div className="v1-group">{items.map((record) => renderRecord(record, search.keyword))}</div>
          </section>)}
        {results.data?.more && <button type="button" className="v1-text v2-more"
          onClick={() => setSearch((current) => ({ ...current, pages: current.pages + 1 }))}>加载更多</button>}
      </QueryState>}
    </> : <>
      {query.status === 'loading' && !records.length && <Skeleton />}
      {query.status === 'ready' && !records.length && !more && <div className="v2-empty">
        <Icon as={BookOpen} /><p>还没有记录</p>
        <button type="button" className="v1-text" onClick={() => navigate('today')}>去今日页记一条</button>
      </div>}
      {[...months].map(([month, entries]) => <section className="v2-month" key={month}>
        <MonthTitle month={month} entries={entries} earliest={earliest} today={today} repository={repository} version={version} />
        <div className="v1-group">{entries.map(({ date, records: items }) => <Day key={date} date={date} today={today} records={items}
          expanded={visible.has(date)} highlighted={highlight?.date === date} onToggle={() => toggle(date)}
          rows={rows} renderRecord={renderRecord} />)}</div>
      </section>)}
      {(query.status === 'error' || (query.status === 'loading' && records.length > 0)) && <QueryState query={query} />}
      {more && <button type="button" className="v1-text v2-more" disabled={query.status !== 'ready'}
        onClick={() => setPages((count) => count + 1)}>加载更多</button>}
    </>}
    {picker && <DateJump today={today} onChoose={jumpTo} onDismiss={() => setPicker(false)} />}
    {editing && <HistoryEditor {...editing} repository={repository} tags={tags} createTag={createTag}
      onCancel={() => setEditing(null)} onDone={(message) => {
        setEditing(null);
        setRevealed(null);
        onChange(message);
      }} />}
  </div>;
}
