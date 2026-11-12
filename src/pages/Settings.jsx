import { useEffect, useRef, useState } from 'react';
import { Feedback, QueryState } from '../components/Feedback.jsx';
import { categories, tagCategories } from '../domain/records.js';
import { csvFilename, recordsCsv } from '../domain/csv.js';

function TagGroup({ category, tags, createTag, removeTag }) {
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState('');

  async function mutate(action, success) {
    if (pending) return;
    setPending(true);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(success);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setPending(false);
    }
  }

  return <section className="card" aria-label={`${categories[category].label}标签`}>
    <h2>{categories[category].label} · {categories[category].tags}</h2>
    <form className="tag-form" onSubmit={(event) => {
      event.preventDefault();
      mutate(async () => { await createTag(category, name); setName(''); }, '已新增标签');
    }}>
      <label htmlFor={`setting-${category}`}>新标签名称</label>
      <div className="inline-fields">
        <input id={`setting-${category}`} value={name} onChange={(event) => setName(event.target.value)} disabled={pending} />
        <button className="primary" type="submit" disabled={pending}>新增</button>
      </div>
    </form>
    {tags.length === 0 && <p className="muted">暂无标签。</p>}
    <ul className="tag-list">{tags.map((tag) => <li key={tag.id}>
      <span>{tag.name}</span>
      {confirm === tag.id ? <div className="actions">
        <button type="button" className="danger" disabled={pending} aria-label={`确认删除标签 ${tag.name}`}
          onClick={() => mutate(async () => { await removeTag(tag.id); setConfirm(''); }, '已删除标签选项')}>确认删除</button>
        <button type="button" disabled={pending} onClick={() => setConfirm('')}>取消</button>
      </div> : <button type="button" disabled={pending} aria-label={`删除标签 ${tag.name}`} onClick={() => setConfirm(tag.id)}>删除</button>}
    </li>)}</ul>
    <Feedback error={error} message={message} />
  </section>;
}

function ExportCard({ repository }) {
  const request = useRef(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => () => request.current?.abort(), []);

  async function exportRecords() {
    if (request.current) return;
    setError('');
    setMessage('');
    if (!navigator.onLine) {
      setError('当前无网络，无法导出。请联网后重试。');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    try {
      const records = await repository.listRecords({}, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(new Blob([recordsCsv(records)], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = csvFilename();
      document.body.append(link);
      link.click();
      link.remove();
      // 给 Safari 留出读取下载内容的时间。
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setMessage(`已生成 CSV，共 ${records.length} 条记录。`);
    } catch {
      if (!controller.signal.aborted) setError('导出失败，请检查网络或登录状态后重试。');
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return <section className="card">
    <h2>数据备份</h2>
    <p className="muted">下载全部日记记录，文件可以用 Excel 打开。</p>
    <button className="primary" type="button" onClick={exportRecords} disabled={pending}>
      {pending ? '正在导出…' : '导出全部数据'}
    </button>
    <Feedback error={error} message={message} />
  </section>;
}

export function Settings({ repository, tagQuery, createTag, removeTag, signOut }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return <div className="page">
    <div className="page-heading"><div><h1>设置</h1><p className="muted">管理标签和登录状态。</p></div></div>
    <p className="notice">删除标签选项后，历史记录和统计仍会保留该标签。</p>
    {tagQuery.status !== 'ready' && <QueryState query={tagQuery} message="读取标签失败，请检查网络后重试。" />}
    {tagCategories.map((category) => (
      <TagGroup key={category} category={category} tags={(tagQuery.data ?? []).filter((tag) => tag.category === category)}
        createTag={createTag} removeTag={removeTag} />
    ))}
    <ExportCard repository={repository} />
    <section className="card">
      <h2>账号</h2>
      <button type="button" disabled={pending} onClick={async () => {
        setError('');
        setPending(true);
        try { await signOut(); }
        catch { setError('退出失败，请检查网络后重试。'); }
        finally { setPending(false); }
      }}>{pending ? '正在退出…' : '退出登录'}</button>
      <Feedback error={error} />
    </section>
  </div>;
}
