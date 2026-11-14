import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { categories } from '../domain/categories.js';
import { formatMonthDay, weekday } from '../domain/dates.js';

export function Icon({ as: Graphic, className, ...props }) {
  return <Graphic className={className} strokeWidth={1.75} aria-hidden="true" {...props} />;
}

export function CategoryIcon({ category }) {
  return <span className="category-icon"><Icon as={categories[category].icon} /></span>;
}

export const dateText = formatMonthDay;

export function weekdayText(date) {
  return `周${'日一二三四五六'[weekday(date)]}`;
}

export function useReveal() {
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);
  return useCallback((element, focusField = false) => {
    const current = ++request.current;
    const reduced = document.documentElement.dataset.motion === 'off';
    requestAnimationFrame(async () => {
      if (focusField && !reduced) {
        // 等展开内容淡入后再移入焦点。
        const list = element?.closest('.entry-group')?.parentElement;
        const transitions = list?.getAnimations({ subtree: true })
          .filter((motion) => motion.animationName === 'x1-fade-in') ?? [];
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

export function Collapse({ id, open, children }) {
  return <div className="collapse" id={id} data-open={open} inert={!open}>
    <div className="collapse-clip">{children}</div>
  </div>;
}
