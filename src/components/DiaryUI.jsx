import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, X } from 'lucide-react';
import { categories, categoryIds, categoryStyle } from '../domain/categories.js';
import { isRecordDate, weekday } from '../domain/dates.js';
import { formatDuration } from '../domain/records.js';

export function Icon({ as: Graphic, className, ...props }) {
  return <Graphic className={className} strokeWidth={1.75} aria-hidden="true" {...props} />;
}

export function CategoryIcon({ category }) {
  return <span className="category-icon"><Icon as={categories[category].icon} /></span>;
}

export function dateText(date) {
  return `${Number(date.slice(5, 7))} 月 ${Number(date.slice(8))} 日`;
}

export function weekdayText(date) {
  return `周${'日一二三四五六'[weekday(date)]}`;
}

export function useReveal() {
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);
  return useCallback((element, focusField = false) => {
    const current = ++request.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(async () => {
      if (focusField && !reduced) {
        // 等上一张卡收起后再计算位置，否则滚动目标会随着布局上移。
        const list = element?.closest('.entry-group')?.parentElement;
        const transitions = list?.getAnimations({ subtree: true })
          .filter((motion) => motion.transitionProperty === 'grid-template-rows') ?? [];
        await Promise.allSettled(transitions.map((motion) => motion.finished));
      }
      if (current !== request.current || !element?.isConnected || element.closest('[hidden]')) return;
      if (focusField && element.dataset.open !== 'true') return;
      if (focusField) element.querySelector('[data-entry-field]:not(:disabled)')?.focus({ preventScroll: true });
      const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
      const top = scrollY + element.getBoundingClientRect().top - margin;
      window.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
    });
  }, []);
}

export function Sheet({ title, children, onClose, busy = false, center = false }) {
  const ref = useRef(null);
  const heading = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return <dialog ref={ref} aria-labelledby={heading} className={center ? 'sheet centered' : 'sheet'}
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="sheet-body">
      {!center && <div className="sheet-handle" aria-hidden="true" />}
      <div className="section-heading">
        <h2 id={heading}>{title}</h2>
        <button type="button" className="icon-button" aria-label="关闭" disabled={busy} onClick={onClose}><Icon as={X} /></button>
      </div>
      {children}
    </div>
  </dialog>;
}

export function DatePicker({ date, today, onChoose, jump = false }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(date);
  const id = useId();
  const label = jump ? '跳到日期' : '记录日期';
  return <>
    <button type="button" aria-label={jump ? label : `${label}，${dateText(date)} ${weekdayText(date)}`}
      aria-haspopup="dialog" className={jump ? 'icon-button' : 'date-button'}
      onClick={() => { setSelected(date); setOpen(true); }}>
      <Icon as={CalendarDays} />
      {!jump && <><time dateTime={date}>{dateText(date)} <span>{weekdayText(date)}</span></time>
        {date === today && <span className="today-pill">今天</span>}<Icon as={ChevronDown} /></>}
    </button>
    {open && <Sheet title={label} onClose={() => setOpen(false)}>
      <form className="record-form" onSubmit={(event) => {
        event.preventDefault();
        if (!isRecordDate(selected, today)) return;
        setOpen(false);
        onChoose(selected);
      }}>
        <label htmlFor={id}>选择日期<input id={id} type="date" min="0001-01-01" max={today}
          required value={selected} onChange={(event) => setSelected(event.target.value)} /></label>
        <button type="submit" className="primary" disabled={!isRecordDate(selected, today)}>确定</button>
      </form>
    </Sheet>}
  </>;
}

export function Collapse({ id, open, children }) {
  return <div className="collapse" id={id} data-open={open} inert={!open}>
    <div className="collapse-clip">{children}</div>
  </div>;
}

export function TimeBar({ records, total, daily = false }) {
  const parts = categoryIds.map((id) => ({
    id, minutes: records.reduce((sum, item) => sum + (item.category === id ? item.minutes : 0), 0),
  })).filter(({ minutes }) => minutes > 0);
  const scale = daily ? Math.max(1440, total) : total;
  return <div className={daily ? 'time-bar time-bar-daily' : 'time-bar'}
    role="img" aria-label={parts.length ? parts.map(({ id, minutes }) => `${categories[id].label} ${formatDuration(minutes)}`).join('，') : '暂无用时'}>
    {parts.map(({ id, minutes }) => <span key={id} title={`${categories[id].label} ${formatDuration(minutes)}`}
      style={{ ...categoryStyle(id), width: `${100 * minutes / scale}%` }} />)}
  </div>;
}
