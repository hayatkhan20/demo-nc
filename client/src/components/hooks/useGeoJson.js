import { useEffect, useMemo, useRef, useState } from 'react';
import * as L from 'leaflet';

export function useGeoJson(url) {
  const abortRef = useRef();
  const [state, setState] = useState({ loading: false, error: null, data: null });

  useEffect(() => {
    if (!url) { setState({ loading: false, error: null, data: null }); return; }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState({ loading: true, error: null, data: null });

    fetch(url, { headers: { Accept: 'application/geo+json' }, signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(`Fetch ${r.status}`); return r.json(); })
      .then(gj => setState({ loading: false, error: null, data: gj }))
      .catch(e => {
        if (e.name !== 'AbortError') setState({ loading: false, error: e.message, data: null });
      });

    return () => ctrl.abort();
  }, [url]);

  const bounds = useMemo(() => {
    if (!state.data) return null;
    try {
      const b = L.geoJSON(state.data).getBounds();
      return b && b.isValid() ? b : null;
    } catch { return null; }
  }, [state.data]);

  return { ...state, bounds };
}
