// src/App.jsx
import { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { GestaoShopify } from './pages/GestaoShopify';

export default function App() {
  const [section, setSection] = useState('gestao');

  const [darkMode, setDarkMode] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('reise-theme');
    if (stored === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('reise-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ✅ trava o scroll do fundo quando o menu mobile está aberto
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const showSidebar = !presentationMode;

  const titleBySection = {
    gestao: 'Gestão',
    trafego: 'Tráfego',
    recorrencia: 'Recorrência',
    produto: 'Produto',
    cohort: 'Cohort',
  };

  return (
    <div className={`app-root ${darkMode ? 'theme-dark' : ''} ${presentationMode ? 'presentation-mode' : ''}`}>
      {showSidebar && mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {showSidebar && (
        <Sidebar
          section={section}
          onChangeSection={(s) => {
            setSection(s);
            setMobileSidebarOpen(false);
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      )}

      <main className="main">
        <Topbar
          onOpenMobileMenu={() => setMobileSidebarOpen((v) => !v)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((v) => !v)}
          presentationMode={presentationMode}
          onTogglePresentationMode={() => setPresentationMode((v) => !v)}
          subtitle="Dashboard Gerencial"
          title={titleBySection[section] || 'Dashboard'}
        />

        {section === 'gestao' && <GestaoShopify presentationMode={presentationMode} />}

        {section !== 'gestao' && (
          <section className="panel" style={{ marginTop: 12 }}>
            <div className="panel-header">
              <h2>Em breve</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Essa visão entra na próxima etapa.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}