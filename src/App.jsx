import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChartNoAxesColumn, Check, SquarePen } from 'lucide-react';
import { Icon } from './components/DiaryUI.jsx';
import { Feedback, QueryState } from './components/Feedback.jsx';
import { useQuery } from './components/useQuery.js';
import { createRepository } from './data/repository.js';
import { supabase } from './data/supabase.js';
import { localDate } from './domain/dates.js';
import { tagName } from './domain/records.js';
import { toastAfterUndo } from './domain/todayFlow.js';
import { History } from './pages/History.jsx';
import { Settings } from './pages/Settings.jsx';
import { Review } from './pages/Review.jsx';
import { Today } from './pages/Today.jsx';

const tabs = [['today', '今日', SquarePen], ['history', '历史', CalendarDays], ['review', '回顾', ChartNoAxesColumn]];

function applyTheme(theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.effectiveTheme = theme === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
  for (const meta of document.querySelectorAll('meta[data-theme-color]')) {
    const mode = meta.dataset.themeColor;
    meta.media = theme === 'system' ? `(prefers-color-scheme: ${mode})` : theme === mode ? 'all' : 'not all';
  }
}

function Login({ client }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!client || pending) return;
    setError('');
    setPending(true);
    try {
      const result = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
    } catch {
      setError('邮箱或密码不正确');
    } finally {
      setPending(false);
    }
  }

  return <main className="login-layout">
    <section className="card login-card">
      <span className="brand-mark" aria-hidden="true">日</span>
      <h1>日迹</h1>
      <p className="muted">时间与成长记录</p>
      <form className="record-form" onSubmit={submit}>
        <label htmlFor="email">邮箱
          <input id="email" type="email" autoComplete="username" required value={email}
            onChange={(event) => setEmail(event.target.value)} disabled={pending} />
        </label>
        <label htmlFor="password">密码
          <input id="password" type="password" autoComplete="current-password" required value={password}
            onChange={(event) => setPassword(event.target.value)} disabled={pending} />
        </label>
        <button className="primary" type="submit" disabled={!client || pending}>{pending ? '正在登录…' : '登录'}</button>
        <Feedback error={error} />
      </form>
      {!client && <p className="notice" role="status">还没有连接 Supabase。请按 README 设置项目网址和公开密钥，再重启本地网页。</p>}
    </section>
  </main>;
}

