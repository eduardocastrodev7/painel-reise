// src/components/layout/Sidebar.jsx
import { useState } from 'react';

function ItemIcon({ id }) {
  const size = 18;
  const stroke = 'currentColor';

  if (id === 'gestao') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="10" width="4" height="11" rx="1.5" stroke={stroke} fill="none" strokeWidth="1.5" />
        <rect x="10" y="5" width="4" height="16" rx="1.5" stroke={stroke} fill="none" strokeWidth="1.5" />
        <rect x="17" y="2" width="4" height="19" rx="1.5" stroke={stroke} fill="none" strokeWidth="1.5" />
      </svg>
    );
  }

  if (id === 'trafego') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 19.5 9.5 9l4 6L20 4.5"
          stroke={stroke}
          fill="none"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 4.5h4v4"
          stroke={stroke}
          fill="none"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke={stroke} fill="none" strokeWidth="1.5" />
      <path
        d="M5 19.5C6.2 16.5 8.8 15 12 15s5.8 1.5 7 4.5"
        stroke={stroke}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Sidebar({
  section,
  onChangeSection,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}) {
  const items = [
    { id: 'gestao', label: 'Gestão (Shopify)' },
    { id: 'trafego', label: 'Tráfego', disabled: true },
    { id: 'recorrencia', label: 'Recorrência', disabled: true },
    { id: 'produto', label: 'Produto', disabled: true },
    { id: 'cohort', label: 'Cohort', disabled: true },
  ];

  // ✅ no mobile aberto, ignora colapsado
  const effectiveCollapsed = collapsed && !mobileOpen;

  const [logoOk, setLogoOk] = useState(true);

  const handleClickItem = (itemId, disabled) => {
    if (disabled) return;
    onChangeSection(itemId);
  };

  return (
    <aside
      className={
        'sidebar ' +
        (effectiveCollapsed ? 'sidebar--collapsed ' : '') +
        (mobileOpen ? 'sidebar--mobile-open' : '')
      }
    >
      <div className="sidebar-header">
        <div className="sidebar-logo-mark" aria-label="Reise">
          {logoOk ? (
            <img
              src="/logo-reise.png"
              alt="Reise"
              className="sidebar-logo-image"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span style={{ fontWeight: 900 }}>R</span>
          )}
        </div>

        {!effectiveCollapsed && (
          <div className="sidebar-logo-text">
            <span className="logo-title">Reise</span>
            <span className="logo-subtitle">Dashboard Gerencial</span>
          </div>
        )}

        {mobileOpen ? (
          <button type="button" className="sidebar-close" onClick={onCloseMobile} aria-label="Fechar menu">
            ✕
          </button>
        ) : (
          <button type="button" className="sidebar-toggle" onClick={onToggleCollapsed} aria-label="Recolher ou expandir menu">
            <span className="sidebar-toggle-line" />
            <span className="sidebar-toggle-line" />
            <span className="sidebar-toggle-line" />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {!effectiveCollapsed && <div className="sidebar-nav-label">Visões</div>}

        {items.map((item) => (
          <button
            key={item.id}
            className={
              'sidebar-item' +
              (section === item.id ? ' active' : '') +
              (item.disabled ? ' disabled' : '')
            }
            onClick={() => handleClickItem(item.id, item.disabled)}
            title={effectiveCollapsed ? item.label : undefined}
          >
            <span className="sidebar-item-left">
              <span className="sidebar-icon-wrap">
                <ItemIcon id={item.id} />
              </span>
              {!effectiveCollapsed && <span>{item.label}</span>}
            </span>

            {!effectiveCollapsed && item.disabled && <span className="soon-pill">em breve</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}