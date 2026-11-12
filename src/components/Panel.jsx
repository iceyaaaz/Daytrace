import { useId, useLayoutEffect, useRef, useState } from 'react';

export function Panel({ title, children, footer, submit, onDismiss, busy = false, autofocus = false, menu = false }) {
  const ref = useRef(null);
  const scroll = useRef(null);
  const gesture = useRef(null);
  const heading = useId();
  const [closing, setClosing] = useState(false);
  const finish = useRef(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    const viewport = window.visualViewport;
    const previousOverflow = document.body.style.overflow;
    function measure() {
      if (!viewport) return;
      const occluded = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      dialog.style.setProperty('--viewport-bottom', `${occluded}px`);
      dialog.style.setProperty('--viewport-height', `${viewport.height}px`);
      dialog.dataset.keyboard = String(window.innerHeight - viewport.height > 120);
      const field = document.activeElement;
      if (!scroll.current?.contains(field) || !field.matches('input,textarea,select')) return;
      const area = scroll.current.getBoundingClientRect();
      const box = field.getBoundingClientRect();
      if (box.top < area.top) scroll.current.scrollTop += box.top - area.top;
      else if (box.bottom > area.bottom) scroll.current.scrollTop += Math.min(box.bottom - area.bottom, box.top - area.top);
    }
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    if (autofocus) dialog.querySelector('textarea, input')?.focus({ preventScroll: true });
    measure();
    viewport?.addEventListener('resize', measure);
    viewport?.addEventListener('scroll', measure);
    dialog.addEventListener('focusin', measure);
    return () => {
      viewport?.removeEventListener('resize', measure);
      viewport?.removeEventListener('scroll', measure);
      dialog.removeEventListener('focusin', measure);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [autofocus]);

  useLayoutEffect(() => {
    if (!closing) return undefined;
    const dialog = ref.current;
    const complete = () => { const callback = finish.current; finish.current = null; callback?.(); };
    const duration = Number.parseFloat(getComputedStyle(dialog).getPropertyValue('--v-panel-motion'));
    if (!duration) { complete(); return undefined; }
    const timer = setTimeout(complete, duration + 40);
    const ended = (event) => { if (event.target === dialog && event.animationName === 'v1-panel-out') complete(); };
    dialog.addEventListener('animationend', ended);
    return () => { clearTimeout(timer); dialog.removeEventListener('animationend', ended); };
  }, [closing]);

  function close(callback) {
    if (closing || finish.current) return;
    finish.current = callback;
    setClosing(true);
  }
  function dismiss() {
    if (!busy && !closing) onDismiss(close);
  }

  return <dialog ref={ref} className={menu ? 'v1-dialog v1-menu' : 'v1-dialog'} aria-modal="true"
    aria-labelledby={heading} data-closing={closing} onCancel={(event) => { event.preventDefault(); dismiss(); }}
    onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
    <div className="v1-panel" inert={closing}>
      <div className="v1-panel-head">
        {!menu && <div className="v1-grab-area" aria-hidden="true"
          onPointerDown={(event) => {
            if (busy || closing || !event.isPrimary) return;
            gesture.current = event.clientY;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (gesture.current !== null) ref.current.style.setProperty('--drag-y', `${Math.max(0, event.clientY - gesture.current)}px`);
          }}
          onPointerUp={(event) => {
            const distance = gesture.current === null ? 0 : event.clientY - gesture.current;
            gesture.current = null;
            ref.current.style.removeProperty('--drag-y');
            if (distance >= 55) dismiss();
          }}
          onPointerCancel={() => { gesture.current = null; ref.current.style.removeProperty('--drag-y'); }}>
          <span className="v1-grabber" />
        </div>}
        <div className={menu ? 'v1-menu-heading' : 'v1-panel-title'}>
          {!menu && <button type="button" className="v1-text" disabled={busy || closing} onClick={dismiss}>取消</button>}
          <h2 id={heading}>{title}</h2>
          {!menu && <span>{submit}</span>}
        </div>
      </div>
      <div className="v1-panel-scroll" ref={scroll}>{typeof children === 'function' ? children(close) : children}</div>
      {footer && <div className="v1-panel-footer">{footer}</div>}
    </div>
  </dialog>;
}

export function ActionMenu({ title, options, cancel = '取消', onCancel, busy = false, error }) {
  return <Panel title={title} menu busy={busy} onDismiss={(close) => close(onCancel)}>
    <div className="v1-menu-options">
      <div className="v1-group">
        {options.map(({ label, danger, action, selected }) => <button type="button" key={label}
          className={danger ? 'v1-row v1-danger' : 'v1-row'} disabled={busy}
          aria-pressed={selected} onClick={action}>{label}{selected && <span aria-hidden="true">✓</span>}</button>)}
      </div>
      {error && <p className="v1-error" role="alert">{error}</p>}
      <button type="button" className="v1-group v1-row v1-text" disabled={busy} onClick={onCancel}>{cancel}</button>
    </div>
  </Panel>;
}
