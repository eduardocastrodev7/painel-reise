// src/components/layout/Topbar.jsx

export function Topbar({
  onOpenMobileMenu,
  darkMode,
  onToggleDarkMode,
  presentationMode,
  onTogglePresentationMode,
  subtitle = 'Marketing Analytics',
  title = 'Gestão',
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Abrir ou fechar menu lateral"
        >
          <span />
          <span />
          <span />
        </button>

        <div>
          <div className="topbar-subtitle">{subtitle}</div>
          <h1 className="topbar-title">{title}</h1>
        </div>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className={'mode-chip' + (presentationMode ? ' mode-chip--active' : '')}
          onClick={onTogglePresentationMode}
        >
          <span className="mode-chip-dot" />
          <span className="mode-chip-label">Apresentação</span>
        </button>

        <button
          type="button"
          className={'mode-chip mode-chip--icon' + (darkMode ? ' mode-chip--active' : '')}
          onClick={onToggleDarkMode}
        >
          <span className="mode-chip-icon">{darkMode ? '🌙' : '☀️'}</span>
          <span className="mode-chip-label">{darkMode ? 'Escuro' : 'Claro'}</span>
        </button>
      </div>
    </header>
  );
}