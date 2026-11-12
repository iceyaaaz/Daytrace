import { useCallback, useState } from 'react';
import { DateField, QueryState } from '../components/Feedback.jsx';
import { RecordList } from '../components/RecordList.jsx';
import { useQuery } from '../components/useQuery.js';
import { addDays, isRecordDate, weekday } from '../domain/dates.js';
import { durationText } from '../domain/records.js';
import { minutesTotal } from '../domain/statistics.js';

function Window({ start, end, exact, repository, tags, createTag, version, onChange }) {
  const load = useCallback((signal) => repository.listRecords({ start, end }, signal), [start, end, repository]);
  const query = useQuery(load, `${start}:${end}:${version}`);
  const groups = new Map();
  for (const record of query.data ?? []) {
    if (!groups.has(record.record_date)) groups.set(record.record_date, []);
    groups.get(record.record_date).push(record);
  }

  return <QueryState query={query}>
    {groups.size === 0 && <p className="notice">{exact ? '这一天没有记录' : '这 30 天没有记录'}</p>}
    {[...groups].reverse().map(([date, records]) => (
      <section className="card" aria-label={`${date} 的历史记录`} key={date}>
        <div className="section-heading">
          <h2><time dateTime={date}>{date}</time> <small>星期{'日一二三四五六'[weekday(date)]}</small></h2>
          <span className="muted">合计 {durationText(minutesTotal(records))}</span>
        </div>
        <RecordList records={records} repository={repository} tags={tags} createTag={createTag}
          onChange={onChange} showCategory />
      </section>
    ))}
  </QueryState>;
}

export function History({ today, ...props }) {
  const [date, setDate] = useState('');
  const [pages, setPages] = useState(1);
  return <div className="page">
    <div className="page-heading">
      <div><h1>历史记录</h1><p className="muted">按日期回看，也可以直接编辑。</p></div>
      <div className="actions">
        <DateField id="history-date" label="跳到日期" value={date} max={today} onChange={(value) => {
          if (!value || isRecordDate(value, today)) setDate(value);
        }} />
        {date && <button type="button" onClick={() => setDate('')}>返回最近记录</button>}
      </div>
    </div>
    {date ? <Window key={date} start={date} end={date} exact {...props} /> : <>
      {Array.from({ length: pages }, (_, index) => (
        <Window key={index} start={addDays(today, -(index * 30 + 29))} end={addDays(today, -index * 30)} {...props} />
      ))}
      <button type="button" className="load-more" onClick={() => setPages((value) => value + 1)}>加载更多</button>
    </>}
  </div>;
}
