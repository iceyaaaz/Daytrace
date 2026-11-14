// Vercel 的预览构建也会使用生产模式，用平台环境标识区分预览和正式站。
const enabled = import.meta.env.DEV || import.meta.env.VITE_VERCEL_ENV === 'preview';

function read(key, allowed) {
  if (!enabled) return undefined;
  try {
    const value = localStorage.getItem(key);
    if (allowed.includes(value)) return value;
  } catch { /* 本机设置不可用时使用真实状态。 */ }
  return undefined;
}

export function interactionDebug() {
  return {
    mascot: read('riji.debug.mascot', ['idle', 'active', 'happy', 'sleep']),
    tod: read('riji.debug.tod', ['morning', 'day', 'dusk', 'night']),
  };
}
