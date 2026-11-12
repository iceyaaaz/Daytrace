export function QueryState({ query, message = '读取失败，请检查网络后重试。', children }) {
  if (query.status === 'loading') return <p className="notice" role="status">正在读取…</p>;
  if (query.status === 'error') return (
    <div className="notice error" role="alert">
      <span>{message}</span> <button type="button" onClick={query.retry}>重试</button>
    </div>
  );
  return children;
}

export function Feedback({ error, message }) {
  if (error) return <p className="feedback error" role="alert">{error}</p>;
  if (message) return <p className="feedback" role="status">{message}</p>;
  return null;
}

export function DateField({ id, value, max, onChange, label = '记录日期' }) {
  return (
    <label className="date-field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} type="date" min="0001-01-01" max={max} value={value}
        onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
