// src/components/dashboard/ShopDonutCard.jsx

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

function defaultFormatter(v) {
  return String(v ?? '');
}

export function ShopDonutCard({
  title,
  centerValue,
  centerSub,
  deltaLabel,
  deltaClass,
  data,
  valueFormatter = defaultFormatter,
  colors,
}) {
  const safeData = Array.isArray(data) ? data : [];
  const safeColors = Array.isArray(colors) && colors.length ? colors : [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ];

  return (
    <section className="panel chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
      </div>

      <div className="donut-layout">
        <div className="donut-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={safeData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={66}
                paddingAngle={3}
                stroke="none"
              >
                {safeData.map((_, i) => (
                  <Cell key={`c_${i}`} fill={safeColors[i % safeColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, name) => [valueFormatter(v), name]}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="donut-center">
            <div className="donut-center-value">{centerValue}</div>
            {deltaLabel ? (
              <div className={`donut-center-delta ${deltaClass || ''}`.trim()}>{deltaLabel}</div>
            ) : null}
            {centerSub ? <div className="donut-center-sub">{centerSub}</div> : null}
          </div>
        </div>

        <div className="donut-legend">
          {safeData.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>Sem dados.</div>
          ) : (
            safeData.map((item, i) => (
              <div className="donut-legend-row" key={item.name || i}>
                <span
                  className="donut-legend-swatch"
                  style={{ background: safeColors[i % safeColors.length] }}
                />
                <span className="donut-legend-name">{item.name}</span>
                <span className="donut-legend-value">{valueFormatter(item.value)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
