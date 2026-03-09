const API_BASE = import.meta.env.VITE_SSOT_API_BASE_URL;

/**
 * GET /v1/shopify/gestao
 * @param {string} start YYYY-MM-DD
 * @param {string} end YYYY-MM-DD
 * @param {{ bust?: boolean }} [opts]
 */
export async function getGestao(start, end, opts = {}) {
  const url = new URL(`${API_BASE}/v1/shopify/gestao`);
  url.searchParams.set('start', start);
  url.searchParams.set('end', end);

  // bypass do cache da API (útil para validação)
  if (opts.bust) url.searchParams.set('bust', '1');

  const resp = await fetch(url.toString());
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}