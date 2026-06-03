import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminEmpresas from './AdminEmpresas';
import AdminSedes from './AdminSedes';
import AdminUsuarios from './AdminUsuarios';
import AdminReportes from './AdminReportes';

interface Tab {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

const TABS: Tab[] = [
  { id: 'reportes', label: 'Reportes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    desc: 'Historial de reportes generados' },
  { id: 'empresas', label: 'Empresas', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    desc: 'Gestion de empresas registradas' },
  { id: 'sedes', label: 'Sedes', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
    desc: 'Puntos de trabajo por empresa' },
  { id: 'usuarios', label: 'Usuarios', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    desc: 'Tecnicos y administradores' },
];

export default function AdminDashboard() {
  const { perfil, logout } = useAuth();
  const [tab, setTab] = useState('reportes');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-gradient-to-b from-primary-900 to-black text-white">
        <div className="p-5 border-b border-primary-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">GMP Admin</h1>
              <p className="text-xs text-primary-300">@{perfil?.username}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 space-y-1 px-3">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                tab === t.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'text-primary-200 hover:bg-white/10 hover:text-white'
              }`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
              <div className="text-left">
                <div>{t.label}</div>
                <div className={`text-[10px] leading-tight ${tab === t.id ? 'text-white/70' : 'text-primary-400'}`}>{t.desc}</div>
              </div>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {perfil?.nombre_completo?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="text-sm text-white truncate">{perfil?.nombre_completo}</div>
          </div>
          <button onClick={logout}
            className="w-full py-2.5 px-4 text-sm text-primary-300 hover:text-white hover:bg-white/10 rounded-xl transition-all text-left flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesion
          </button>
        </div>
      </aside>

      {/* Header movil */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-gradient-to-r from-primary-700 to-black text-white px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold">GMP Admin</h1>
              <p className="text-primary-300 text-xs">@{perfil?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Menu movil */}
        {menuOpen && (
          <div className="md:hidden bg-black/95 border-t border-primary-800 shadow-xl absolute top-14 z-20 w-full">
            <div className="py-2 px-3 space-y-1">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    tab === t.id ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-white/10'
                  }`}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                  </svg>
                  {t.label}
                </button>
              ))}
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-white/10 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesion
              </button>
            </div>
          </div>
        )}

        {/* Contenido */}
        <main className="flex-1 sm:p-4 md:p-6 overflow-auto bg-gradient-to-b from-gray-50 to-white">
          {tab === 'reportes' && <AdminReportes />}
          {tab === 'empresas' && <AdminEmpresas />}
          {tab === 'sedes' && <AdminSedes />}
          {tab === 'usuarios' && <AdminUsuarios />}
        </main>
      </div>
    </div>
  );
}
