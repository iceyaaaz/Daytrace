import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { mascotState } from '../domain/interaction.js';
import { CatSvg } from './CatSvg.jsx';
import { interactionDebug } from './interactionDebug.js';

export function TodayBeast({ records, ready, active }) {
  const [time, setTime] = useState(() => new Date());
  const [visible, setVisible] = useState(() => !document.hidden);
  const [event, setEvent] = useState();
  const forced = interactionDebug().mascot;
  const previous = useRef({ state: mascotState(time, 0, 0), ready: false });
  const state = forced ?? (ready
    ? mascotState(time, records.reduce((total, record) => total + record.minutes, 0), records.length)
    : previous.current.state);

  useEffect(() => {
    if (!active) return undefined;
    let timer;
    function sync() {
      clearInterval(timer);
      setVisible(!document.hidden);
      if (document.hidden) return;
      setTime(new Date());
      timer = setInterval(() => setTime(new Date()), 60_000);
    }
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', sync); };
  }, [active]);

  useLayoutEffect(() => {
    const before = previous.current;
    if (!ready || !active) return;
    previous.current = { state, ready };
    if (!before.ready || before.state === state || forced || !visible) {
      if (before.state !== state) setEvent(undefined);
      return;
    }
    if (before.state === 'idle' && state === 'active') setEvent('stretch');
    else if (state === 'happy' && before.state !== 'sleep') setEvent('lift');
    else if (state === 'sleep') setEvent('close');
    else setEvent(undefined);
  }, [state, ready, forced, active, visible]);

  if (!forced && !ready && !previous.current.ready) return null;
  return <CatSvg state={state} animated={active} reaction={event} />;
}

export default function BeastHero() {
  return <CatSvg />;
}
