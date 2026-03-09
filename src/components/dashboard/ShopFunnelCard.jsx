// src/components/dashboard/ShopFunnelCard.jsx

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Styles (toggle + funnel view)
import '../../styles/shop-funnel.css';

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pickNumber(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function normalizeRate(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  // Accept either fraction (0.076) or percent (7.6)
  if (n > 1.5) return n / 100;
  return n;
}

function pctFrac(frac, digits = 2) {
  const n = normalizeRate(frac) * 100;
  return `${n.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

function deltaFrac(current, previous) {
  const c = Number(current);
  const p = Number(previous);
  if (!Number.isFinite(c) || !Number.isFinite(p) || p === 0) return null;
  return (c - p) / Math.abs(p);
}

function deltaLabel(current, previous) {
  const d = deltaFrac(current, previous);
  if (d === null) return null;
  const sign = d > 0 ? '+' : '';
  return `${sign}${(d * 100).toFixed(1)}%`;
}

function deltaIsUp(label) {
  if (!label) return false;
  const n = Number(String(label).replace('%', ''));
  return Number.isFinite(n) ? n >= 0 : false;
}

function formatInt(n) {
  return toNumber(n).toLocaleString('pt-BR');
}

// Fixed viz height to:
// 1) avoid card resize when toggling
// 2) avoid the card getting "taller than necessary" (pushing the layout down)
const VIZ_HEIGHT_PX = 320;

/**
 * ShopFunnelCard
 * - Modo "Etapas": cards + barras
 * - Modo "Funil": funil tipo "lead funnel" (Semrush-like), flat e legível
 *
 * Notas:
 * - Suporta os nomes atuais do totals do GestaoShopify:
 *   { sessions, sessions_add_to_cart, sessions_reached_checkout, orders_valid }
 * - Calcula taxas a partir dos volumes (não depende do backend mandar rates)
 * - NÃO muda o tamanho do card ao alternar Etapas/Funil
 */
export function ShopFunnelCard({ totals, prevTotals }) {
  const t = totals || {};
  const p = prevTotals || {};

  // Volumes (compatíveis com seu payload atual)
  const sessions = pickNumber(t, ['sessions', 'sessoes', 'sessões', 'total_sessions']);
  const addToCart = pickNumber(t, [
    'sessions_add_to_cart',
    'sessionsWithCart',
    'sessions_with_cart',
    'add_to_cart',
    'addToCart',
    'added_to_cart',
    'carrinho',
    'sessoes_com_carrinho',
    'sessoesComCarrinho',
  ]);
  const checkout = pickNumber(t, [
    'sessions_reached_checkout',
    'sessionsReachedCheckout',
    'sessions_checkout',
    'checkout',
    'reached_checkout',
    'checkout_started',
    'chegou_checkout',
    'sessoes_chegaram_checkout',
    'sessoesChegaramCheckout',
  ]);
  const orders = pickNumber(t, [
    'orders_valid',
    'pedidos_validos',
    'pedidos_aprovados_validos',
    'orders',
    'purchases',
    'pedidos',
  ]);

  const prevSessions = pickNumber(p, ['sessions', 'sessoes', 'sessões', 'total_sessions']);
  const prevOrders = pickNumber(p, [
    'orders_valid',
    'pedidos_validos',
    'pedidos_aprovados_validos',
    'orders',
    'purchases',
    'pedidos',
  ]);

  // Taxas step-to-step (como no seu card atual)
  const addToCartRate = sessions > 0 ? addToCart / sessions : 0;
  const checkoutRate = addToCart > 0 ? checkout / addToCart : 0;
  const purchaseRate = checkout > 0 ? orders / checkout : 0;

  // Conversão total (métrica grande no topo)
  const overallConv = sessions > 0 ? orders / sessions : 0;
  const prevOverallConv = prevSessions > 0 ? prevOrders / prevSessions : 0;

  // Toggle view
  const [view, setView] = useState('steps');

  // Persistência simples (UX)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('gestao_funnel_view');
      if (saved === 'steps' || saved === 'funnel') setView(saved);
    } catch (_) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('gestao_funnel_view', view);
    } catch (_) {
      // ignore
    }
  }, [view]);

  const dConv = deltaLabel(overallConv, prevOverallConv);
  const dConvUp = dConv && Number(overallConv) >= Number(prevOverallConv);

  const steps = useMemo(
    () => [
      {
        key: 'sessions',
        label: 'Sessões',
        value: toNumber(sessions),
        pct: '100%',
        d: deltaLabel(toNumber(sessions), toNumber(prevSessions)),
      },
      {
        key: 'add_to_cart',
        label: 'Adicionado ao carrinho',
        value: toNumber(addToCart),
        pct: pctFrac(addToCartRate, 2),
        d: null,
      },
      {
        key: 'checkout',
        label: 'Chegou ao checkout',
        value: toNumber(checkout),
        pct: pctFrac(checkoutRate, 2),
        d: null,
      },
      {
        key: 'orders',
        label: 'Pedidos válidos',
        value: toNumber(orders),
        pct: pctFrac(purchaseRate, 2),
        d: deltaLabel(toNumber(orders), toNumber(prevOrders)),
      },
    ],
    [
      sessions,
      addToCart,
      checkout,
      orders,
      prevSessions,
      prevOrders,
      addToCartRate,
      checkoutRate,
      purchaseRate,
    ]
  );

  return (
    <section className="panel chart-card" style={{ alignSelf: 'start' }}>
      <div className="chart-card-header">
        <h3 className="chart-card-title">Detalhamento da taxa de conversão</h3>

        <div className="funnel-view-toggle" role="radiogroup" aria-label="Visualização do funil">
          <button
            type="button"
            role="radio"
            aria-checked={view === 'steps'}
            className={`funnel-view-toggle-btn ${view === 'steps' ? 'is-active' : ''}`}
            onClick={() => setView('steps')}
          >
            Etapas
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={view === 'funnel'}
            className={`funnel-view-toggle-btn ${view === 'funnel' ? 'is-active' : ''}`}
            onClick={() => setView('funnel')}
          >
            Funil
          </button>
        </div>
      </div>

      <div className="chart-metric-row">
        <div className="chart-metric">{pctFrac(overallConv, 2)}</div>
        {dConv ? (
          <div className={`chart-delta ${dConvUp ? 'delta--up' : 'delta--down'}`}>▲ {dConv}</div>
        ) : (
          <div className="chart-delta delta--neutral">—</div>
        )}
      </div>

      <div
        className={`shopfunnel-viz ${view === 'funnel' ? 'shopfunnel-viz--funnel' : 'shopfunnel-viz--steps'}`}
        style={{ height: VIZ_HEIGHT_PX }}
      >
        {view === 'steps' ? (
          <div className="shopfunnel-steps-measure">
            <div className="funnel-grid">
              {steps.map((s) => (
                <div key={s.key} className="funnel-step">
                  <div className="funnel-step-name">{s.label}</div>
                  <div className="funnel-step-pct">{s.pct}</div>
                  <div className="funnel-step-val">{formatInt(s.value)}</div>
                  {s.d ? (
                    <div className={`funnel-step-delta ${deltaIsUp(s.d) ? 'delta--up' : 'delta--down'}`}>▲ {s.d}</div>
                  ) : (
                    <div className="funnel-step-delta delta--neutral">—</div>
                  )}
                </div>
              ))}
            </div>

            <div className="chart-area" style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={steps.map((x) => ({ name: x.label, value: x.value }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(29,29,27,0.10)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v) => [formatInt(v), '']}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      boxShadow: 'var(--shadow-sm)',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <FunnelViz steps={steps} />
        )}
      </div>
    </section>
  );
}

function FunnelViz({ steps }) {
  // Visual goals:
  // - Funnel silhouette (Semrush-like)
  // - Flat (no gradients, no 3D)
  // - High legibility (label left, value center, % right)
  // - Designed to fit a ~320px container without big empty space

  const viewW = 600;
  const viewH = 320;

  const segH = 70;
  const gap = 10;
  const startY = 6;

  // A consistent silhouette (avoid "pills" / tiny blocks)
  const topW = [540, 480, 420, 360];
  const botW = [480, 420, 360, 300];

  const labelOneLine = (key, label) => {
    const k = String(key || '').toLowerCase();
    if (k === 'add_to_cart') return 'Adicionado ao carrinho';
    if (k === 'checkout') return 'Chegou ao checkout';
    if (k === 'orders') return 'Pedidos válidos';
    if (k === 'sessions') return 'Sessões';
    return String(label || '').trim();
  };

  return (
    <div className="shopfunnel-funnelWrap" aria-label="Visualização em formato de funil">
      <svg
        className="shopfunnel-funnelSvg"
        viewBox={`0 0 ${viewW} ${viewH}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMin meet"
        role="img"
      >
        {steps.map((s, idx) => {
          const y0 = startY + idx * (segH + gap);
          const y1 = y0 + segH;

          const tw = topW[idx] ?? 360;
          const bw = botW[idx] ?? 300;

          const xTopL = (viewW - tw) / 2;
          const xTopR = xTopL + tw;
          const xBotL = (viewW - bw) / 2;
          const xBotR = xBotL + bw;

          const d = `M ${xTopL} ${y0} L ${xTopR} ${y0} L ${xBotR} ${y1} L ${xBotL} ${y1} Z`;

          // Text safe area inside the narrowest part
          const innerW = Math.min(tw, bw);
          const pad = 16;
          const xL = viewW / 2 - innerW / 2 + pad;
          const xR = viewW / 2 + innerW / 2 - pad;
          const xC = viewW / 2;

          const yTopRow = y0 + 22;
          const yValue = y0 + 48;

          const lbl = labelOneLine(s.key, s.label);

          return (
            <g key={s.key}>
              <path d={d} className={`shopfunnel-funnelSeg shopfunnel-funnelSeg--${idx}`} vectorEffect="non-scaling-stroke" />

              {/* Top row: label left, % right */}
              <text x={xL} y={yTopRow} textAnchor="start" dominantBaseline="middle" className="shopfunnel-funnelTopLabel">
                {lbl}
              </text>

              <text x={xR} y={yTopRow} textAnchor="end" dominantBaseline="middle" className="shopfunnel-funnelTopPct">
                {s.pct}
              </text>

              {/* Center: value */}
              <text x={xC} y={yValue} textAnchor="middle" dominantBaseline="middle" className="shopfunnel-funnelValue">
                {formatInt(s.value)}
              </text>

              <title>{s.label}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
