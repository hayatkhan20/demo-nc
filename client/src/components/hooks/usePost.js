import { useEffect, useRef, useState } from 'react';

export function usePost(url) {
  const ctrl = useRef(null);
  const [state, setState] = useState({ loading: false, error: null, data: null });

  const post = async (payload) => {
    if (ctrl.current) ctrl.current.abort();
    ctrl.current = new AbortController();
    setState({ loading: true, error: null, data: null });
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
        signal: ctrl.current.signal
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json?.error?.message || `HTTP ${r.status}`);
      setState({ loading: false, error: null, data: json });
      return json;
    } catch (e) {
      if (e.name === 'AbortError') return;
      setState({ loading: false, error: e.message || 'Request failed', data: null });
    }
  };

  useEffect(() => () => ctrl.current?.abort(), []);
  return { ...state, post };
}
