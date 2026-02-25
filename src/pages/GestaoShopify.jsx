// src/pages/GestaoShopify.jsx
import { useEffect, useMemo, useState } from 'react';
import { DateRangeFilter } from '../components/dashboard/DateRangeFilter';
import { KpiCard } from '../components/dashboard/KpiCard';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { getGestao } from '../lib/ssotApi';

function toYmdLocal(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

function diffDaysInclusive(start, end) {
  const ms = 24 * 60 * 60 * 1000;
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((e.getTime() - s.getTime()) / ms) + 1;
}

function formatBRL(v) {
  return Number(v || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatInt(v) {
  return Math.round(Number(v || 0)).toLocaleString('pt-BR');
}

function formatPct(frac, digits = 2) {
  const n = Number(frac || 0) * 100;
  return `${n.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

function formatDateShortFromYmd(ymd) {
  const dt = new Date(`${ymd}T00:00:00`);
  const d = String(dt.getDate()).padStart(2, '0');
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
}

function formatRangeShort(startDate, endDate) {
  const s = `${String(startDate.getDate()).padStart(2, '0')}/${String(startDate.getMonth() + 1).padStart(2, '0')}`;
  const e = `${String(endDate.getDate()).padStart(2, '0')}/${String(endDate.getMonth() + 1).padStart(2, '0')}`;
  return `${s} → ${e}`;
}

function deltaFrac(current, previous) {
  const c = Number(current);
  const p = Number(previous);
  if (!Number.isFinite(c) || !Number.isFinite(p) || p === 0) return null;
  return (c - p) / Math.abs(p);
}

function Delta({ current, previous, label = 'vs período anterior' }) {
  const d = deltaFrac(current, previous);

  if (d === null) {
    return (
      <span className="delta delta--neutral">
        — <span className="delta-label">{label}</span>
      </span>
    );
  }

  const up = d > 0;
  const down = d < 0;
  const cls = up ? 'delta--up' : down ? 'delta--down' : 'delta--neutral';
  const arrow = up ? '▲' : down ? '▼' : '•';
  const sign = d > 0 ? '+' : '';
  const pct = `${sign}${(d * 100).toFixed(1)}%`;

  return (
    <span className={`delta ${cls}`}>
      {arrow} {pct} <span className="delta-label">{label}</span>
    </span>
  );
}

function TipoBadge({ tipo }) {
  const t = String(tipo || 'unknown').toLowerCase();
  const cls =
    t === 'paid' ? 'badge--paid' :
    t === 'email' ? 'badge--email' :
    'badge--unknown';

  return <span className={`badge ${cls}`}>{t}</span>;
}

export function GestaoShopify({ presentationMode }) {
  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const [startDate, setStartDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [endDate, setEndDate] = useState(() => today);

  const minDate = useMemo(() => new Date(today.getFullYear(), today.getMonth() - 12, 1), [today]);
  const maxDate = today;

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const [data, setData] = useState(null);          // período atual
  const [compareData, setCompareData] = useState(null); // período anterior
  const [compareRange, setCompareRange] = useState(null);

  const [openChannelsModal, setOpenChannelsModal] = useState(false);
  const [openDailyModal, setOpenDailyModal] = useState(false);

  useEffect(() => {
    const ac = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setErro(null);

        const start = toYmdLocal(startDate);
        const end = toYmdLocal(endDate);

        const days = diffDaysInclusive(startDate, endDate);
        const prevStartDate = addDays(startDate, -days);
        const prevEndDate = addDays(endDate, -days);

        setCompareRange({ startDate: prevStartDate, endDate: prevEndDate });

        const currentPromise = getGestao({ start, end }, { signal: ac.signal });
        const prevPromise = getGestao(
          { start: toYmdLocal(prevStartDate), end: toYmdLocal(prevEndDate) },
          { signal: ac.signal },
        );

        // não deixa a comparação derrubar tudo se falhar
        const [curRes, prevRes] = await Promise.allSettled([currentPromise, prevPromise]);

        if (curRes.status === 'rejected') throw curRes.reason;

        setData(curRes.value);
        setCompareData(prevRes.status === 'fulfilled' ? prevRes.value : null);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setErro(e?.message || 'Erro ao carregar.');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, [startDate, endDate]);

  const kpis = data?.kpis || {};
  const kpisPrev = compareData?.kpis || {};

  const funnelDaily = data?.funnel_daily || [];
  const channels = data?.channels || [];

  const funnelDailyPrev = compareData?.funnel_daily || [];

  const isFirstLoad = loading && !data && !erro;

  const funnelTotals = useMemo(() => {
    const t = { sessoes: 0, carrinho: 0, checkout: 0, pedidos: 0 };

    for (const r of funnelDaily) {
      t.sessoes += Number(r.sessoes || 0);
      t.carrinho += Number(r.sessoes_com_carrinho || 0);
      t.checkout += Number(r.sessoes_chegaram_checkout || 0);
      t.pedidos += Number(r.pedidos_aprovados_validos || 0);
    }

    return {
      ...t,
      addToCartRate: t.sessoes ? t.carrinho / t.sessoes : 0,
      checkoutRate: t.sessoes ? t.checkout / t.sessoes : 0,
      purchaseRate: t.sessoes ? t.pedidos / t.sessoes : 0,
      checkoutToPurchase: t.checkout ? t.pedidos / t.checkout : 0,
    };
  }, [funnelDaily]);

  const funnelTotalsPrev = useMemo(() => {
    const t = { sessoes: 0, carrinho: 0, checkout: 0, pedidos: 0 };
    for (const r of funnelDailyPrev) {
      t.sessoes += Number(r.sessoes || 0);
      t.carrinho += Number(r.sessoes_com_carrinho || 0);
      t.checkout += Number(r.sessoes_chegaram_checkout || 0);
      t.pedidos += Number(r.pedidos_aprovados_validos || 0);
    }
    return t;
  }, [funnelDailyPrev]);

  const channelsTotal = useMemo(() => {
    let sessoes = 0;
    let vendas = 0;
    let pedidos = 0;
    let novos = 0;
    let recorrentes = 0;

    for (const c of channels) {
      sessoes += Number(c.sessoes || 0);
      vendas += Number(c.vendas || 0);
      pedidos += Number(c.pedidos || 0);
      novos += Number(c.pedidos_novos_clientes || 0);
      recorrentes += Number(c.pedidos_clientes_recorrentes || 0);
    }

    return {
      sessoes,
      vendas,
      pedidos,
      novos,
      recorrentes,
      conv: sessoes ? pedidos / sessoes : 0,
      ticketMedio: pedidos ? vendas / pedidos : 0,
    };
  }, [channels]);

  const onChangePeriodo = ({ startDate: s, endDate: e, start, end }) => {
    const inicio = s || start;
    const fim = e || end || inicio;
    if (!inicio || !fim) return;
    setStartDate(inicio);
    setEndDate(fim);
  };

  const compareLabel =
    compareRange ? `Comparando com ${formatRangeShort(compareRange.startDate, compareRange.endDate)}` : null;

  // UX: limita listas
  const dailyPreview = useMemo(() => {
    const n = 7; // últimos 7 dias
    return funnelDaily.length > n ? funnelDaily.slice(-n) : funnelDaily;
  }, [funnelDaily]);

  const channelsPreview = useMemo(() => {
    const n = 5; // top 5
    return channels.length > n ? channels.slice(0, n) : channels;
  }, [channels]);

  const showDailyVerTudo = funnelDaily.length > dailyPreview.length;
  const showChannelsVerTudo = channels.length > channelsPreview.length;

  return (
    <>
      <DateRangeFilter
        minDate={minDate}
        maxDate={maxDate}
        startDate={startDate}
        endDate={endDate}
        onChange={onChangePeriodo}
      />

      {loading && data && <div className="loading-bar" />}

      {erro && (
        <section className="panel" style={{ marginTop: 12 }}>
          <div className="panel-header">
            <h2>Erro</h2>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{erro}</p>
        </section>
      )}

      {/* Performance */}
      <section className="kpi-section">
        <div className="kpi-group">
          <div className="kpi-group-title-row">
            <div className="kpi-group-title">Performance</div>
            {compareLabel && <div className="kpi-compare-label">{compareLabel}</div>}
          </div>

          <div className="kpi-grid">
            <KpiCard
              title="Faturamento"
              description="Receita (SSOT)"
              style={{ '--i': 0 }}
              value={
                isFirstLoad ? <Skeleton height={28} width="72%" /> : (
                  <AnimatedNumber value={Number(kpis.vendas || 0)} formatFn={formatBRL} />
                )
              }
              trend={!isFirstLoad && compareData ? <Delta current={kpis.vendas} previous={kpisPrev.vendas} /> : null}
              subtitle="Receita"
            />

            <KpiCard
              title="Pedidos"
              description="Pedidos aprovados SSOT"
              style={{ '--i': 1 }}
              value={
                isFirstLoad ? <Skeleton height={28} width="45%" /> : (
                  <AnimatedNumber value={Number(kpis.pedidos || 0)} formatFn={(n) => formatInt(n)} />
                )
              }
              trend={!isFirstLoad && compareData ? <Delta current={kpis.pedidos} previous={kpisPrev.pedidos} /> : null}
              subtitle="Pedidos válidos"
            />

            <KpiCard
              title="Ticket médio"
              style={{ '--i': 2 }}
              value={
                isFirstLoad ? <Skeleton height={28} width="60%" /> : (
                  <AnimatedNumber value={Number(kpis.aov || 0)} formatFn={formatBRL} />
                )
              }
              trend={!isFirstLoad && compareData ? <Delta current={kpis.aov} previous={kpisPrev.aov} /> : null}
              subtitle="Ticket médio por pedido"
            />

            <KpiCard
              title="Sessões"
              description="ShopifyQL (sem GA4 como fonte principal)"
              style={{ '--i': 3 }}
              value={
                isFirstLoad ? <Skeleton height={28} width="55%" /> : (
                  <AnimatedNumber value={Number(kpis.sessoes || 0)} formatFn={(n) => formatInt(n)} />
                )
              }
              trend={!isFirstLoad && compareData ? <Delta current={kpis.sessoes} previous={kpisPrev.sessoes} /> : null}
              subtitle="Tráfego"
            />

            <KpiCard
              title="Conversão"
              style={{ '--i': 4 }}
              value={
                isFirstLoad ? <Skeleton height={28} width="40%" /> : (
                  <AnimatedNumber value={Number(kpis.taxa_conversao || 0)} formatFn={(n) => formatPct(n)} />
                )
              }
              trend={!isFirstLoad && compareData ? <Delta current={kpis.taxa_conversao} previous={kpisPrev.taxa_conversao} /> : null}
              subtitle="Pedidos / Sessões"
            />

            <KpiCard
              title="Novos / Recorrentes"
              style={{ '--i': 5 }}
              value={
                isFirstLoad ? <Skeleton height={28} width="70%" /> : (
                  <span>
                    <AnimatedNumber value={Number(kpis.pedidos_novos || 0)} formatFn={(n) => formatInt(n)} />
                    {' / '}
                    <AnimatedNumber value={Number(kpis.pedidos_recorrentes || 0)} formatFn={(n) => formatInt(n)} />
                  </span>
                )
              }
              trend={
                (!isFirstLoad && compareData) ? (
                  <span style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap' }}>
                    <Delta current={kpis.pedidos_novos} previous={kpisPrev.pedidos_novos} label="novos" />
                    <Delta current={kpis.pedidos_recorrentes} previous={kpisPrev.pedidos_recorrentes} label="recorrentes" />
                  </span>
                ) : null
              }
              subtitle="Pedidos"
            />
          </div>
        </div>
      </section>

      {/* Jornada */}
      <section className="panel" style={{ marginTop: 12 }}>
        <div className="panel-header">
          <h2>Evolução de jornada</h2>

          <div className="panel-actions">
            <span>Sessões → Carrinho → Checkout → Pedidos válidos</span>
            {showDailyVerTudo && (
              <button className="text-btn" onClick={() => setOpenDailyModal(true)}>
                VER TUDO
              </button>
            )}
          </div>
        </div>

        <div
          className="kpi-grid"
          style={{
            gridTemplateColumns: presentationMode
              ? 'repeat(4, minmax(160px, 1fr))'
              : 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          <KpiCard
            title="Sessões"
            style={{ '--i': 0 }}
            value={isFirstLoad ? <Skeleton height={28} width="60%" /> : formatInt(funnelTotals.sessoes)}
            trend={!isFirstLoad && compareData ? <Delta current={funnelTotals.sessoes} previous={funnelTotalsPrev.sessoes} /> : null}
          />
          <KpiCard
            title="Carrinho"
            style={{ '--i': 1 }}
            value={isFirstLoad ? <Skeleton height={28} width="55%" /> : formatInt(funnelTotals.carrinho)}
            trend={!isFirstLoad && compareData ? <Delta current={funnelTotals.carrinho} previous={funnelTotalsPrev.carrinho} /> : null}
            subtitle={`Taxa: ${formatPct(funnelTotals.addToCartRate)}`}
          />
          <KpiCard
            title="Checkout"
            style={{ '--i': 2 }}
            value={isFirstLoad ? <Skeleton height={28} width="55%" /> : formatInt(funnelTotals.checkout)}
            trend={!isFirstLoad && compareData ? <Delta current={funnelTotals.checkout} previous={funnelTotalsPrev.checkout} /> : null}
            subtitle={`Taxa: ${formatPct(funnelTotals.checkoutRate)}`}
          />
          <KpiCard
            title="Pedidos válidos"
            style={{ '--i': 3 }}
            value={isFirstLoad ? <Skeleton height={28} width="55%" /> : formatInt(funnelTotals.pedidos)}
            trend={!isFirstLoad && compareData ? <Delta current={funnelTotals.pedidos} previous={funnelTotalsPrev.pedidos} /> : null}
            subtitle={`Conv: ${formatPct(funnelTotals.purchaseRate)} | Checkout→Pedidos: ${formatPct(funnelTotals.checkoutToPurchase)}`}
          />
        </div>

        <div className="table-wrapper" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th className="num">Sessões</th>
                <th className="num">Carrinho</th>
                <th className="num">Checkout</th>
                <th className="num">Pedidos válidos</th>
                <th className="num">Conversão</th>
              </tr>
            </thead>
            <tbody>
              {isFirstLoad && (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk_f_${i}`}>
                    <td><Skeleton width="48px" height={14} radius={8} /></td>
                    <td className="num"><Skeleton width="70px" height={14} radius={8} /></td>
                    <td className="num"><Skeleton width="70px" height={14} radius={8} /></td>
                    <td className="num"><Skeleton width="70px" height={14} radius={8} /></td>
                    <td className="num"><Skeleton width="70px" height={14} radius={8} /></td>
                    <td className="num"><Skeleton width="56px" height={14} radius={8} /></td>
                  </tr>
                ))
              )}

              {!isFirstLoad && dailyPreview.length === 0 && (
                <tr className="row-no-data">
                  <td colSpan={6}>Sem dados no período.</td>
                </tr>
              )}

              {!isFirstLoad && dailyPreview.map((r) => (
                <tr key={r.data}>
                  <td>{formatDateShortFromYmd(r.data)}</td>
                  <td className="num">{formatInt(r.sessoes)}</td>
                  <td className="num">{formatInt(r.sessoes_com_carrinho)}</td>
                  <td className="num">{formatInt(r.sessoes_chegaram_checkout)}</td>
                  <td className="num">{formatInt(r.pedidos_aprovados_validos)}</td>
                  <td className="num">{formatPct(r.taxa_conversao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Canais */}
      <section className="panel" style={{ marginTop: 12 }}>
        <div className="panel-header">
          <h2>Canais</h2>

          <div className="panel-actions">
            {showChannelsVerTudo && (
              <button className="text-btn" onClick={() => setOpenChannelsModal(true)}>
                VER TUDO
              </button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Canal</th>
                <th>Tipo</th>
                <th className="num">Sessões</th>
                <th className="num">Vendas</th>
                <th className="num">Pedidos</th>
                <th className="num">Conversão</th>
                <th className="num">Ticket médio</th>
                <th className="num">Novos</th>
                <th className="num">Recorrentes</th>
              </tr>
            </thead>

            <tbody>
              {isFirstLoad && (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk_c_${i}`}>
                    <td><Skeleton width="120px" height={14} radius={8} /></td>
                    <td><Skeleton width="70px" height={14} radius={999} /></td>
                    <td className="num"><Skeleton width="70px" height={14} radius={8} /></td>
                    <td className="num"><Skeleton width="120px" height={14} radius={8} /></td>
                    <td className="num"><Skeleton width="60px" height={14} radius={8} /></td>
                    <td className="num"><Skeleton width="56px" height={14} radius={8} /></td>
                    <td className="num"><Skeleton width="100px" height={14} radius={8} /></td>
                    <td className="num"><Skeleton width="60px" height={14} radius={8} /></td>
                    <td className="num"><Skeleton width="80px" height={14} radius={8} /></td>
                  </tr>
                ))
              )}

              {!isFirstLoad && channelsPreview.length > 0 && (
                <tr style={{ fontWeight: 900 }}>
                  <td>Total</td>
                  <td>—</td>
                  <td className="num">{formatInt(channelsTotal.sessoes)}</td>
                  <td className="num">{formatBRL(channelsTotal.vendas)}</td>
                  <td className="num">{formatInt(channelsTotal.pedidos)}</td>
                  <td className="num">{formatPct(channelsTotal.conv)}</td>
                  <td className="num">{formatBRL(channelsTotal.ticketMedio)}</td>
                  <td className="num">{formatInt(channelsTotal.novos)}</td>
                  <td className="num">{formatInt(channelsTotal.recorrentes)}</td>
                </tr>
              )}

              {!isFirstLoad && channelsPreview.length === 0 && (
                <tr className="row-no-data">
                  <td colSpan={9}>Sem dados no período.</td>
                </tr>
              )}

              {!isFirstLoad && channelsPreview.map((c) => {
                const totalVendas = Number(channelsTotal.vendas || 0);
                const vendas = Number(c.vendas || 0);
                const share = totalVendas > 0 ? vendas / totalVendas : 0;

                return (
                  <tr key={`${c.canal}__${c.tipo}`}>
                    <td>{c.canal}</td>
                    <td><TipoBadge tipo={c.tipo} /></td>

                    <td className="num">{formatInt(c.sessoes)}</td>

                    <td className="num">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div>{formatBRL(vendas)}</div>
                        <div className="progress" style={{ '--bar': `${Math.max(0, Math.min(1, share)) * 100}%` }}>
                          <div className="progress-fill" />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatPct(share, 1)} do total</div>
                      </div>
                    </td>

                    <td className="num">{formatInt(c.pedidos)}</td>
                    <td className="num">{formatPct(c.taxa_conversao)}</td>
                    <td className="num">{formatBRL(c.aov)}</td>
                    <td className="num">{formatInt(c.pedidos_novos_clientes)}</td>
                    <td className="num">{formatInt(c.pedidos_clientes_recorrentes)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Sessões por data (lista completa) */}
      <Modal
        open={openDailyModal}
        title="Sessões por data (lista completa)"
        onClose={() => setOpenDailyModal(false)}
      >
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th className="num">Sessões</th>
                <th className="num">Carrinho</th>
                <th className="num">Checkout</th>
                <th className="num">Pedidos válidos</th>
                <th className="num">Conversão</th>
              </tr>
            </thead>
            <tbody>
              {funnelDaily.map((r) => (
                <tr key={`all_${r.data}`}>
                  <td>{formatDateShortFromYmd(r.data)}</td>
                  <td className="num">{formatInt(r.sessoes)}</td>
                  <td className="num">{formatInt(r.sessoes_com_carrinho)}</td>
                  <td className="num">{formatInt(r.sessoes_chegaram_checkout)}</td>
                  <td className="num">{formatInt(r.pedidos_aprovados_validos)}</td>
                  <td className="num">{formatPct(r.taxa_conversao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Modal: Canais (lista completa) */}
      <Modal
        open={openChannelsModal}
        title="Canais (lista completa)"
        onClose={() => setOpenChannelsModal(false)}
      >
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Canal</th>
                <th>Tipo</th>
                <th className="num">Sessões</th>
                <th className="num">Vendas</th>
                <th className="num">Pedidos</th>
                <th className="num">Conversão</th>
                <th className="num">Ticket médio</th>
                <th className="num">Novos</th>
                <th className="num">Recorrentes</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={`all_${c.canal}__${c.tipo}`}>
                  <td>{c.canal}</td>
                  <td><TipoBadge tipo={c.tipo} /></td>
                  <td className="num">{formatInt(c.sessoes)}</td>
                  <td className="num">{formatBRL(c.vendas)}</td>
                  <td className="num">{formatInt(c.pedidos)}</td>
                  <td className="num">{formatPct(c.taxa_conversao)}</td>
                  <td className="num">{formatBRL(c.aov)}</td>
                  <td className="num">{formatInt(c.pedidos_novos_clientes)}</td>
                  <td className="num">{formatInt(c.pedidos_clientes_recorrentes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}