import { useCallback, useState } from 'react';
import { DateField, QueryState } from '../components/Feedback.jsx';
import { RecordForm } from '../components/RecordForm.jsx';
import { RecordList } from '../components/RecordList.jsx';
import { useQuery } from '../components/useQuery.js';
import quotes from '../data/quotes.json';
import { isRecordDate, quoteForDate } from '../domain/dates.js';
import { categories, durationText } from '../domain/records.js';
import { minutesTotal } from '../domain/statistics.js';

const sections = ['idea', 'book', 'skill', 'exercise', 'news'];

function Section({ category, date, query, repository, tags, createTag, onChange, nested }) {
  const [open, setOpen] = useState(category === 'idea');
  const Heading = nested ? 'h3' : 'h2';
  const { label, color } = categories[category];
  return <section className={nested ? 'subsection' : 'card category-card'} aria-label={label}>
    <div className="section-heading">
      <Heading><span className="category-dot" style={{ background: color }} />{label}</Heading>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {open ? '收起填写' : '添加一条'}
      </button>
    </div>
    {open && <RecordForm category={category} date={date} repository={repository} tags={tags} createTag={createTag}
      onSaved={() => { if (category !== 'idea') setOpen(false); onChange('已保存记录'); }} />}
    {query.status === 'ready' && <RecordList records={query.data.filter((record) => record.category === category)}
      repository={repository} tags={tags} createTag={createTag} onChange={onChange} />}
  </section>;
}

export function Today({ today, repository, tags, createTag, version, onChange }) {
  const [pickedDate, setPickedDate] = useState('');
  const date = isRecordDate(pickedDate, today) ? pickedDate : today;
  const quote = quoteForDate(quotes, date);
  const load = useCallback((signal) => repository.listRecords({ start: date, end: date }, signal), [date, repository]);
  const query = useQuery(load, `${date}:${version}`);
  const sectionProps = { date, query, repository, tags, createTag, onChange };
  const total = query.status === 'ready' ? minutesTotal(query.data) : 0;

  return <div className="page">
    <section className="quote card" aria-label="每日一言">
      <p className="eyebrow">每日一言</p>
      <blockquote>{quote.text}</blockquote>
      {quote.author && <span className="muted">{quote.author}</span>}
    </section>
    <div className="page-heading">
      <div><h1>今日记录</h1><p className="muted">挑想记的板块，随手留下一点。</p></div>
      <DateField id="today-date" value={date} max={today} onChange={(value) => {
        if (isRecordDate(value, today)) setPickedDate(value === today ? '' : value);
      }} />
    </div>
    <QueryState query={query}>
      {query.data?.length === 0 && <p className="notice">这一天还没有记录。</p>}
    </QueryState>
    <div className="page" key={date}>
      {sections.map((category) => <Section key={category} category={category} {...sectionProps} />)}
      <section className="card category-card" aria-label="娱乐">
        <h2>娱乐</h2>
        <Section category="fun_offline" {...sectionProps} nested />
        <Section category="fun_phone" {...sectionProps} nested />
      </section>
    </div>
    {query.status === 'ready' && <section className="card daily-totals" aria-label="当日时间合计">
      <div><span>已记录合计</span><strong>{durationText(total)}</strong></div>
      <div><span>未记录时间</span><strong>{durationText(1440 - total)}</strong></div>
      {total > 1440 && <p className="error" role="alert">合计超过 24 小时，请检查是否重复记录</p>}
    </section>}
  </div>;
}
