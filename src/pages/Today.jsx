import { useCallback, useId, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Check, ChevronRight, Plus } from 'lucide-react';
import { CategoryIcon, Collapse, DatePicker, Icon, TimeBar, useReveal } from '../components/DiaryUI.jsx';
import { QueryState } from '../components/Feedback.jsx';
import { RecordForm } from '../components/RecordForm.jsx';
import { useQuery } from '../components/useQuery.js';
import quotes from '../data/quotes.json';
import { categories, categoryIds, categoryStyle } from '../domain/categories.js';
import { isRecordDate, quoteForDate } from '../domain/dates.js';
import { formatDuration } from '../domain/records.js';
import { minutesTotal } from '../domain/statistics.js';
import { dayFlow, entryKey, initialToday, todayFlow } from '../domain/todayFlow.js';

function EntryCard({ category, date, open, count, draft, dispatch, repository, tags, createTag, onSaved, onToggle, cards }) {
  const id = useId();
  const { label, subtitle } = categories[category];
  const dirty = draft && (draft.content || draft.gain || draft.tags.length ||
    (category === 'idea' ? Number(draft.minutes) > 0 : draft.minutes !== ''));
  return <section className="entry-card card" style={categoryStyle(category)} data-open={open} aria-label={label}
    ref={(node) => { cards.current[category] = node; }}>
    <h2>
      <button type="button" className="entry-head" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        <CategoryIcon category={category} />
        <span className="entry-label"><strong>{label}</strong><small>{subtitle}</small></span>
        <span className="entry-badges">
          {count ? <span className="saved-pill"><Icon as={Check} />已记 {count} 条</span>
            : <span className="entry-plus"><Icon as={Plus} /></span>}
          {dirty && !open && <span className="unsaved-pill">未保存</span>}
        </span>
      </button>
    </h2>
    <Collapse id={id} open={open}>
      <div className="entry-form">
        <RecordForm category={category} date={date} draft={draft}
          onDraft={(patch) => dispatch({ type: 'draft', date, category, patch })}
          repository={repository} tags={tags} createTag={createTag} onSaved={onSaved} />
      </div>
    </Collapse>
  </section>;
}

export function Today({ today, repository, tags, createTag, version, onChange, navigate, active }) {
  const [pickedDate, setPickedDate] = useState('');
  const [state, dispatch] = useReducer(todayFlow, initialToday);
  const [revealRequest, setRevealRequest] = useState(null);
  const cards = useRef({});
  const reveal = useReveal();
  const date = isRecordDate(pickedDate, today) ? pickedDate : today;
  const quote = quoteForDate(quotes, date);
  const day = dayFlow(state, date);
  const load = useCallback((signal) => repository.listRecords({ start: date, end: date, summary: true }, signal), [date, repository]);
  const query = useQuery(load, `${date}:${version}`, { retain: true });
  const records = query.data ?? [];
  const total = minutesTotal(records);
  const current = useRef(null);
  current.current = { date, open: day.open, active };

  useLayoutEffect(() => {
    if (active && revealRequest?.date === date && day.open) reveal(cards.current[day.open], true);
    if (revealRequest) setRevealRequest(null);
  }, [active, date, day.open, reveal, revealRequest]);

  function save(category, { id, values, again }) {
    dispatch({ type: 'saved', date, category, again });
    if (current.current.active && current.current.date === date && current.current.open === category) setRevealRequest({ date });
    const time = category === 'idea' && values.minutes === 0 ? '' : ` · ${formatDuration(values.minutes)}`;
    onChange(`已保存：${categories[category].label}${time}`, id);
  }

  return <div className="page">
    <section className="quote card" aria-label="每日一言">
      <span className="quote-mark" aria-hidden="true">“</span>
      <p className="eyebrow">每日一言</p>
      <blockquote>{quote.text}</blockquote>
      {quote.author && <p className="quote-author">{quote.author}</p>}
    </section>
    <div className="today-heading">
      <div className="page-heading">
        <h1>今日记录</h1>
        <DatePicker date={date} today={today} onChoose={(value) => setPickedDate(value === today ? '' : value)} />
      </div>
      <p className="muted">挑想记的板块，随手留下一点。</p>
    </div>
    <QueryState query={query}>
      <section className="card time-card" aria-label="今日时间条">
        <TimeBar records={records} total={total} daily />
        <div className="time-caption">
          <strong>{records.length ? `已记录 ${formatDuration(total)}` : '今天还没有记录'}</strong>
          {total <= 1440 && <small>未记录 {formatDuration(1440 - total)}</small>}
          {total > 1440 && <p role="alert" className="warning">合计超过 24 小时，请检查是否重复记录</p>}
        </div>
      </section>
    </QueryState>
    <div className="page" key={date}>
      {categoryIds.map((category) => <div className="entry-group" key={category}>
        {category === 'fun_offline' && <p className="group-caption">娱乐</p>}
        <EntryCard category={category} date={date} open={day.open === category}
          count={records.filter((record) => record.category === category).length}
          draft={state.drafts[entryKey(date, category)]} cards={cards} dispatch={dispatch}
          repository={repository} tags={tags} createTag={createTag} onSaved={(saved) => save(category, saved)}
          onToggle={() => {
            if (day.open !== category) setRevealRequest({ date });
            dispatch({ type: 'toggle', date, category });
          }} />
      </div>)}
    </div>
    {day.finished && <button type="button" className="text-button finish-link" onClick={() => navigate('history')}>
      {date === today ? '今天' : '当天'}已记录 {records.length} 条 · 去历史查看 <Icon as={ChevronRight} />
    </button>}
  </div>;
}
