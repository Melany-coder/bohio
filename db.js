/* ==================== BOHÍO EN LA NUBE (Supabase) ====================
   Notas, bitácora y fotos pequeñas compartidas para todos los integrantes. */
window.BohioCloud = (() => {
  const URL = 'https://zeicavbnbpwdupylchfn.supabase.co';
  const KEY = 'sb_publishable_1sB2Y1oPGpVWCWWIRbwX-Q_QZJpYyuO';
  const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
  const SIG = o => JSON.stringify(o);

  const union = (a, b) => {
    const m = new Map();
    for (const x of (a || [])) m.set(SIG(x), x);
    for (const x of (b || [])) m.set(SIG(x), x);
    return [...m.values()];
  };

  const read = async () => {
    try {
      const r = await fetch(URL + '/rest/v1/bohio_state?select=data', { headers: H });
      if (!r.ok) return {};
      const j = await r.json();
      return (j && j[0] && j[0].data) || {};
    } catch (e) { return {}; }
  };

  const write = async (data) => {
    try {
      await fetch(URL + '/rest/v1/bohio_state?id=eq.1', {
        method: 'PATCH', headers: H, body: JSON.stringify({ data })
      });
    } catch (e) { /* sin internet: se queda solo en el navegador */ }
  };

  const sync = async (local) => {
    const remote = await read();
    const merged = {};
    ['notes', 'visits', 'photos'].forEach(k => { merged[k] = union(local[k], remote[k]); });
    await write({ notes: merged.notes || [], visits: merged.visits || [], photos: merged.photos || [] });
    return merged;
  };

  return { read, write, sync, union };
})();