import { formatDuration } from '../domain/records.js';
import { useCallback, useId, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChartNoAxesColumn } from 'lucide-react';
import { Collapse, Icon } from '../components/DiaryUI.jsx';
import { QueryState } from '../components/Feedback.jsx';
import { ReviewChart } from '../components/ReviewChart.jsx';
import { useQuery } from '../components/useQuery.js';
import { categories, categoryStyle } from '../domain/categories.js';
import { dailyAverage, percentage, reviewBuckets, reviewCategories, reviewRange, weekComparison } from '../domain/review.js';
import { summarize } from '../domain/statistics.js';

const views = [['week', '周'], ['month', '月'], ['all', '全部']];
const monthDay = (date) => `${Number(date.slice(5, 7))}月${Number(date.slice(8))}日`;

function Period({ view, range, offset, onOffset }) {
  const week = view === 'week';
  const dates = `${monthDay(range.start)} – ${monthDay(range.end)}`;
  const named = week && offset >= -1;
  return <div className="v2-period">
    <div className="v2-period-row">
      <button type="button" className="v1-icon" aria-label={week ? '上一周' : '上一个月'} onClick={() => onOffset(offset - 1)}><Icon as={ChevronLeft} /></button>
      <div><strong>{week ? (named ? (offset === 0 ? '本周' : '上周') : dates)
        : `${range.start.slice(0, 4)}年${Number(range.start.slice(5, 7))}月`}</strong>
      {named && <small>{dates}</small>}</div>
      <button type="button" className="v1-icon" aria-label={week ? '下一周' : '下一个月'} disabled={offset === 0}
        onClick={() => onOffset(offset + 1)}><Icon as={ChevronRight} /></button>
    </div>
    {offset !== 0 && <button type="button" className="v1-text" onClick={() => onOffset(0)}>{week ? '回到本周' : '回到本月'}</button>}
  </div>;
}

function CategoryRow({ category, minutes, total, tags }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const width = total ? minutes * 100 / total : 0;
  const fields = categories[category];
  const content = <>
    <span className="v1-category-icon"><Icon as={fields.icon} /></span>
    <span className="v2-category-name">{fields.label}<span className="v2-progress" aria-hidden="true" style={{ '--percent': `${width}%` }} /></span>
    <span className="v2-category-values"><span>{formatDuration(minutes)}</span><small>{percentage(minutes, total)}</small></span>
    {tags.length > 0 && <Icon as={ChevronRight} className="v2-arrow" />}
  </>;
  return <div className="v2-category" style={categoryStyle(category)}>
    {tags.length ? <button type="button" className="v2-category-row" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{content}</button>
      : <div className="v2-category-row">{content}</div>}
    {tags.length > 0 && <Collapse id={id} open={open}>
      <div className="v2-ranking">
        {tags.map(({ name, minutes: time }) => <div key={name} className="v2-rank-row">
          <span>{name}</span><span>{formatDuration(time)}</span>
          <span className="v2-progress" aria-hidden="true" style={{ '--percent': `${tags[0].minutes ? time * 100 / tags[0].minutes : 0}%` }} />
        </div>)}
        <p>一条记录有多个标签时，每个标签都计入完整时长，所以标签合计可能大于学习板块总时间。</p>
      </div>
    </Collapse>}
  </div>;
}

export function Review({ today, repository, version }) {
  const [view, setView] = useState('week');
  const [offsets, setOffsets] = useState({ week: 0, month: 0 });
  const offset = offsets[view] ?? 0;
  const range = useMemo(() => reviewRange(view, today, offset), [view, today, offset]);
  const load = useCallback(async (signal) => {
    const end = range.end && range.end < today ? range.end : today;
    const previousRange = view === 'week' ? reviewRange(view, today, offset - 1) : null;
    const [records, previous] = await Promise.all([
      repository.listRecords({ ...range, end, summary: true }, signal),
      previousRange ? repository.listRecords({ ...previousRange, summary: true }, signal) : [],
    ]);
    return { records, previous: summarize(previous, previousRange ?? {}) };
  }, [repository, range, today, offset, view]);
  const key = `${view}:${offset}:${today}`;
  const query = useQuery(load, `${key}:${version}`, { retain: true });
  const data = query.data;
  const model = useMemo(() => {
    if (!data?.records.length) return null;
    const { records, previous } = data;
    const summary = summarize(records, range);
    const buckets = reviewBuckets(records, view, today, range);
    const rows = reviewCategories(records);
    const days = summary.recordedDays;
    const average = formatDuration(dailyAverage(summary.total, days));
    const description = view === 'week'
      ? `${days}/7 天有记录 · ${weekComparison(summary.total, previous.total, previous.recordedDays)}`
      : `${view === 'month' ? `${days}/${buckets.length} 天有记录` : `共 ${days} 天有记录`} · 日均 ${average}`;
    return { summary, buckets, rows, description };
  }, [data, range, today, view]);

  return <div className="v2-review">
    <header className="v1-large-head"><h1>回顾</h1></header>
    <div className="v1-segments v2-segments" role="group" aria-label="回顾视图">
      {views.map(([id, label]) => <button type="button" aria-pressed={id === view} key={id} onClick={() => setView(id)}>{label}</button>)}
    </div>
    {view !== 'all' && <Period view={view} range={range} offset={offset} onOffset={(value) => setOffsets({ ...offsets, [view]: value })} />}
    <QueryState query={query}>
      {model ? <>
        <section className="v2-overview" aria-label="用时概览">
          <strong>{formatDuration(model.summary.total)}</strong>
          <p>{model.description}</p>
          {model.summary.total > 0 && <p>{categories[model.rows[0].category].label}占比最高（{percentage(model.rows[0].minutes, model.summary.total)}）。</p>}
        </section>
        <ReviewChart key={key} buckets={model.buckets} view={view} />
        <section className="v1-group" aria-label="分类用时" key={key}>
          {model.rows.map(({ category, minutes }) => <CategoryRow key={category} category={category} minutes={minutes}
            total={model.summary.total} tags={category === 'skill' ? model.summary.tags.slice(0, view === 'week' ? 5 : 10) : []} />)}
        </section>
      </> : <div className="v2-empty"><Icon as={ChartNoAxesColumn} /><p>这段时间还没有记录</p></div>}
    </QueryState>
  </div>;
}
