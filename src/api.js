// ─── Reemplazá esta URL con la de tu Web App de Apps Script ───
// Deploy → Manage deployments → copiar "Web app URL"
const WEB_APP_URL = 'PEGAR_URL_DEL_WEB_APP_AQUI';

const CACHE_KEY = 'recmil_datos_v1';
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

  const res = await fetch(`${WEB_APP_URL}?action=datos`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
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
