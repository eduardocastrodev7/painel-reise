// src/components/dashboard/ShopConversionLineCard.jsx

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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

function pctLabel(frac) {
  const n = Number(frac || 0) * 100;
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
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

export function ShopConversionLineCard({
  title = 'Taxa de conversão ao longo do tempo',
  total,
  prevTotal,
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
        <div className="chart-metric">{pctLabel(total)}</div>
        {d ? (
          <div className={`chart-delta ${up ? 'delta--up' : 'delta--down'}`}>▲ {d}</div>
        ) : (
          <div className="chart-delta delta--neutral">—</div>
        )}
      </div>

      <div className="chart-area" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
              tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
            />
            <Tooltip
              labelFormatter={(v) => `Data: ${formatShortDate(v)}`}
              formatter={(v, name) => [`${Number(v).toFixed(2)}%`, name]}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: 12,
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="atual"
              name="Atual"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="anterior"
              name="Anterior"
              stroke="var(--border)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
