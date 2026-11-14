import { useEffect, useLayoutEffect, useState } from 'react';
import { effectiveMotion, motionKey, motionLabels } from '../domain/interaction.js';

const reducedQuery = '(prefers-reduced-motion: reduce)';

export function useMotion() {
  const [preference, setPreference] = useState(() => {
    try {
      const saved = localStorage.getItem(motionKey);
      if (Object.hasOwn(motionLabels, saved)) return saved;
    } catch { /* 本机设置不可用时采用系统偏好。 */ }
    return 'system';
  });
  const [systemReduced, setSystemReduced] = useState(() => matchMedia(reducedQuery).matches);
  const enabled = effectiveMotion(preference, systemReduced);

  useEffect(() => {
    const media = matchMedia(reducedQuery);
    const update = () => setSystemReduced(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => { document.documentElement.dataset.motion = enabled ? 'on' : 'off'; }, [enabled]);

  useEffect(() => {
    const sync = () => { document.documentElement.dataset.motionHidden = String(document.hidden); };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(motionKey, preference); } catch { /* 对本次使用仍生效。 */ }
  }, [preference]);

  return { preference, setPreference, systemReduced, enabled };
}
