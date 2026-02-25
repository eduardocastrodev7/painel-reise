// src/components/dashboard/KpiCard.jsx
export function KpiCard({
  title,
  value,
  subtitle,
  description,
  trend,
  className = '',
  style,
}) {
  return (
    <article className={`kpi-card ${className}`.trim()} style={style}>
      <div className="kpi-header-row">
        <div className="kpi-title">{title}</div>

        {description && (
          <div className="kpi-info">
            <span className="kpi-info-icon">i</span>
            <div className="kpi-info-tooltip">{description}</div>
          </div>
        )}
      </div>

      <div className="kpi-value">{value}</div>

      {trend && <div className="kpi-trend">{trend}</div>}
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </article>
  );
}