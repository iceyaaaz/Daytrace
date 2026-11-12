import { useId, useState } from 'react';
import {
  categories, categoryIds, durationOptionLabel, durationOptions, emptyRecord, recordValues,
} from '../domain/records.js';
import { Feedback } from './Feedback.jsx';

function TagPicker({ label, available, selected, onSelect, onCreate, disabled, id }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const options = [...new Set([...available, ...selected])];

  async function add() {
    if (adding || disabled) return;
    setError('');
    setAdding(true);
    try {
      const tag = await onCreate(value);
      onSelect([...new Set([...selected, tag.name])]);
      setValue('');
    } catch (problem) {
      setError(problem.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <fieldset className="tag-picker">
      <legend>{label}</legend>
      {options.length > 0 && <div className="tag-options">
        {options.map((name) => (
          <label className="tag-option" key={name}>
            <input type="checkbox" checked={selected.includes(name)} disabled={adding || disabled}
              onChange={(event) => onSelect(event.target.checked ? [...selected, name] : selected.filter((item) => item !== name))} />
            {name}{!available.includes(name) && <small>（历史）</small>}
          </label>
        ))}
      </div>}
      <label htmlFor={id}>新标签名称</label>
      <div className="inline-fields">
        <input id={id} value={value} disabled={adding || disabled} placeholder="输入后按回车"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.nativeEvent.isComposing || event.keyCode === 229) return;
            event.preventDefault();
            add();
          }} />
        <button type="button" disabled={adding || disabled} onClick={add}>创建标签</button>
      </div>
      <Feedback error={error} />
    </fieldset>
  );
}

export function RecordForm({ category, record, date, tags, createTag, repository, onSaved, onCancel }) {
  const id = useId();
  const [draft, setDraft] = useState(() => record ?? emptyRecord(category));
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const fields = categories[draft.category];
  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setError('');
    let values;
    try {
      values = recordValues(draft);
    } catch (problem) {
      setError(problem.message);
      return;
    }
    if (!navigator.onLine) {
      setError('当前无网络，无法保存。输入已保留，请联网后重试。');
      return;
    }
    setPending(true);
    try {
      await repository.saveRecord(record?.id, draftId, date, values);
      setDraft(emptyRecord(category));
      setDraftId(crypto.randomUUID());
      onSaved();
    } catch {
      setError('保存失败，输入已保留。请检查网络或登录状态后重试。');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="record-form" onSubmit={submit} aria-label={record ? '编辑记录' : `填写${fields.label}`}>
      {record && <label htmlFor={`${id}-category`}>板块
        <select id={`${id}-category`} value={draft.category} disabled={pending}
          onChange={(event) => {
            const next = event.target.value;
            setDraft((current) => ({ ...current, category: next, tags: [], gain: '' }));
          }}>
          {categoryIds.map((key) => <option key={key} value={key}>{categories[key].label}</option>)}
        </select>
      </label>}
      <label htmlFor={`${id}-minutes`}>时间{draft.category === 'idea' ? '（可选）' : '（必填）'}
        <select id={`${id}-minutes`} value={draft.minutes} disabled={pending}
          onChange={(event) => set('minutes', event.target.value)}>
          <option value="" disabled hidden>请选择时间</option>
          {durationOptions.map((minutes) => <option key={minutes} value={minutes}>{durationOptionLabel(minutes)}</option>)}
        </select>
      </label>
      {fields.tags && <TagPicker key={draft.category} id={`${id}-tag`} label={`${fields.tags}${draft.category === 'skill' ? '（至少选一个）' : '（可选）'}`}
        available={tags.filter((tag) => tag.category === draft.category).map((tag) => tag.name)}
        selected={draft.tags} onSelect={(value) => set('tags', value)} disabled={pending}
        onCreate={(value) => createTag(draft.category, value)} />}
      <label htmlFor={`${id}-content`}>{fields.content}{fields.required ? '（必填）' : '（可选）'}
        <textarea id={`${id}-content`} rows={draft.category === 'idea' ? 2 : 3} value={draft.content ?? ''} disabled={pending}
          placeholder={draft.category === 'idea' ? '先记下一句，留住这个念头。' : undefined}
          onChange={(event) => set('content', event.target.value)} />
      </label>
      {fields.gain && <label htmlFor={`${id}-gain`}>{fields.gain}（可选）
        <textarea id={`${id}-gain`} rows={2} value={draft.gain ?? ''} disabled={pending}
          onChange={(event) => set('gain', event.target.value)} />
      </label>}
      <div className="actions">
        <button type="submit" className="primary" disabled={pending}>{pending ? '正在保存…' : '保存'}</button>
        {onCancel && <button type="button" onClick={onCancel} disabled={pending}>取消</button>}
      </div>
      <Feedback error={error} />
    </form>
  );
}
