// src/components/dashboard/ShopTopItemsCard.jsx

import { useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';

function formatInt(v) {
  return Number(v || 0).toLocaleString('pt-BR');
}

function normalizeItems(items) {
  const data = Array.isArray(items) ? items : [];
  return data
    .map((it) => ({
      // sku pode existir no payload, mas a UI NÃO mostra
      sku: it?.sku || '',
      item_name: it?.item_name || '',
      units: Number(it?.units || 0),
    }))
    .filter((it) => (it.item_name || it.sku) && Number(it.units || 0) > 0)
    .sort((a, b) => b.units - a.units);
}

/**
 * Requisito:
 * - Mostrar preview (top N)
 * - No final do card: blur/fade + botão "Ver todos"
 * - Ao clicar, abrir modal com TODOS os itens
 * - NÃO exibir SKU
 */
export function ShopTopItemsCard({
  title = 'Total de itens vendidos (Pedido válido)',
  items,
  previewCount = 10,
}) {
  const [open, setOpen] = useState(false);

  const all = useMemo(() => normalizeItems(items), [items]);
  const preview = all.slice(0, previewCount);
  const hasMore = all.length > previewCount;

  return (
    <section className="panel top-items-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
      </div>

      {all.length === 0 ? (
        <div className="muted" style={{ fontSize: 13, paddingTop: 10 }}>
          Sem dados de itens no período.
        </div>
      ) : (
        <>
          <div className="top-items-preview-wrap">
            <div className="top-items-list">
              {preview.map((it, idx) => {
                const key = `${it.item_name || it.sku}-${idx}`;
                return (
                  <div className="top-items-row" key={key}>
                    <div className="top-items-left">
                      <div className="top-items-name" title={it.item_name || ''}>
                        {it.item_name || '—'}
                      </div>
                    </div>
                    <div className="top-items-qty">{formatInt(it.units)}</div>
                  </div>
                );
              })}
            </div>

            {hasMore ? (
              <div className="top-items-fade">
                <button className="top-items-btn" type="button" onClick={() => setOpen(true)}>
                  Ver todos
                </button>
              </div>
            ) : null}
          </div>

          <Modal open={open} title={title} onClose={() => setOpen(false)}>
            <div className="top-items-list" style={{ marginTop: 0 }}>
              {all.map((it, idx) => {
                const key = `${it.item_name || it.sku}-all-${idx}`;
                return (
                  <div className="top-items-row" key={key}>
                    <div className="top-items-left">
                      <div className="top-items-name" title={it.item_name || ''}>
                        {it.item_name || '—'}
                      </div>
                    </div>
                    <div className="top-items-qty">{formatInt(it.units)}</div>
                  </div>
                );
              })}
            </div>
          </Modal>
        </>
      )}
    </section>
  );
}

export default ShopTopItemsCard;
