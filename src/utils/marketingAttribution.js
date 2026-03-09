// src/utils/marketingAttribution.js
// Build "Vendas atribuídas ao marketing" donut data robustly from payload.
// Prefers payload.marketing_attribution (Shopify last click). Falls back to payload.channels.
// Excludes Direct / Unattributed / Unknown / Não mapeado.

export function normalizeStr(x) {
  return (x ?? "").toString().trim().toLowerCase();
}
export function normalizeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

export function isExcludedMarketingChannel(ch) {
  const c = normalizeStr(ch);
  return (
    c === "direct" ||
    c === "unattributed" ||
    c === "an unknown source" ||
    c === "unknown" ||
    c === "não mapeado" ||
    c === "nao mapeado"
  );
}

function rowsFromMarketingAttribution(arr) {
  const map = new Map();
  for (const r of arr) {
    const channel = normalizeStr(r?.canal ?? r?.channel ?? r?.source ?? r?.label ?? "unknown");
    if (isExcludedMarketingChannel(channel)) continue;

    const orders = normalizeNum(r?.pedidos ?? r?.orders ?? r?.count ?? r?.value);
    if (orders <= 0) continue;

    map.set(channel, (map.get(channel) || 0) + orders);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value }));
}

function rowsFromChannels(arr) {
  const map = new Map();
  for (const r of arr) {
    const channel = normalizeStr(r?.canal ?? r?.channel ?? r?.source ?? r?.label ?? "unknown");
    if (isExcludedMarketingChannel(channel)) continue;

    const orders = normalizeNum(r?.pedidos ?? r?.orders ?? r?.count ?? r?.value);
    if (orders <= 0) continue;

    map.set(channel, (map.get(channel) || 0) + orders);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value }));
}

export function buildDonutSeries(rows, topN = 6) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const restSum = rest.reduce((acc, r) => acc + r.value, 0);

  const series = restSum > 0 ? [...top, { label: "Outros", value: restSum }] : top;
  const total = series.reduce((acc, r) => acc + r.value, 0);

  return { total, series };
}

/**
 * Main helper:
 * @param {object} payload API payload object from /v1/shopify/gestao
 * @param {number} topN how many slices + "Outros"
 */
export function buildMarketingDonut(payload, topN = 6) {
  const P = payload ?? {};
  const rows =
    Array.isArray(P.marketing_attribution) && P.marketing_attribution.length
      ? rowsFromMarketingAttribution(P.marketing_attribution)
      : Array.isArray(P.channels) && P.channels.length
        ? rowsFromChannels(P.channels)
        : [];

  return buildDonutSeries(rows, topN);
}
