// src/pages/GestaoShopify.jsx

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { getGestao } from '../api';

import { KpiCard } from '../components/dashboard/KpiCard';
import { ShopFunnelCard } from '../components/dashboard/ShopFunnelCard';
import { ShopDonutCard } from '../components/dashboard/ShopDonutCard';
import { ShopMarketingCostCard } from '../components/dashboard/ShopMarketingCostCard';

import { ShopOrdersByHourCard } from '../components/dashboard/ShopOrdersByHourCard';
import { ShopTopItemsCard } from '../components/dashboard/ShopTopItemsCard';

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function formatBRL(v) {
  return Number(v || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatPct(frac) {
  const n = Number(frac || 0) * 100;
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

function deltaFrac(current, previous) {
  const c = Number(current);
  const p = Number(previous);
  if (!Number.isFinite(c) || !Number.isFinite(p) || p === 0) return null;
  return (c - p) / Math.abs(p);
}

function formatDelta(current, previous) {
  const d = deltaFrac(current, previous);
  if (d === null) return null;
  const sign = d > 0 ? '+' : '';
  return `${sign}${(d * 100).toFixed(1)}%`;
}

function deltaDirection(current, previous) {
  const c = Number(current);
  const p = Number(previous);
  if (!Number.isFinite(c) || !Number.isFinite(p) || p === 0) return 'flat';
  if (c > p) return 'up';
  if (c < p) return 'down';
  return 'flat';
}

function formatYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmd(ymd) {
  // interpreta como data local
  const [y, m, d] = (ymd || '').split('-').map((x) => Number(x));
  return new Date(y, (m || 1) - 1, d || 1);
}

function shiftDays(dateObj, deltaDays) {
  const dt = new Date(dateObj);
  dt.setDate(dt.getDate() + deltaDays);
  return dt;
}

function daysBetweenInclusive(startYmd, endYmd) {
  const a = parseYmd(startYmd);
  const b = parseYmd(endYmd);
  const ms = b.getTime() - a.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  return Math.max(0, days) + 1;
}

function prevRangeFromCurrent(startYmd, endYmd) {
  const len = daysBetweenInclusive(startYmd, endYmd);
  const prevEnd = formatYmd(shiftDays(parseYmd(startYmd), -1));
  const prevStart = formatYmd(shiftDays(parseYmd(prevEnd), -(len - 1)));
  return { prevStart, prevEnd };
}

const DATE_PRESETS = [
  {
    id: 'hoje',
    label: 'Hoje',
    getRange: () => {
      const now = new Date();
      const ymd = formatYmd(now);
      return { start: ymd, end: ymd };
    },
  },
  {
    id: 'ontem',
    label: 'Ontem',
    getRange: () => {
      const now = new Date();
      const ymd = formatYmd(shiftDays(now, -1));
      return { start: ymd, end: ymd };
    },
  },
  {
    id: '7d',
    label: 'Últimos 7 dias',
    getRange: () => {
      const now = new Date();
      const end = formatYmd(now);
      const start = formatYmd(shiftDays(now, -6));
      return { start, end };
    },
  },
  {
    id: '30d',
    label: 'Últimos 30 dias',
    getRange: () => {
      const now = new Date();
      const end = formatYmd(now);
      const start = formatYmd(shiftDays(now, -29));
      return { start, end };
    },
  },
  {
    id: 'mtd',
    label: 'MTD',
    getRange: () => {
      const now = new Date();
      const end = formatYmd(now);
      const start = formatYmd(new Date(now.getFullYear(), now.getMonth(), 1));
      return { start, end };
    },
  },
];

function IconCalendar() {
  return (
    <svg className="chip-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 2v3M17 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M4 7h16v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M4 11h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCompare() {
  return (
    <svg className="chip-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 3H5a2 2 0 0 0-2 2v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 21h5a2 2 0 0 0 2-2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 17l-3 3-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCurrency() {
  return (
    <svg className="chip-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 7h8M8 12h8M8 17h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg className="chip-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 4v6h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg className="chip-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function useOutsideClick(ref, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handle(e) {
      if (!ref.current) return;
      if (ref.current.contains(e.target)) return;
      onClose?.();
    }

    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [ref, isOpen, onClose]);
}

function Chip({ icon, label, onClick, rightIcon, title, staticChip = false }) {
  return (
    <button
      type="button"
      className={`chip ${staticChip ? 'chip--static' : ''}`}
      onClick={onClick}
      title={title}
    >
      {icon}
      <span className="chip-label">{label}</span>
      {rightIcon}
    </button>
  );
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
export function GestaoShopify() {
  const initial = DATE_PRESETS.find((p) => p.id === 'ontem')?.getRange();

  const [presetId, setPresetId] = useState('ontem');
  const [start, setStart] = useState(initial?.start || formatYmd(new Date()));
  const [end, setEnd] = useState(initial?.end || formatYmd(new Date()));

  const [compareEnabled, setCompareEnabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [data, setData] = useState(null);
  const [prevData, setPrevData] = useState(null);

  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [compareMenuOpen, setCompareMenuOpen] = useState(false);

  const periodMenuRef = useRef(null);
  const compareMenuRef = useRef(null);

  useOutsideClick(periodMenuRef, periodMenuOpen, () => setPeriodMenuOpen(false));
  useOutsideClick(compareMenuRef, compareMenuOpen, () => setCompareMenuOpen(false));

  const load = useCallback(
    async ({ bust = false } = {}) => {
      setLoading(true);
      setError('');

      try {
        const current = await getGestao(start, end, { bust });

        let previous = null;
        if (compareEnabled) {
          const { prevStart, prevEnd } = prevRangeFromCurrent(start, end);
          previous = await getGestao(prevStart, prevEnd, { bust });
        }

        setData(current);
        setPrevData(previous);
      } catch (e) {
        setError(e?.message || 'Falha ao carregar dados.');
      } finally {
        setLoading(false);
      }
    },
    [start, end, compareEnabled]
  );

  useEffect(() => {
    load({ bust: false });
  }, [load]);

  const periodLabel = useMemo(() => {
    const preset = DATE_PRESETS.find((p) => p.id === presetId);
    if (!preset) {
      if (start === end) return start;
      return `${start} → ${end}`;
    }
    return preset.label;
  }, [presetId, start, end]);

  const comparisonLabel = compareEnabled ? 'Comparando' : 'Sem comparação';

  // -------------------------
  // Derived data
  // -------------------------
  const k = data?.kpis || {};
  const kp = prevData?.kpis || {};

  const revenue = Number(k.vendas || 0);
  const revenuePrev = Number(kp.vendas || 0);

  const orders = Number(k.pedidos || 0);
  const ordersPrev = Number(kp.pedidos || 0);

  const aov = Number(k.aov || 0);
  const aovPrev = Number(kp.aov || 0);

  const conv = Number(k.taxa_conversao || 0);
  const convPrev = Number(kp.taxa_conversao || 0);

  const ordersNew = Number(k.pedidos_novos || 0);
  const ordersReturning = Number(k.pedidos_recorrentes || 0);

  
  const funnelSeries = Array.isArray(data?.funnel_daily) ? data.funnel_daily : [];
  const funnelTotals = funnelSeries.reduce(
    (acc, row) => {
      acc.sessions += Number(row.sessoes || 0);
      acc.sessions_add_to_cart += Number(row.sessoes_com_carrinho || 0);
      acc.sessions_reached_checkout += Number(row.sessoes_chegaram_checkout || 0);
      acc.orders_valid += Number(row.pedidos_aprovados_validos || 0);
      return acc;
    },
    { sessions: 0, sessions_add_to_cart: 0, sessions_reached_checkout: 0, orders_valid: 0 }
  );

  const prevFunnelSeries = Array.isArray(prevData?.funnel_daily) ? prevData.funnel_daily : [];
  const prevFunnelTotals = prevFunnelSeries.reduce(
    (acc, row) => {
      acc.sessions += Number(row.sessoes || 0);
      acc.sessions_add_to_cart += Number(row.sessoes_com_carrinho || 0);
      acc.sessions_reached_checkout += Number(row.sessoes_chegaram_checkout || 0);
      acc.orders_valid += Number(row.pedidos_aprovados_validos || 0);
      return acc;
    },
    { sessions: 0, sessions_add_to_cart: 0, sessions_reached_checkout: 0, orders_valid: 0 }
  );

  const ordersByHour = (Array.isArray(data?.orders_valid_by_hour) ? data.orders_valid_by_hour : []).map((r) => ({
    hour: r.hour,
    pedidos: Number(r.pedidos || 0),
  }));

  // Vendas atribuídas ao marketing (Pedido válido)
  // Preferimos o payload explícito de last-click (marketing_attribution) quando disponível.
  // Fallback: agrega a partir de `channels` (API antiga) sem filtrar só "paid" (isso derruba o total).
  const marketingAttributionRows = Array.isArray(data?.marketing_attribution) ? data.marketing_attribution : [];
  const marketingAttributionHasValues = marketingAttributionRows.some((r) => Number(r?.pedidos || 0) > 0);

  const channelsRows = Array.isArray(data?.channels) ? data.channels : [];

  // "Marketing" aqui = tudo que NÃO é Direct/Unattributed/Não mapeado.
  // (É o mesmo recorte que o Shopify costuma separar como Direct/Unattributed.)
  const excludedCanals = new Set([
    'direct',
    '(direct)',
    'unattributed',
    'an unknown source',
    'nao mapeado',
    'não mapeado',
    'unknown',
    'none',
    '',
  ]);

  // Normaliza e agrega por CANAL (somando todos os tipos)
  const marketingAggByCanal = (() => {
    const acc = new Map();

    const src = marketingAttributionHasValues
      ? marketingAttributionRows.map((r) => ({
          canal: r.canal,
          tipo: r.tipo,
          pedidos: Number(r.pedidos || 0),
        }))
      : channelsRows.map((r) => ({
          canal: r.canal,
          tipo: r.tipo,
          pedidos: Number(r.pedidos || 0),
        }));

    for (const r of src) {
      const canalRaw = String(r?.canal ?? '').trim();
      if (!canalRaw) continue;

      const canalKey = canalRaw.toLowerCase();
      if (excludedCanals.has(canalKey)) continue;

      const pedidos = Number(r?.pedidos || 0);
      if (!Number.isFinite(pedidos) || pedidos <= 0) continue;

      const cur = acc.get(canalKey) || { canal: canalRaw, pedidos: 0 };
      cur.pedidos += pedidos;
      acc.set(canalKey, cur);
    }

    return Array.from(acc.values());
  })();

  const marketingOrdersTotal =
    Number(data?.marketing_attribution_totals?.orders || 0) ||
    marketingAggByCanal.reduce((acc, r) => acc + Number(r.pedidos || 0), 0);

  // Donut: top N + Outros
  const marketingDonutData = (() => {
    const sorted = [...marketingAggByCanal].sort((a, b) => Number(b.pedidos || 0) - Number(a.pedidos || 0));

    const topN = 6;
    const top = sorted.slice(0, topN);
    const rest = sorted.slice(topN);
    const restTotal = rest.reduce((acc, r) => acc + Number(r.pedidos || 0), 0);

    const out = top
      .map((r) => ({
        name: String(r.canal || '').toLowerCase(),
        value: Number(r.pedidos || 0),
      }))
      .filter((x) => x.value > 0);

    if (restTotal > 0) out.push({ name: 'outros', value: restTotal });

    return out;
  })();

  // Donut: Clientes novos x recorrentes (Pedido válido)
  // Estrutura esperada pelo ShopDonutCard: [{ name, value }]
  const customersDonut = [
    { name: 'novo', value: ordersNew },
    { name: 'recorrente', value: ordersReturning },
  ].filter((x) => Number(x.value || 0) > 0);

  // Top items: lista completa (API nova) ou fallback (API antiga)
  const topItems = Array.isArray(data?.top_items_sold) ? data.top_items_sold
    : (Array.isArray(data?.top_items) ? data.top_items : (Array.isArray(data?.items_sold) ? data.items_sold : []));
  // Extras: custo de marketing (mantém feature atual)
  const marketingCostTotal = Number(k.custo_marketing || 0);
  const marketingCostPrevTotal = Number(kp.custo_marketing || 0);

  const marketingCostSeries = useMemo(() => {
    const cur = Array.isArray(data?.marketing_cost_daily) ? data.marketing_cost_daily : [];
    const prev = Array.isArray(prevData?.marketing_cost_daily) ? prevData.marketing_cost_daily : [];

    const mapPrev = new Map(prev.map((r) => [r.data, Number(r.custo_total || 0)]));
    return cur.map((r) => ({
      data: r.data,
      atual: Number(r.custo_total || 0),
      anterior: mapPrev.get(r.data) || 0,
    }));
  }, [data, prevData]);

  const channelsPeriod = Array.isArray(data?.channels) ? data.channels : [];

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div>
      {/* Toolbar (chips) */}
      <div className="daily-toolbar">
        <div className="chip-menu" ref={periodMenuRef}>
          <Chip
            icon={<IconCalendar />}
            label={periodLabel}
            rightIcon={<IconChevronDown />}
            onClick={() => setPeriodMenuOpen((v) => !v)}
          />

          {periodMenuOpen ? (
            <div className="chip-menu-popover">
              <div className="chip-menu-section-title">Período</div>
              <div className="chip-menu-items">
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`chip-menu-item ${presetId === p.id ? 'chip-menu-item--active' : ''}`}
                    onClick={() => {
                      const r = p.getRange();
                      setPresetId(p.id);
                      setStart(r.start);
                      setEnd(r.end);
                      setPeriodMenuOpen(false);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="chip-menu-divider" />

              <div className="chip-menu-section-title">Personalizado</div>
              <div className="chip-menu-custom">
                <label className="chip-menu-custom-field">
                  <span>Início</span>
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => {
                      setPresetId('custom');
                      setStart(e.target.value);
                    }}
                  />
                </label>

                <label className="chip-menu-custom-field">
                  <span>Fim</span>
                  <input
                    type="date"
                    value={end}
                    onChange={(e) => {
                      setPresetId('custom');
                      setEnd(e.target.value);
                    }}
                  />
                </label>

                <button
                  type="button"
                  className="chip-menu-apply"
                  onClick={() => {
                    setPeriodMenuOpen(false);
                  }}
                >
                  Aplicar
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="chip-menu" ref={compareMenuRef}>
          <Chip
            icon={<IconCompare />}
            label={comparisonLabel}
            rightIcon={<IconChevronDown />}
            onClick={() => setCompareMenuOpen((v) => !v)}
          />

          {compareMenuOpen ? (
            <div className="chip-menu-popover">
              <div className="chip-menu-section-title">Comparação</div>
              <div className="chip-menu-items">
                <button
                  type="button"
                  className={`chip-menu-item ${!compareEnabled ? 'chip-menu-item--active' : ''}`}
                  onClick={() => {
                    setCompareEnabled(false);
                    setCompareMenuOpen(false);
                  }}
                >
                  Sem comparação
                </button>
                <button
                  type="button"
                  className={`chip-menu-item ${compareEnabled ? 'chip-menu-item--active' : ''}`}
                  onClick={() => {
                    setCompareEnabled(true);
                    setCompareMenuOpen(false);
                  }}
                >
                  Comparar com período anterior
                </button>
              </div>
              {compareEnabled ? (
                <div className="chip-menu-hint">
                  Período anterior: {prevRangeFromCurrent(start, end).prevStart} → {prevRangeFromCurrent(start, end).prevEnd}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <Chip icon={<IconCurrency />} label="BRL R$" staticChip />

        <div className="daily-toolbar-spacer" />

        <button
          type="button"
          className="chip chip--icon"
          title="Forçar atualização (bust=1)"
          onClick={() => load({ bust: true })}
        >
          <IconRefresh />
          <span className="chip-label">Atualizar</span>
        </button>
      </div>

      {/* Title */}
      <div className="daily-title-row">
        <h2 className="page-title" style={{ margin: 0 }}>Resultados Diários</h2>
        <div className="daily-title-right">
          <span className="muted" style={{ fontSize: 12 }}>Reise</span>
        </div>
      </div>

      {error ? (
        <div className="panel" style={{ marginTop: 12, borderColor: 'rgba(235, 87, 87, 0.35)' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Erro</div>
          <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="muted" style={{ marginTop: 10 }}>Carregando…</div>
      ) : null}

      {/* Main grid */}
      <div className="daily-grid" style={{ marginTop: 14 }}>
        <div className="daily-kpis">
          <KpiCard
            title="Faturamento - Real"
            value={formatBRL(revenue)}
            trend={compareEnabled ? {
              label: formatDelta(revenue, revenuePrev) || '—',
              direction: deltaDirection(revenue, revenuePrev),
            } : undefined}
          />

          <KpiCard
            title="Pedidos Válidos - Real"
            value={Number(orders || 0).toLocaleString('pt-BR')}
            trend={compareEnabled ? {
              label: formatDelta(orders, ordersPrev) || '—',
              direction: deltaDirection(orders, ordersPrev),
            } : undefined}
          />

          <KpiCard
            title="Ticket Médio - Real"
            value={formatBRL(aov)}
            trend={compareEnabled ? {
              label: formatDelta(aov, aovPrev) || '—',
              direction: deltaDirection(aov, aovPrev),
            } : undefined}
          />

          <KpiCard
            title="Taxa de conversão"
            value={formatPct(conv)}
            trend={compareEnabled ? {
              label: formatDelta(conv, convPrev) || '—',
              direction: deltaDirection(conv, convPrev),
            } : undefined}
          />
        </div>

        <ShopFunnelCard
          title="Detalhamento da taxa de conversão"
          totals={funnelTotals}
          prevTotals={compareEnabled ? prevFunnelTotals : undefined}
          showComparison={compareEnabled}
        />

        <ShopOrdersByHourCard
          title="Pedidos Válidos - Por Hora"
          total={orders}
          series={ordersByHour}
        />
      </div>

      {/* Bottom grid */}
      <div className="daily-bottom-grid">
        <ShopDonutCard
          title="Vendas atribuídas ao marketing (Pedido válido)"
          centerValue={marketingOrdersTotal || marketingDonutData.reduce((acc, x) => acc + x.value, 0)}
          centerLabel=""
          deltaLabel={compareEnabled ? undefined : '—'}
          deltaClass="delta--neutral"
          data={marketingDonutData}
        />

        <ShopDonutCard
          title="Clientes novos x recorrentes (Pedido válido)"
          centerValue={ordersNew + ordersReturning}
          centerLabel=""
          deltaLabel={compareEnabled ? undefined : '—'}
          deltaClass="delta--neutral"
          data={customersDonut}
        />

        <ShopTopItemsCard
          title="Total de itens vendidos (Pedido válido)"
          items={topItems}
        />
      </div>

      {/* Extras: mantém blocos antigos sem poluir a UI principal */}
      <details className="daily-extras" style={{ marginTop: 14 }}>
        <summary className="daily-extras-summary">Detalhes (custo e canais)</summary>

        <div className="grid-2" style={{ marginTop: 12 }}>
          <ShopMarketingCostCard
            title="Custo de marketing"
            total={marketingCostTotal}
            prevTotal={compareEnabled ? marketingCostPrevTotal : undefined}
            roas={Number(k.roas || 0)}
            cps={orders > 0 ? marketingCostTotal / orders : 0}
            series={compareEnabled ? marketingCostSeries : (Array.isArray(data?.marketing_cost_daily) ? data.marketing_cost_daily.map((r) => ({ data: r.data, atual: Number(r.custo_total || 0), anterior: 0 })) : [])}
          />

          <div className="panel" style={{ padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Custo por canal (período)</div>
            <div className="channels-table-wrap">
              <table className="channels-table">
                <thead>
                  <tr>
                    <th>Canal</th>
                    <th style={{ textAlign: 'right' }}>Custo</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(data?.marketing_cost_by_channel) ? data.marketing_cost_by_channel : []).map((r) => (
                    <tr key={r.canal}>
                      <td>{r.canal}</td>
                      <td style={{ textAlign: 'right' }}>{formatBRL(r.custo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 12 }}>
          <div className="panel-title" style={{ paddingBottom: 8 }}>Canais (Shopify-like) — período</div>
          <div className="channels-table-wrap">
            <table className="channels-table">
              <thead>
                <tr>
                  <th>Canal</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'right' }}>Sessões</th>
                  <th style={{ textAlign: 'right' }}>Vendas</th>
                  <th style={{ textAlign: 'right' }}>Pedidos</th>
                  <th style={{ textAlign: 'right' }}>Conv.</th>
                  <th style={{ textAlign: 'right' }}>AOV</th>
                  <th style={{ textAlign: 'right' }}>Novos</th>
                  <th style={{ textAlign: 'right' }}>Recorr.</th>
                </tr>
              </thead>
              <tbody>
                {channelsPeriod.map((r) => (
                  <tr key={`${r.canal}|${r.tipo}`}>
                    <td>{r.canal}</td>
                    <td>
                      <span className={`badge ${String(r.tipo).toLowerCase() === 'paid' ? 'badge--paid' : String(r.tipo).toLowerCase() === 'email' ? 'badge--email' : 'badge--unknown'}`}>
                        {r.tipo}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>{Number(r.sessoes || 0).toLocaleString('pt-BR')}</td>
                    <td style={{ textAlign: 'right' }}>{formatBRL(r.vendas)}</td>
                    <td style={{ textAlign: 'right' }}>{Number(r.pedidos || 0).toLocaleString('pt-BR')}</td>
                    <td style={{ textAlign: 'right' }}>{formatPct(r.taxa_conversao)}</td>
                    <td style={{ textAlign: 'right' }}>{formatBRL(r.aov)}</td>
                    <td style={{ textAlign: 'right' }}>{Number(r.pedidos_novos_clientes || 0).toLocaleString('pt-BR')}</td>
                    <td style={{ textAlign: 'right' }}>{Number(r.pedidos_clientes_recorrentes || 0).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}

export default GestaoShopify;