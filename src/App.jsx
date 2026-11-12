import { useCallback, useEffect, useMemo, useState } from 'react';
import { Feedback, QueryState } from './components/Feedback.jsx';
import { useQuery } from './components/useQuery.js';
import { createRepository } from './data/repository.js';
import { supabase } from './data/supabase.js';
import { localDate } from './domain/dates.js';
import { tagName } from './domain/records.js';
import { History } from './pages/History.jsx';
import { Settings } from './pages/Settings.jsx';
import { Stats, Weekly } from './pages/Stats.jsx';
import { Today } from './pages/Today.jsx';

const tabs = [['today', '今日'], ['history', '历史'], ['stats', '统计'], ['weekly', '周报']];

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
      <span className="brand-mark" aria-hidden="true">记</span>
      <h1>成长日记</h1>
      <p className="muted">记录时间，也记下今天的想法。</p>
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
  const [message, setMessage] = useState('');
  const tagQuery = useQuery(repository.listTags, tagVersion);

  useEffect(() => {
    const update = () => setToday(localDate());
    const timer = window.setInterval(update, 15_000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);

  function navigate(next) {
    setPage(next);
    setMessage('');
    window.scrollTo(0, 0);
  }

  function onChange(status) {
    setVersion((value) => value + 1);
    setMessage(status);
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

  const props = { today, repository, tags: tagQuery.data ?? [], createTag, version, onChange };
  return <>
    <header className="topbar">
      <div className="shell">
        <div className="brand"><span className="brand-mark" aria-hidden="true">记</span><strong>成长日记</strong></div>
        <button type="button" aria-current={page === 'settings' ? 'page' : undefined} onClick={() => navigate('settings')}>设置</button>
      </div>
    </header>
    <main className="shell main-content">
      <div className="global-feedback" role="status">{message}</div>
      {['today', 'history'].includes(page) && tagQuery.status === 'error' &&
        <QueryState query={tagQuery} message="读取标签失败，请检查网络后重试。" />}
      {page === 'today' && <Today {...props} />}
      {page === 'history' && <History {...props} />}
      {page === 'stats' && <Stats {...props} />}
      {page === 'weekly' && <Weekly {...props} />}
      {page === 'settings' && <Settings repository={repository} tagQuery={tagQuery} createTag={createTag} removeTag={removeTag} signOut={signOut} />}
    </main>
    <nav className="bottom-nav" aria-label="主导航"><div className="shell">
      {tabs.map(([id, label]) => <button key={id} type="button" aria-current={page === id ? 'page' : undefined}
        onClick={() => navigate(id)}>{label}</button>)}
    </div></nav>
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
