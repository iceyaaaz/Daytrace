import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '../components/DiaryUI.jsx';
import { categories, categoryStyle } from '../domain/categories.js';
import { defaultTheme, enabledThemes, resolveMode } from './index.js';

const BeastHero = lazy(() => import('./BeastHero.jsx'));
const samples = ['idea', 'book', 'skill'];

export function ThemeHero({ theme }) {
  return theme.id === 'beast' && <Suspense fallback={null}><BeastHero /></Suspense>;
}

function MiniToday({ theme, mode, compact }) {
  return <div className="theme-mini" data-theme={theme.id} data-mode={mode} aria-hidden="true">
    {theme.kind === 'style' ? <div className="theme-mini-hero"><ThemeHero theme={theme} /></div>
      : <div className="theme-mini-band" />}
    {!compact && <strong>今天</strong>}
    <div className="theme-mini-rows">
      {samples.map((id) => <div className="theme-mini-row" key={id} style={categoryStyle(id)}>
        <span className="v1-category-icon"><Icon as={categories[id].icon} /></span>
        {!compact && <span>{categories[id].label}</span>}
      </div>)}
    </div>
  </div>;
}

export function ThemePicker({ appearance }) {
  return <div className="theme-picker">
    <h1>主题</h1>
    {[['style', '风格'], ['solid', '纯色']].map(([kind, label]) => <section key={kind}>
      <h2>{label}</h2>
      <div className="theme-grid">
        {enabledThemes.filter((theme) => theme.kind === kind).map((theme) => {
          const selected = appearance.theme.id === theme.id;
          return <button type="button" className="theme-tile" key={theme.id} aria-pressed={selected}
            onClick={() => appearance.setTheme(theme)}>
            <MiniToday theme={theme} mode={resolveMode(theme, appearance.preference, appearance.systemDark)} compact />
            <span>{theme.name}</span>
            <span className="theme-check" aria-hidden="true">{selected && <Icon as={Check} />}</span>
          </button>;
        })}
      </div>
    </section>)}
  </div>;
}

export function Welcome({ appearance }) {
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const strip = useRef(null);
  const timer = useRef(null);
  const active = enabledThemes[index];
  const setPreview = appearance.setPreview;

  useLayoutEffect(() => { setPreview(active); }, [active, setPreview]);
  useEffect(() => () => { clearTimeout(timer.current); setPreview(null); }, [setPreview]);

  function select(next) {
    const bounded = Math.max(0, Math.min(enabledThemes.length - 1, next));
    const target = strip.current.children[bounded];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.current.scrollTo({ left: target.offsetLeft - (strip.current.clientWidth - target.offsetWidth) / 2,
      behavior: reduced ? 'instant' : 'smooth' });

  }

  function onScroll() {
    const track = strip.current;
    const center = track.scrollLeft + track.clientWidth / 2;
    const nearest = [...track.children].reduce((best, child, i) => {
      const distance = Math.abs(child.offsetLeft + child.offsetWidth / 2 - center);
      return distance < best.distance ? { i, distance } : best;
    }, { i: 0, distance: Infinity });
    setIndex(nearest.i);
  }

  function finish(theme) {
    if (finishing) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      appearance.finishWelcome(theme);
      return;
    }
    setFinishing(true);
    const duration = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--welcome-fade'));
    timer.current = setTimeout(() => appearance.finishWelcome(theme), duration);
  }

  return <main className="theme-welcome" data-finishing={finishing} inert={finishing}
    onKeyDown={(event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      select(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }}>
    <header><h1>选一个你喜欢的风格</h1><p>之后可以在设置里随时更换</p></header>
    <div className="theme-strip" ref={strip} onScroll={onScroll} role="group" aria-label="主题预览">
      {enabledThemes.map((theme, position) => <button type="button" className="theme-slide" key={theme.id}
        aria-current={position === index ? 'true' : undefined} onClick={() => select(position)}>
        <MiniToday theme={theme} mode={resolveMode(theme, 'system', appearance.systemDark)} />
        <span className="theme-slide-name">{theme.name}</span><span className="theme-mood">{theme.mood}</span>
      </button>)}
    </div>
    <div className="theme-pagination">
      <button type="button" className="v1-icon" aria-label="上一个主题" disabled={index === 0} onClick={() => select(index - 1)}><Icon as={ChevronLeft} /></button>
      <span aria-live="polite">{index + 1} / {enabledThemes.length}</span>
      <button type="button" className="v1-icon" aria-label="下一个主题" disabled={index === enabledThemes.length - 1} onClick={() => select(index + 1)}><Icon as={ChevronRight} /></button>
    </div>
    <div className="theme-welcome-actions">
      <button type="button" className="primary" onClick={() => finish(active)}>就用这个</button>
      <button type="button" className="v1-text" onClick={() => finish(defaultTheme)}>先用默认的</button>
    </div>
  </main>;
}
