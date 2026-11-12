import { categoryIds } from './categories.js';
import { emptyRecord } from './records.js';

export const initialToday = { days: {}, drafts: {} };
const initialDay = { open: categoryIds[0], finished: false };

export function entryKey(date, category) {
  return `${date}:${category}`;
}

export function dayFlow(state, date) {
  return state.days[date] ?? initialDay;
}

export function todayFlow(state, action) {
  const { date, category } = action;
  const day = dayFlow(state, date);
  const key = entryKey(date, category);
  if (action.type === 'draft') {
    const current = state.drafts[key] ?? emptyRecord(category);
    return { ...state, drafts: { ...state.drafts, [key]: { ...current, ...action.patch } } };
  }
  if (action.type === 'toggle') {
    return { ...state, days: { ...state.days, [date]: { ...day, open: day.open === category ? null : category } } };
  }
  if (action.type === 'saved') {
    const drafts = { ...state.drafts };
    delete drafts[key];
    if (day.open !== category) return { ...state, drafts };
    const next = action.again ? category : categoryIds[categoryIds.indexOf(category) + 1] ?? null;
    return { drafts, days: { ...state.days, [date]: { open: next, finished: next === null } } };
  }
  return state;
}

export function toastAfterUndo(current, original) {
  // 较早的撤销请求完成时，不覆盖后来一次保存的反馈。
  return current === original ? { message: '已撤销', duration: 2000 } : current;
}
