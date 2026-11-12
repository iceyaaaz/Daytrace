import { emptyRecord } from './records.js';

export function hasEntryChanges(draft) {
  return Boolean(draft.content || draft.gain || draft.tagInput || draft.tags.length ||
    (draft.category === 'idea' ? Number(draft.minutes) !== 0 : draft.minutes !== ''));
}

export function entryPanel(state, action) {
  if (action.type !== 'open' && (!state || (action.id && action.id !== state.id))) return state;
  switch (action.type) {
    case 'open': return { id: action.id, draft: emptyRecord(action.category), confirming: false, busy: false };
    case 'patch': return { ...state, draft: { ...state.draft, ...action.patch } };
    case 'busy': return { ...state, busy: action.value };
    case 'confirm': return { ...state, confirming: action.value };
    case 'again': return { ...state, draft: emptyRecord(state.draft.category), confirming: false };
    case 'close': return null;
    default: return state;
  }
}
