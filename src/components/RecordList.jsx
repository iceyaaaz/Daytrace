import { useState } from 'react';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { categories, categoryStyle } from '../domain/categories.js';
import { formatDuration } from '../domain/records.js';
import { Icon, Sheet } from './DiaryUI.jsx';
import { Feedback } from './Feedback.jsx';
import { RecordForm } from './RecordForm.jsx';

function RecordRow({ record, repository, tags, createTag, onChange }) {
  const [mode, setMode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fields = categories[record.category];
  const close = () => { setError(''); setMode(''); };
  async function remove() {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await repository.deleteRecord(record.id);
      close();
      onChange('已删除');
    } catch {
      setError('删除失败，请检查网络后重试。');
    } finally {
      setBusy(false);
    }
  }

  return <li className="history-record" style={categoryStyle(record.category)}>
    <div className="record-top">
      <div className="record-chips">
        <span className="category-chip"><Icon as={fields.icon} />{fields.label}</span>
        {record.tags.map((tag) => <span key={tag} className="history-tag">{tag}</span>)}
      </div>
      <span className="record-duration">{formatDuration(record.minutes)}</span>
      <button type="button" className="icon-button more-button" aria-label="更多操作" aria-haspopup="dialog"
        onClick={() => setMode('menu')}><Icon as={Ellipsis} /></button>
    </div>
    {record.content && <p className="record-text">{record.content}</p>}
    {record.gain && <div className="record-gain">
      <p>{fields.gain}</p><div className="record-text">{record.gain}</div>
    </div>}
    {mode === 'menu' && <Sheet title="记录操作" onClose={close}>
      <div className="sheet-menu">
        <button type="button" className="text-button left-button" onClick={() => setMode('edit')}>
          <Icon as={Pencil} />编辑</button>
        <button type="button" className="text-button danger-text left-button" onClick={() => setMode('delete')}>
          <Icon as={Trash2} />删除</button>
      </div>
    </Sheet>}
    {mode === 'edit' && <Sheet title="编辑记录" onClose={close} busy={busy}>
      <RecordForm key={record.id} record={record} category={record.category} date={record.record_date}
        repository={repository} tags={tags} createTag={createTag} onPending={setBusy}
        onSaved={() => { close(); onChange('已更新'); }} />
    </Sheet>}
    {mode === 'delete' && <Sheet title="删除这条记录？" onClose={close} busy={busy} center>
      <p>删除后无法恢复。</p>
      <Feedback error={error} />
      <div className="confirm-actions">
        <button type="button" disabled={busy} onClick={close}>取消</button>
        <button type="button" className="danger" disabled={busy} onClick={remove}>{busy ? '正在删除…' : '删除'}</button>
      </div>
    </Sheet>}
  </li>;
}

export function RecordList({ records, ...props }) {
  return <ul className="records">{records.map((record) => <RecordRow key={record.id} record={record} {...props} />)}</ul>;
}
