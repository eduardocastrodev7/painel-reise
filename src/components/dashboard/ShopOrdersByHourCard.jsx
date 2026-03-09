// src/components/dashboard/ShopOrdersByHourCard.jsx

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function formatHourLabel(h) {
  const s = String(h ?? '').padStart(2, '0');
  return s;
}

function formatInt(v) {
  return Number(v || 0).toLocaleString('pt-BR');
}

export function ShopOrdersByHourCard({
  title = 'Pedidos Válidos - Por Hora',
  total,
  series,
}) {
  const data = Array.isArray(series) ? series : [];

  return (
    <section className="panel chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
      </div>

      <div className="chart-metric-row">
        <div className="chart-metric">{formatInt(total)}</div>
      </div>

      <div className="chart-area" style={{ height: 260 }}>
        {data.length === 0 ? (
          <div className="muted" style={{ fontSize: 13, paddingTop: 10 }}>
            Sem dados no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap={14}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(29,29,27,0.10)" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                tickFormatter={formatHourLabel}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  const n = Number(v || 0);
                  if (n === 0) return '0';
                  return n.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
                }}
              />
              <Tooltip
                labelFormatter={(hour) => `Hora: ${String(hour).padStart(2, '0')}h`}
                formatter={(v) => [formatInt(v), 'Pedidos válidos']}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="pedidos" name="Pedidos" fill="var(--chart-1)" radius={[6, 6, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
