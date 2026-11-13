import { ThemeHero } from '../themes/ThemeViews.jsx';
import { useCallback, useEffect, useId, useReducer, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { Icon, weekdayText } from '../components/DiaryUI.jsx';
import { Panel, ActionMenu } from '../components/Panel.jsx';
import { QueryState } from '../components/Feedback.jsx';
import { RecordForm } from '../components/RecordForm.jsx';
import { useQuery } from '../components/useQuery.js';
import quotes from '../data/quotes.json';
import { categories, categoryIds, categoryStyle } from '../domain/categories.js';
import { isRecordDate, quoteForDate } from '../domain/dates.js';
import { formatDuration, recordErrors } from '../domain/records.js';
import { entryPanel, hasEntryChanges } from '../domain/entryPanel.js';
import { minutesTotal } from '../domain/statistics.js';

export const compactDuration = (minutes) => formatDuration(minutes, { compact: true });
const dateText = (date) => `${Number(date.slice(5, 7))}月${Number(date.slice(8))}日`;

export function Today({ today, repository, tags, createTag, version, onChange, navigate, onTitle, theme }) {
  const [pickedDate, setPickedDate] = useState('');
  const [selectDate, setSelectDate] = useState(null);
  const [panel, dispatch] = useReducer(entryPanel, null);
  const [animated, setAnimated] = useState('');
  const [saved, setSaved] = useState([]);
  const pendingClose = useRef(null);
  const entryForm = useId();
  const dateForm = useId();
  const date = isRecordDate(pickedDate, today) ? pickedDate : today;
  const title = date === today ? '今天' : dateText(date);
  const quote = quoteForDate(quotes, date);
  const category = panel?.draft.category;
  const focusText = category && !['skill', 'exercise'].includes(category);
  const load = useCallback((signal) => repository.listRecords({ start: date, end: date, summary: true }, signal), [date, repository]);
  const query = useQuery(load, `${date}:${version}`, { retain: true });
  const base = query.data ?? [];
  const records = [...base, ...saved.filter((item) => item.record_date === date && !base.some((row) => row.id === item.id))];
  const total = minutesTotal(records);

  useEffect(() => { onTitle(title); }, [title, onTitle]);
  useEffect(() => {
    if (query.status === 'ready' && query.key === `${date}:${version}`) {
      setSaved((current) => current.filter((item) => item.record_date !== date));
    }
  }, [date, version, query.key, query.status]);

  function dismiss(close) {
    if (hasEntryChanges(panel.draft)) {
      pendingClose.current = close;
      dispatch({ type: 'confirm', value: true });
    } else close(() => dispatch({ type: 'close' }));
  }

  return <div className="v1-today v1-surface">
    <div className="theme-today-head" data-illustrated={theme.kind === 'style'}>
      <ThemeHero theme={theme} />
      <div className="v1-large-head">
        <h1>{title}</h1>
        <button type="button" className="v1-icon" aria-label="设置" onClick={() => navigate('settings')}><Icon as={Settings} /></button>
      </div>
      <div className="v1-date-line">
        <button className="v1-text" type="button" aria-label="记录日期" aria-haspopup="dialog" onClick={() => setSelectDate(date)}>
          {date === today ? <time dateTime={date}>{dateText(date)} {weekdayText(date)}</time> : <span>补记 · {weekdayText(date)}</span>}
          <Icon as={ChevronDown} />
        </button>
        {!!records.length && <span className={total > 1440 ? 'v1-warn' : undefined}>
          {total <= 1440 && '· '}已记录{compactDuration(total)}{total > 1440 && '，请检查是否重复'}
        </span>}
        {date !== today && <button type="button" className="v1-text v1-return" onClick={() => setPickedDate('')}>回到今天</button>}
      </div>
    </div>
    <section className="v1-quote" aria-label="每日一言">
      <blockquote>{quote.text}</blockquote>
      {quote.author && quote.author !== '占位内容' && <p>{quote.author}</p>}
    </section>
    <div className="v1-group" aria-label="日记板块">
      {categoryIds.map((id) => {
        const count = records.filter((item) => item.category === id).length;
        return <button type="button" key={id} className="v1-row v1-entry-row" style={categoryStyle(id)}
          aria-haspopup="dialog" onClick={(event) => {
            event.currentTarget.focus({ preventScroll: true });
            flushSync(() => dispatch({ type: 'open', category: id, id: crypto.randomUUID() }));
          }}>
          <span className="v1-category-icon"><Icon as={categories[id].icon} /></span><span>{categories[id].label}</span>
          <span className="v1-row-end">
            {query.status === 'loading' && <span className="v1-skeleton v1-skeleton-count" aria-hidden="true" />}
            {count > 0 && <span key={count} className={animated === id ? 'v1-count v1-bounce' : 'v1-count'}>{count}</span>}
            <Icon as={ChevronRight} />
          </span>
        </button>;
      })}
    </div>
    {query.status === 'error' && <QueryState query={query} />}
    {selectDate !== null && <Panel title="记录日期" onDismiss={(close) => close(() => setSelectDate(null))}
      submit={<button type="submit" className="v1-text" form={dateForm} disabled={!isRecordDate(selectDate, today)}>确定</button>}>
      {(close) => <form className="v1-group v1-date-form" id={dateForm} onSubmit={(event) => {
        event.preventDefault();
        if (isRecordDate(selectDate, today)) close(() => { setPickedDate(selectDate === today ? '' : selectDate); setSelectDate(null); });
      }}><label>选择日期<input type="date" required min="0001-01-01" max={today} value={selectDate}
        onChange={(event) => setSelectDate(event.target.value)} /></label></form>}
    </Panel>}
    {panel && <Panel title={categories[category].label} onDismiss={dismiss} busy={panel.busy} autofocus={Boolean(focusText)}
      submit={<button type="submit" className="v1-text v1-save" form={entryForm} disabled={panel.busy}
        data-incomplete={Boolean(Object.keys(recordErrors(panel.draft)).length)}>{panel.busy ? '保存中…' : '保存'}</button>}
      footer={<button type="submit" form={entryForm} value="again" className="v1-text" disabled={panel.busy}>保存并再记一条</button>}>
      {(close) => <RecordForm panel formId={entryForm} category={category} date={date} tags={tags}
        createTag={createTag} repository={repository} draft={panel.draft}
        onPending={(value) => dispatch({ type: 'busy', value, id: panel.id })}
        onDraft={(patch) => dispatch({ type: 'patch', patch, id: panel.id })}
        onSaved={({ id, values, again }) => {
          setSaved((current) => [...current, { id, record_date: date, ...values }]);
          setAnimated(category);
          const message = `已保存：${categories[category].label}${values.minutes ? ` · ${compactDuration(values.minutes)}` : ''}`;
          onChange(message, id);
          if (again) {
            dispatch({ type: 'again' });
            requestAnimationFrame(() => document.getElementById(entryForm)?.querySelector('textarea')?.focus());
          } else close(() => dispatch({ type: 'close' }));
        }} />}
    </Panel>}
    {panel?.confirming && <ActionMenu title="放弃未保存的更改？" cancel="继续编辑"
      onCancel={() => dispatch({ type: 'confirm', value: false })}
      options={[{ label: '放弃更改', danger: true, action: () => {
        dispatch({ type: 'confirm', value: false });
        pendingClose.current?.(() => dispatch({ type: 'close' }));
      } }]} />}
  </div>;
}
