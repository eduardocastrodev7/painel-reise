const API_BASE = import.meta.env.VITE_SSOT_API_BASE_URL;

export async function getGestao(start, end) {
  const url = new URL(`${API_BASE}/v1/shopify/gestao`);
  url.searchParams.set('start', start);
  url.searchParams.set('end', end);

  const resp = await fetch(url.toString());
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}