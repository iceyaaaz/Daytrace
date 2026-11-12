import { useEffect, useState } from 'react';

export function useQuery(load, key) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ key, attempt, status: 'ready', data });
      },
      () => {
        if (!controller.signal.aborted) setState({ key, attempt, status: 'error' });
      },
    );
    return () => controller.abort();
  }, [load, key, attempt]);

  const result = state?.key === key && state.attempt === attempt ? state : { status: 'loading' };
  return { ...result, retry: () => setAttempt((value) => value + 1) };
}
