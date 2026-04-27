
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbydjgbQF9B5ZTsPMmmX0v56qi1C9mSk8hlHJeHr6z5Erqe2aqunnN26CWnrSlgULyiDiw/exec';

const CACHE_KEY = 'recmil_datos_v2';
const CACHE_TTL = 60 * 60 * 1000; // 1 hora en ms

/**
 * Devuelve { vendedores: string[], ciudades: { [vendedor]: string[] } }
 * Usa localStorage como caché con TTL de 1 hora.
 */
export async function getDatos() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data;
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  const res = await fetch(`${WEB_APP_URL}?action=datos`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.startsWith('<')) throw new Error('El Web App devolvió HTML — verificá que el acceso sea "Anyone" en el deploy de Apps Script');
  const data = JSON.parse(text);
  if (data.error) throw new Error(data.error);

  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  return data;
}

/** Borra el caché (útil para forzar recarga de datos frescos) */
export function invalidarCache() {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Envía la visita al Web App de Apps Script.
 * Usa Content-Type: text/plain para evitar el preflight CORS.
 */
export async function guardarVisita(visita) {
  const res = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(visita),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Error desconocido');
  return json;
}
