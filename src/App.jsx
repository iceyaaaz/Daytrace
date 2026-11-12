import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, BookOpen, CalendarDays, Check, NotebookPen, Settings as SettingsIcon } from 'lucide-react';
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
import { Stats, Weekly } from './pages/Stats.jsx';
import { Today } from './pages/Today.jsx';

const tabs = [['today', '今日', NotebookPen], ['history', '历史', BookOpen], ['stats', '统计', BarChart3], ['weekly', '周报', CalendarDays]];

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
      <span className="brand-mark" aria-hidden="true">养</span>
      <h1>养己</h1>
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

  function navigate(next) {
    setPage(next);
    if (next === 'history') setHistoryVisited(true);
    window.scrollTo(0, 0);
  }

  function notify(message, recordId) {
    setToast({ message, recordId, duration: 5000 });
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
  return <>
    <header className="topbar">
      <div className="shell">
        <div className="brand"><span className="brand-mark" aria-hidden="true">养</span><strong>养己</strong></div>
        <button type="button" className="icon-button" aria-label="设置" aria-current={page === 'settings' ? 'page' : undefined}
          onClick={() => navigate('settings')}><Icon as={SettingsIcon} /></button>
      </div>
    </header>
    <main className="shell main-content">
      {['today', 'history'].includes(page) && tagQuery.status === 'error' &&
        <QueryState query={tagQuery} message="读取标签失败，请检查网络后重试。" />}
      <div hidden={page !== 'today'}><Today {...props} active={page === 'today'} /></div>
      {historyVisited && <div hidden={page !== 'history'}><History {...props} /></div>}
      {page === 'stats' && <Stats {...props} />}
      {page === 'weekly' && <Weekly {...props} />}
      {page === 'settings' && <Settings repository={repository} tagQuery={tagQuery} createTag={createTag} removeTag={removeTag} signOut={signOut} />}
    </main>
    <nav className="bottom-nav" aria-label="主导航"><div className="shell">
      {tabs.map(([id, label, graphic]) => <button key={id} type="button" aria-current={page === id ? 'page' : undefined}
        onClick={() => navigate(id)}><Icon as={graphic} /><span>{label}</span></button>)}
    </div></nav>
    <div className="toast-region shell" aria-live="polite">
      {toast && <div className={toast.error ? 'toast notice error' : 'toast'}>
        {!toast.error && <Icon as={Check} />}<span>{toast.message}</span>
        {toast.recordId && <button type="button" className="text-button" onClick={undo} disabled={undoBusy}>撤销</button>}
      </div>}
    </div>
  </>;
}

export default function App() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    if (!supabase) return undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, current) => setSession(current));
    return () => subscription.unsubscribe();
  }, []);
  if (!supabase || session === null) return <Login client={supabase} />;
  if (session === undefined) return <main className="login-layout"><p role="status">正在检查登录状态…</p></main>;
  return <Diary key={session.user.id} client={supabase} />;
}
