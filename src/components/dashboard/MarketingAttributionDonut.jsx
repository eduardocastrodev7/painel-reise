// src/components/dashboard/MarketingAttributionDonut.jsx
import React, { useMemo } from "react";
import { buildMarketingDonut } from "../../utils/marketingAttribution";

/**
 * Drop-in helper component.
 * Props:
 * - payload: object returned by /v1/shopify/gestao (or a nested object you already have)
 * - DonutComponent: optional, your existing Donut component (preferred)
 * - title: optional
 *
 * Usage:
 *   <MarketingAttributionDonut
 *      payload={payload}
 *      DonutComponent={DonutCard}
 *      title="Vendas atribuídas ao marketing (Pedido válido)"
 *   />
 *
 * If you don't pass DonutComponent, it renders a simple fallback list.
 */
export default function MarketingAttributionDonut({ payload, DonutComponent, title }) {
  const donut = useMemo(() => buildMarketingDonut(payload, 6), [payload]);

  const theTitle = title || "Vendas atribuídas ao marketing (Pedido válido)";

  if (DonutComponent) {
    return <DonutComponent title={theTitle} total={donut.total} series={donut.series} />;
  }

  // Fallback render (so you can test quickly)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontWeight: 800 }}>{theTitle}</div>
      <div style={{ fontSize: 28, fontWeight: 900 }}>{donut.total}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {donut.series.map((s) => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{s.label}</span>
            <span style={{ fontWeight: 800 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
