import { useId, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { categories, categoryIds, categoryStyle } from '../domain/categories.js';
import { durationOptionLabel, durationOptions, emptyRecord, recordErrors, recordValues } from '../domain/records.js';
import { Icon } from './DiaryUI.jsx';
import { Feedback } from './Feedback.jsx';

const shortcuts = [15, 30, 60, 90, 120];

function FieldError({ id, error }) {
  return error ? <p className="field-error" id={id} role="alert">{error}</p> : null;
}

function TextField({ id, label, rows = 3, value, disabled, onChange, error, required }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const field = ref.current;
    const resize = () => {
      const styles = getComputedStyle(field);
      const box = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
      const line = Number.parseFloat(styles.lineHeight);
      field.style.height = 'auto';
      const min = line * rows + box + 2;
      const max = line * 8 + box + 2;
      field.style.height = `${Math.max(min, Math.min(field.scrollHeight + 2, max))}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [value, rows]);
  return <div className="field">
    <label htmlFor={id}>{label} <span className="muted">（{required ? '必填' : '选填'}）</span></label>
    <textarea id={id} rows={rows} value={value ?? ''} onChange={(event) => onChange(event.target.value)} disabled={disabled}
      ref={ref} data-entry-field aria-required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
    <FieldError id={`${id}-error`} error={error} />
  </div>;
}

function DurationField({ id, idea, value, onChange, disabled, error }) {
  const [showTime, setShowTime] = useState(() => !idea || Number(value) > 0);
  const [showSelect, setShowSelect] = useState(false);
  const other = value !== '' && !shortcuts.includes(Number(value)) && (!idea || Number(value) > 0);
  if (idea && !showTime) return <button type="button" className="text-button left-button"
    disabled={disabled} aria-expanded={false} onClick={() => setShowTime(true)}>添加时长（可选）</button>;
  const choose = (minutes) => { onChange(minutes); setShowSelect(false); };
  return <fieldset className="chip-field" aria-describedby={error ? `${id}-error` : undefined}>
    <legend>时长 <span className="muted">（{idea ? '选填' : '必填'}）</span></legend>
    <div className="chips">
      {shortcuts.map((minutes, index) => <button type="button" className="chip-button" key={minutes}
        data-entry-field={index === 0 ? '' : undefined} aria-pressed={Number(value) === minutes}
        disabled={disabled} onClick={() => choose(minutes)}><span>{durationOptionLabel(minutes)}</span></button>)}
      {other && <button type="button" className="chip-button" aria-pressed="true" disabled={disabled}
        onClick={() => setShowSelect(true)}><span>{durationOptionLabel(Number(value))}</span></button>}
      <button type="button" className="chip-button" disabled={disabled} aria-expanded={showSelect} aria-controls={`${id}-picker`}
        onClick={() => setShowSelect((current) => !current)}><span>其他 <Icon as={ChevronDown} /></span></button>
    </div>
    {showSelect && <div id={`${id}-picker`} className="select-wrap">
      <label className="sr-only" htmlFor={id}>选择时长</label>
      <select id={id} value={value} disabled={disabled} onChange={(event) => choose(event.target.value)}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}>
        <option value="" disabled hidden>请选择时长</option>
        {durationOptions.map((minutes) => <option key={minutes} value={minutes}>{durationOptionLabel(minutes)}</option>)}
      </select>
      <Icon as={ChevronDown} />
    </div>}
    <FieldError id={`${id}-error`} error={error} />
  </fieldset>;
}

function TagPicker({ id, label, available, selected, onToggle, onAdd, disabled, error }) {
  const [creating, setCreating] = useState(false);
  const [value, setValue] = useState('');
  const [problem, setProblem] = useState('');
  const [adding, setAdding] = useState(false);
  const input = useRef(null);
  const inFlight = useRef(false);
  const options = [...new Set([...available, ...selected])];

  useLayoutEffect(() => { if (creating) input.current?.focus({ preventScroll: true }); }, [creating]);

  async function add() {
    if (disabled || inFlight.current) return;
    inFlight.current = true;
    setAdding(true);
    setProblem('');
    try {
      await onAdd(value);
      setValue('');
      setCreating(false);
    } catch (failure) {
      setProblem(failure.message);
    } finally {
      inFlight.current = false;
      setAdding(false);
    }
  }

  return <fieldset className="chip-field" aria-describedby={error ? `${id}-error` : undefined}>
    <legend>{label}</legend>
    <div className="chips">
      {options.map((name) => <button type="button" className="chip-button" key={name}
        disabled={adding || disabled} aria-pressed={selected.includes(name)} onClick={() => onToggle(name)}>
        <span>{name}{!available.includes(name) && '（历史）'}</span>
      </button>)}
      <button type="button" className="chip-button" aria-expanded={creating} disabled={disabled}
        onClick={() => setCreating((current) => !current)}><span><Icon as={Plus} />新建</span></button>
    </div>
    {creating && <div className="field">
      <label htmlFor={id}>新标签名称</label>
      <div className="inline-fields">
        <input id={id} ref={input} value={value} disabled={adding || disabled} onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.nativeEvent.isComposing || event.keyCode === 229) return;
            event.preventDefault();
            add();
          }} />
        <button type="button" disabled={adding || disabled} onClick={add}>创建标签</button>
      </div>
      <Feedback error={problem} />
    </div>}
    <FieldError id={`${id}-error`} error={error} />
  </fieldset>;
}

export function RecordForm({ category, record, date, tags, createTag, repository, draft: controlled, onDraft,
  onSaved, onPending }) {
  const id = useId();
  const [ownDraft, setOwnDraft] = useState(() => record ?? emptyRecord(category));
  const [reset, setReset] = useState(0);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const draft = controlled ?? ownDraft;
  const fields = categories[draft.category];
  const idea = draft.category === 'idea';
  const update = (patch) => {
    if (onDraft) onDraft(patch);
    else setOwnDraft((current) => ({ ...current, ...patch }));
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !(key in patch))));
  };

  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    setError('');
    const invalid = recordErrors(draft);
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    if (!navigator.onLine) {
      setError('当前无网络，无法保存');
      return;
    }
    const values = recordValues(draft);
    const requestId = draft.requestId ?? crypto.randomUUID();
    if (!record && !draft.requestId) update({ requestId });
    lock.current = true;
    setPending(true);
    onPending?.(true);
    try {
      await repository.saveRecord(record?.id, requestId, date, values);
    } catch {
      setError('保存失败，请检查网络后重试');
      return;
    } finally {
      lock.current = false;
      setPending(false);
      onPending?.(false);
    }
    setReset((current) => current + 1);
    onSaved({ id: record?.id ?? requestId, values, again: event.nativeEvent.submitter?.value === 'again' });
  }

  const content = <TextField id={`${id}-content`} label={fields.content} required={Boolean(fields.required)} rows={idea ? 4 : 3}
    value={draft.content} disabled={pending} onChange={(value) => update({ content: value })} error={errors.content} />;
  return <form className="record-form" noValidate onSubmit={submit}
    style={categoryStyle(draft.category)} aria-label={record ? '编辑记录表单' : `填写${fields.label}`}>
    {error && <p role="alert" className="notice error">{error}</p>}
    {record && <div className="field">
      <label htmlFor={`${id}-category`}>板块</label>
      <div className="select-wrap"><select id={`${id}-category`} value={draft.category} disabled={pending} onChange={(event) =>
        update({ category: event.target.value, tags: [], gain: '' })}>
        {categoryIds.map((key) => <option key={key} value={key}>{categories[key].label}</option>)}
      </select><Icon as={ChevronDown} /></div>
    </div>}
    {idea && content}
    <DurationField key={`duration-${draft.category}-${reset}`} id={`${id}-minutes`} idea={idea} value={draft.minutes}
      onChange={(value) => update({ minutes: value })} disabled={pending} error={errors.minutes} />
    {fields.tags && <TagPicker key={`tags-${draft.category}-${reset}`} id={`${id}-tag`}
      label={`${fields.tags}（${draft.category === 'skill' ? '至少选一个' : '选填'}）`}
      available={tags.filter((tag) => tag.category === draft.category).map((tag) => tag.name)}
      selected={draft.tags} disabled={pending} error={errors.tags}
      onToggle={(name) => update({ tags: draft.tags.includes(name) ? draft.tags.filter((tag) => tag !== name) : [...draft.tags, name] })}
      onAdd={async (value) => {
        const tag = await createTag(draft.category, value);
        update({ tags: [...new Set([...draft.tags, tag.name])] });
      }} />}
    {!idea && content}
    {fields.gain && <TextField id={`${id}-gain`} label={fields.gain} value={draft.gain} disabled={pending}
      onChange={(value) => update({ gain: value })} />}
    <div className="form-actions">
      <button type="submit" className="primary" disabled={pending}>{pending ? '正在保存…' : '保存'}</button>
      {!record && <button type="submit" value="again" className="text-button" disabled={pending}>保存并再记一条</button>}
    </div>
  </form>;
}
