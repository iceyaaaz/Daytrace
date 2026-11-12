import { useState } from 'react';
import { categories, durationText } from '../domain/records.js';
import { Feedback } from './Feedback.jsx';
import { RecordForm } from './RecordForm.jsx';

export function RecordList({ records, repository, tags, createTag, onChange, showCategory = false }) {
  const [editing, setEditing] = useState('');
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function remove(id) {
    setError('');
    setDeleting(true);
    try {
      await repository.deleteRecord(id);
      setConfirm('');
      onChange('已删除记录');
    } catch {
      setError('删除失败，请检查网络后重试。');
    } finally {
      setDeleting(false);
    }
  }

  return <ul className="records">
    {records.map((record) => (
      <li key={record.id} className="record">
        {editing === record.id ? (
          <RecordForm category={record.category} record={record} date={record.record_date}
            repository={repository} tags={tags} createTag={createTag}
            onSaved={() => { setEditing(''); onChange('已更新记录'); }} onCancel={() => setEditing('')} />
        ) : <>
          <div className="record-meta">
            {showCategory && <strong>{categories[record.category].label}</strong>}
            <span>{durationText(record.minutes)}</span>
            {record.tags.map((tag) => <span key={tag} className="pill">{tag}</span>)}
          </div>
          {record.content && <p className="record-text">{record.content}</p>}
          {record.gain && <p className="record-text muted">{categories[record.category].gain} · {record.gain}</p>}
          <div className="actions compact">
            <button type="button" onClick={() => { setEditing(record.id); setConfirm(''); }} disabled={deleting}>编辑</button>
            <button type="button" onClick={() => { setConfirm(record.id); setError(''); }} disabled={deleting}>删除</button>
          </div>
          {confirm === record.id && <div className="notice error" role="group" aria-label="确认删除记录">
            <p>确定删除这条记录吗？</p>
            <div className="actions">
              <button type="button" className="danger" disabled={deleting} onClick={() => remove(record.id)}>
                {deleting ? '正在删除…' : '确认删除'}
              </button>
              <button type="button" disabled={deleting} onClick={() => setConfirm('')}>取消</button>
            </div>
            <Feedback error={error} />
          </div>}
        </>}
      </li>
    ))}
  </ul>;
}
