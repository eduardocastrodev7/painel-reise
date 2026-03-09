// src/components/dashboard/ShopMarketingCostCard.jsx

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

function formatBRL(v) {
  return Number(v || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatShortDate(ymd) {
  const dt = new Date(`${ymd}T00:00:00`);
  const d = String(dt.getDate()).padStart(2, '0');
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
}

function xInterval(n) {
  if (n <= 8) return 0;
  if (n <= 16) return 1;
  if (n <= 24) return 2;
  return Math.ceil(n / 12);
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

function formatRoas(roas) {
  const n = Number(roas);
  if (!Number.isFinite(n) || n === 0) return '—';
  return `${n.toFixed(2)}x`;
}

export function ShopMarketingCostCard({
  title = 'Custo de marketing',
  total,
  prevTotal,
  roas,
  cps,
  series,
}) {
  const d = formatDelta(total, prevTotal);
  const up = d && Number(total) >= Number(prevTotal);
  const data = Array.isArray(series) ? series : [];

  return (
    <section className="panel chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
      </div>

      <div className="chart-metric-row">
        <div className="chart-metric">{formatBRL(total)}</div>
        {d ? (
          <div className={`chart-delta ${up ? 'delta--up' : 'delta--down'}`}>▲ {d}</div>
        ) : (
          <div className="chart-delta delta--neutral">—</div>
        )}
      </div>

      <div className="mini-metrics">
        <div className="mini-metric">
          <div className="mini-metric-label">ROAS</div>
          <div className="mini-metric-value">{formatRoas(roas)}</div>
        </div>

        <div className="mini-metric">
          <div className="mini-metric-label">Custo por pedido</div>
          <div className="mini-metric-value">{Number(cps || 0) > 0 ? formatBRL(cps) : '—'}</div>
        </div>
      </div>

      <div className="chart-area" style={{ height: 220 }}>
        {data.length === 0 ? (
          <div className="muted" style={{ fontSize: 13, paddingTop: 10 }}>Sem dados de custo no período.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(29,29,27,0.10)" />
              <XAxis
                dataKey="data"
                tickFormatter={formatShortDate}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                interval={xInterval(data.length)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  const n = Number(v || 0);
                  if (n === 0) return '0';
                  // compacto: 1.2k, 1.2M etc
                  return n.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
                }}
              />
              <Tooltip
                labelFormatter={(v) => `Data: ${formatShortDate(v)}`}
                formatter={(v, name) => [formatBRL(v), name]}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: 12,
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="atual" name="Atual" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={10} />
              <Bar dataKey="anterior" name="Anterior" fill="var(--border)" radius={[4, 4, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
