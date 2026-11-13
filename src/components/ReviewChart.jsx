import { formatDuration } from '../domain/records.js';
import { useEffect, useRef, useState } from 'react';
import { weekdayText } from './DiaryUI.jsx';
import { categories, categoryIds, categoryStyle } from '../domain/categories.js';
import { chartMaximum } from '../domain/review.js';

const day = (date) => Number(date.slice(8));
const month = (date) => Number(date.slice(5, 7));
const monthLabel = (date) => `${date.slice(0, 4)}年${month(date)}月`;
const dayLabel = (date) => `${month(date)}月${day(date)}日 ${weekdayText(date)}`;

function axisLabel(view, date) {
  if (view === 'week') return weekdayText(date).slice(1);
  if (view === 'all') return `${month(date)}月`;
  return [1, 5, 10, 15, 20, 25].includes(day(date)) ? day(date) : '';
}

export function ReviewChart({ buckets, view }) {
  const [selected, setSelected] = useState(null);
  const scroller = useRef(null);
  const chart = useRef(null);
  const picked = buckets.find((bucket) => bucket.date === selected);
  const maximum = chartMaximum(Math.max(0, ...buckets.map(({ total }) => total)));
  const parts = (bucket) => categoryIds.filter((id) => bucket.parts[id] > 0);

  useEffect(() => {
    if (view === 'all') scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [view, buckets.length]);

  useEffect(() => {
    if (!selected) return undefined;
    function outside(event) {
      if (!chart.current.contains(event.target)) setSelected(null);
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [selected]);

  function keyboard(event) {
    if (event.key === 'Escape') { setSelected(null); return; }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    const active = buckets.filter((bucket) => bucket.total > 0);
    if (!active.length) return;
    const index = active.findIndex((bucket) => bucket.date === selected);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? active.length - 1
      : event.key === 'ArrowLeft' ? (index < 0 ? active.length - 1 : Math.max(0, index - 1))
      : event.key === 'ArrowRight' ? Math.min(active.length - 1, index + 1) : Math.max(0, index);
    const date = active[next].date;
    setSelected(date);
    const column = chart.current.querySelector(`[data-date="${date}"]`);
    const area = scroller.current.getBoundingClientRect();
    const bounds = column.getBoundingClientRect();
    if (bounds.left < area.left) scroller.current.scrollLeft -= area.left - bounds.left;
    else if (bounds.right > area.right) scroller.current.scrollLeft += bounds.right - area.right;
  }

  return <figure className="v2-chart" ref={chart}>
    {picked && <div className="v2-chart-detail" role="status">
      <strong>{view === 'all' ? monthLabel(picked.date) : dayLabel(picked.date)}</strong>
      {parts(picked).map((category) => <span key={category} style={categoryStyle(category)}>
        <i className="v2-dot" aria-hidden="true" />{categories[category].label} {formatDuration(picked.parts[category])}
      </span>)}
      <strong>合计 {formatDuration(picked.total)}</strong>
    </div>}
    <div className="v2-chart-layout">
      <div className="v2-chart-scroll" ref={scroller} tabIndex={0} onKeyDown={keyboard}
        role="group" aria-label="用时堆叠柱状图。用左右方向键查看柱子，按 Escape 取消">
        <div className="v2-chart-grid" data-view={view} style={{ '--buckets': buckets.length }} onClick={() => setSelected(null)}>
          <div className="v2-gridlines" aria-hidden="true" />
          {buckets.map((bucket) => <div className="v2-chart-column" key={bucket.date} data-date={bucket.date}
            aria-hidden="true">
            <div className="v2-column-area">
              {bucket.total > 0 && <div className="v2-stack" onClick={(event) => { event.stopPropagation(); setSelected(bucket.date); }}
                data-dimmed={Boolean(selected && selected !== bucket.date)}
                style={{ '--height': `${bucket.total * 100 / maximum}%` }}>
                {parts(bucket).map((category) => <svg key={category} viewBox="0 0 1 1" preserveAspectRatio="none"
                  style={{ ...categoryStyle(category), '--share': `${bucket.parts[category] * 100 / bucket.total}%` }}><rect width="1" height="1" /></svg>)}
              </div>}
            </div>
            <span className="v2-axis-label">{axisLabel(view, bucket.date)}</span>
          </div>)}
        </div>
      </div>
      <div className="v2-chart-axis" aria-hidden="true"><span>{formatDuration(maximum, { compact: true })}</span><span>0</span></div>
    </div>
  </figure>;
}
