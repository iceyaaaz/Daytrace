import { ThemePicker } from '../themes/ThemeViews.jsx';
import { modeLabels } from '../themes/index.js';
import { useEffect, useId, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Icon } from '../components/DiaryUI.jsx';
import { ActionMenu, Panel } from '../components/Panel.jsx';
import { Feedback, QueryState } from '../components/Feedback.jsx';
import { categories, tagCategories } from '../domain/records.js';
import { csvFilename, recordsCsv } from '../domain/csv.js';
import { version as appVersion } from '../../package.json';

function Group({ label, children }) {
  return <section className="v1-settings-section"><h2>{label}</h2><div className="v1-group">{children}</div></section>;
}

function Row({ children, value, onClick, disabled }) {
  return <button type="button" className="v1-row" onClick={onClick} disabled={disabled}>
    <span>{children}</span><span className="v1-row-end">{value}{!disabled && <Icon as={ChevronRight} />}</span>
  </button>;
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
      setMessage(`已生成 CSV，共${records.length}条记录。`);
    } catch {
      if (!controller.signal.aborted) setError('导出失败，请检查网络或登录状态后重试。');
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return <Group label="数据">
    <button className="v1-row" type="button" onClick={exportRecords} disabled={pending}>
      {pending ? '正在导出…' : '导出全部数据（CSV）'}
    </button>
    <Feedback error={error} message={message} />
  </Group>;
}

export function Settings({ repository, tagQuery, createTag, removeTag, signOut, appearance, onBack }) {
  const [themePage, setThemePage] = useState(false);
  const fixedMode = appearance.theme.modes.length === 1;
  const [tagsPage, setTagsPage] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const formId = useId();
  function open(next) { setName(''); setError(''); setDialog(next); }
  const close = () => setDialog(null);
  async function change(action, completed = close, failure) {
    if (pending) return;
    setPending(true);
    setError('');
    try { await action(); completed(); }
    catch (problem) { setError(failure ?? problem.message); }
    finally { setPending(false); }
  }

  return <div className="v1-settings v1-surface">
    <header className="v1-settings-head">
      <button type="button" className="v1-text" onClick={themePage ? () => setThemePage(false) : tagsPage ? () => setTagsPage(false) : onBack}>‹ {tagsPage || themePage ? '设置' : '今天'}</button>
      {!themePage && <h1>{tagsPage ? '标签管理' : '设置'}</h1>}
    </header>
    {themePage ? <ThemePicker appearance={appearance} /> : tagsPage ? <>
      {tagQuery.status === 'loading' && <div className="v1-group v1-tag-skeleton" role="status" aria-label="正在读取标签">
        <span className="v1-skeleton" aria-hidden="true" /><span className="v1-skeleton" aria-hidden="true" />
      </div>}
      {tagQuery.status === 'error' && <QueryState query={tagQuery} message="读取标签失败，请检查网络后重试。" />}
      {tagCategories.map((category) => <Group key={category} label={categories[category].label}>
        {(tagQuery.data ?? []).filter((tag) => tag.category === category).map((tag) =>
          <Row key={tag.id} onClick={() => open({ type: 'delete', tag })}>{tag.name}</Row>)}
        <button className="v1-row v1-text" type="button" onClick={() => open({ type: 'add', category })}>添加标签</button>
      </Group>)}
    </> : <>
      <Group label="外观">
        <Row value={<><span className="theme-dot" aria-hidden="true" />{appearance.theme.name}</>}
          onClick={() => { setThemePage(true); window.scrollTo(0, 0); }}>主题</Row>
        <Row disabled={fixedMode} value={fixedMode ? '该主题仅有' + modeLabels[appearance.mode] + '版本' : modeLabels[appearance.preference]}
          onClick={() => open({ type: 'mode' })}>明暗</Row>
      </Group>
      <Group label="内容"><Row onClick={() => { setTagsPage(true); window.scrollTo(0, 0); }}>标签管理</Row></Group>
      <ExportCard repository={repository} />
      <Group label="账号"><button className="v1-row v1-danger v1-centered" type="button" onClick={() => open({ type: 'logout' })}>退出登录</button></Group>
      <footer className="v1-settings-version">日迹 · 版本{appVersion}</footer>
    </>}
    {dialog?.type === 'mode' && <ActionMenu title="明暗" onCancel={close} options={Object.entries(modeLabels).map(([value, label]) => ({
      label, selected: appearance.preference === value, action: () => { appearance.setPreference(value); close(); },
    }))} />}
    {dialog?.type === 'delete' && <ActionMenu title={`删除「${dialog.tag.name}」？历史记录仍会保留这个标签。`}
      onCancel={close} busy={pending} error={error}
      options={[{ label: '删除标签', danger: true, action: () => change(() => removeTag(dialog.tag.id)) }]} />}
    {dialog?.type === 'logout' && <ActionMenu title="退出登录？" onCancel={close} busy={pending} error={error}
      options={[{ label: '退出登录', danger: true, action: () => change(signOut, close, '退出失败，请检查网络后重试。') }]} />}
    {dialog?.type === 'add' && <Panel title="添加标签" autofocus busy={pending} onDismiss={(dismiss) => dismiss(close)}
      submit={<button type="submit" className="v1-text" form={formId} disabled={pending || !name.trim()}>保存</button>}>
      {(dismiss) => <form id={formId} className="v1-group v1-date-form" onSubmit={(event) => {
        event.preventDefault();
        change(() => createTag(dialog.category, name), () => dismiss(close));
      }}>
        <label>标签名称<input value={name} onChange={(event) => setName(event.target.value)} disabled={pending} /></label>
        {error && <p className="v1-error" role="alert">{error}</p>}
      </form>}
    </Panel>}
  </div>;
}