function Diary({ client }) {
  const repository = useMemo(() => createRepository(client), [client]);
  const [page, setPage] = useState('today');
  const [today, setToday] = useState(() => localDate());
  const [version, setVersion] = useState(0);
  const [tagVersion, setTagVersion] = useState(0);
  const [historyVisited, setHistoryVisited] = useState(false);
  const [reviewVisited, setReviewVisited] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'system');
  const [todayTitle, setTodayTitle] = useState('今天');
  const [scrolled, setScrolled] = useState(false);
  const positions = useRef({});
  const content = useRef(null);
  const bar = useRef(null);
  const [toast, setToast] = useState(null);
  const [undoBusy, setUndoBusy] = useState(false);
  const undoLock = useRef(false);
  const tagQuery = useQuery(repository.listTags, tagVersion);

  useEffect(() => {
    const update = () => setToday(localDate());
    const timer = window.setInterval(update, 15_000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast((current) => current === toast ? null : current), toast.duration);
    return () => clearTimeout(timer);
  }, [toast]);

  function updateTheme(value) {
    applyTheme(value);
    try { localStorage.setItem('daytrace-theme', value); } catch { /* 本次会话仍生效 */ }
    setTheme(value);
  }

  function navigate(next) {
    if (next === page) return;
    positions.current[page] = window.scrollY;
    setPage(next);
    if (next === 'history') setHistoryVisited(true);
    if (next === 'review') setReviewVisited(true);
  }

  useLayoutEffect(() => {
    window.scrollTo({ top: page === 'settings' ? 0 : positions.current[page] ?? 0, behavior: 'instant' });
    function update() {
      const heading = content.current?.querySelector('[data-active="true"] h1');
      setScrolled(Boolean(heading && bar.current && heading.getBoundingClientRect().bottom <= bar.current.getBoundingClientRect().bottom));
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [page, todayTitle]);

  function notify(message, recordId) {
    setToast({ message, recordId, duration: 4000 });
  }

  function onChange(message, recordId) {
    setVersion((value) => value + 1);
    notify(message, recordId);
  }

  async function undo() {
    if (!toast?.recordId || undoLock.current) return;
    undoLock.current = true;
    setUndoBusy(true);
    try {
      await repository.deleteRecord(toast.recordId);
      setVersion((value) => value + 1);
      setToast((current) => toastAfterUndo(current, toast));
    } catch {
      setToast((current) => current === toast
        ? { ...toast, message: '撤销失败，请检查网络后重试', error: true }
        : current);
    } finally {
      undoLock.current = false;
      setUndoBusy(false);
    }
  }

  async function createTag(category, value) {
    const name = tagName(value);
    try {
      const tag = await repository.createTag(category, name);
      setTagVersion((count) => count + 1);
      return tag;
    } catch (problem) {
      if (problem.code === '23505') throw new Error('该标签已存在');
      throw new Error('创建标签失败，请检查网络后重试。');
    }
  }

  async function removeTag(id) {
    try {
      await repository.deleteTag(id);
      setTagVersion((count) => count + 1);
    } catch {
      throw new Error('删除标签失败，请检查网络后重试。');
    }
  }

  const signOut = useCallback(async () => {
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }, [client]);

  const props = { today, repository, tags: tagQuery.data ?? [], createTag, version, onChange, notify, navigate };
  const title = page === 'today' ? todayTitle : page === 'history' ? '历史' : '回顾';
  return <>
    {page !== 'settings' && <div className="v1-small-bar" ref={bar} data-visible={scrolled} aria-hidden="true">{title}</div>}
    <main className="shell v1-main" ref={content} data-settings={page === 'settings'}>
      {['today', 'history'].includes(page) && tagQuery.status === 'error' &&
        <QueryState query={tagQuery} message="读取标签失败，请检查网络后重试。" />}
      <div hidden={page !== 'today'} data-active={page === 'today'}><Today {...props} onTitle={setTodayTitle} /></div>
      {historyVisited && <div className="v1-history-shell" hidden={page !== 'history'} data-active={page === 'history'}><History {...props} /></div>}
      {reviewVisited && <div className="v1-review-shell" hidden={page !== 'review'} data-active={page === 'review'}><Review {...props} /></div>}
      {page === 'settings' && <Settings repository={repository} tagQuery={tagQuery} createTag={createTag} removeTag={removeTag}
        signOut={signOut} theme={theme} setTheme={updateTheme} onBack={() => navigate('today')} />}
    </main>
    {page !== 'settings' && <nav className="v1-nav" aria-label="主导航"><div className="shell">
      {tabs.map(([id, label, graphic]) => <button key={id} type="button" aria-current={page === id ? 'page' : undefined}
        onClick={() => navigate(id)}><Icon as={graphic} /><span>{label}</span></button>)}
    </div></nav>}
    <div className="v1-toast-region shell" aria-live="polite">
      {toast && <div className={toast.error ? 'v1-toast v1-error' : 'v1-toast'}>
        {!toast.error && <Icon as={Check} />}<span>{toast.message}</span>
        {toast.recordId && <button type="button" className="v1-text" onClick={undo} disabled={undoBusy}>撤销</button>}
      </div>}
    </div>
  </>;
}

export default function App() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const sync = () => applyTheme(document.documentElement.dataset.theme ?? 'system');
    const keyboard = (event) => {
      if (event.key === 'Tab') document.documentElement.dataset.v1Keyboard = 'true';
    };
    const pointer = () => delete document.documentElement.dataset.v1Keyboard;
    media.addEventListener('change', sync);
    window.addEventListener('keydown', keyboard, true);
    window.addEventListener('pointerdown', pointer, true);
    return () => {
      media.removeEventListener('change', sync);
      window.removeEventListener('keydown', keyboard, true);
      window.removeEventListener('pointerdown', pointer, true);
    };
  }, []);
  useEffect(() => {
    if (!supabase) return undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, current) => setSession(current));
    return () => subscription.unsubscribe();
  }, []);
  if (!supabase || session === null) return <Login client={supabase} />;
  if (session === undefined) return <main className="login-layout"><p role="status">正在检查登录状态…</p></main>;
  return <Diary key={session.user.id} client={supabase} />;
}
