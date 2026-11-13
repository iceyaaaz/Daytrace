import { formatDuration } from '../domain/records.js';
import { useId, useRef, useState } from 'react';
import { ActionMenu, Panel } from './Panel.jsx';
import { dateText, weekdayText } from './DiaryUI.jsx';
import { RecordForm } from './RecordForm.jsx';
import { matchParts } from '../domain/history.js';
import { categories, categoryStyle } from '../domain/categories.js';

function Mark({ value, keyword }) {
  return matchParts(value, keyword).map((part, index) => index % 2
    ? <mark key={index}>{part}</mark> : part);
}

export function HistoryRecord({ record, keyword, revealed, onReveal, onEdit, onDelete }) {
  const fields = categories[record.category];
  const touch = useRef(null);
  const suppress = useRef(false);

  function finishSwipe(event) {
    if (!touch.current) return;
    const { x, y } = touch.current;
    touch.current = null;
    const horizontal = event.clientX - x;
    if (Math.abs(horizontal) < 44 || Math.abs(horizontal) < Math.abs(event.clientY - y)) return;
    suppress.current = true;
    onReveal(horizontal < 0 ? record.id : null);
  }

  return <div className="v2-history-record" data-revealed={revealed} style={categoryStyle(record.category)}>
    <div className="v2-swipe-actions" inert={!revealed}>
      <button type="button" onClick={onEdit}>编辑</button>
      <button type="button" onClick={onDelete}>删除</button>
    </div>
    <button type="button" className="v2-record-body"
      onPointerDown={(event) => {
        suppress.current = false;
        if (event.pointerType !== 'mouse') {
          touch.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => { touch.current = null; }} onPointerUp={finishSwipe}
      onClick={(event) => {
        if (event.detail && suppress.current) { suppress.current = false; return; }
        if (revealed) onReveal(null);
        else onEdit();
      }}>
      <span className="v2-record-meta">
        <span className="v2-dot" aria-hidden="true" />{fields.label}
        <span className="v2-subtle"> · {formatDuration(record.minutes)}</span>
      </span>
      {record.content && <span className="v2-record-content"><Mark value={record.content} keyword={keyword} /></span>}
      {record.gain && <span className="v2-record-gain"><span className="v2-subtle">{fields.gain}：</span><Mark value={record.gain} keyword={keyword} /></span>}
      {record.tags.length > 0 && <span className="v2-record-tags"><Mark value={record.tags.join(' · ')} keyword={keyword} /></span>}
    </button>
  </div>;
}

export function HistoryEditor({ record, deleting, repository, tags, createTag, onDone, onCancel }) {
  const form = useId();
  const [draft, setDraft] = useState(record);
  const [confirm, setConfirm] = useState(deleting ? 'delete' : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const dirty = ['category', 'content', 'gain', 'minutes', 'tags', 'tagInput']
    .some((key) => JSON.stringify(draft[key]) !== JSON.stringify(record[key]));

  function cancelConfirm() {
    setError('');
    if (deleting) onCancel();
    else setConfirm(null);
  }

  async function remove() {
    if (lock.current) return;
    lock.current = true;
    setError('');
    setBusy(true);
    try {
      await repository.deleteRecord(record.id);
      onDone('已删除');
    } catch {
      setError('删除失败，请检查网络后重试');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return <>
    {!deleting && <Panel title="编辑记录" busy={busy}
      submit={<button className="v1-text" type="submit" form={form} disabled={busy}>{busy ? '保存中…' : '保存'}</button>}
      onDismiss={(close) => dirty ? setConfirm({ close }) : close(onCancel)}>
      {(close) => <>
        <p className="v2-edit-date"><time dateTime={record.record_date}>{dateText(record.record_date)} {weekdayText(record.record_date)}</time></p>
        <RecordForm panel formId={form} record={record} category={record.category} date={record.record_date}
          repository={repository} tags={tags} createTag={createTag} draft={draft} onPending={setBusy}
          onDraft={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          onSaved={() => close(() => onDone('已更新'))} />
        <button type="button" className="v1-text v2-delete" disabled={busy} onClick={() => setConfirm('delete')}>删除这条记录</button>
      </>}
    </Panel>}
    {confirm === 'delete' && <ActionMenu title="删除这条记录？" options={[{ label: '删除', danger: true, action: remove }]}
      onCancel={cancelConfirm} busy={busy} error={error} />}
    {confirm && confirm !== 'delete' && <ActionMenu title="放弃更改？" cancel="继续编辑"
      options={[{ label: '放弃更改', danger: true, action: () => {
        const { close } = confirm;
        setConfirm(null);
        close(onCancel);
      } }]} onCancel={cancelConfirm} />}
  </>;
}
