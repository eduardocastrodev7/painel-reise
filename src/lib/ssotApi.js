// src/lib/ssotApi.js
const API_BASE = (import.meta.env.VITE_SSOT_API_BASE_URL || '').trim();

export async function getGestao({ start, end }, options = {}) {
  if (!API_BASE) throw new Error('VITE_SSOT_API_BASE_URL não configurado no .env.local');

  const url = new URL(`${API_BASE}/v1/shopify/gestao`);
  url.searchParams.set('start', start);
  url.searchParams.set('end', end);

  const resp = await fetch(url.toString(), { signal: options.signal });
  const text = await resp.text();

  if (!resp.ok) throw new Error(text || 'Erro ao chamar SSOT API');

  return text ? JSON.parse(text) : null;
}