import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminEmpresas from './AdminEmpresas';
import AdminSedes from './AdminSedes';
import AdminUsuarios from './AdminUsuarios';
import AdminReportes from './AdminReportes';

const TABS = [
  { id: 'reportes', label: 'Reportes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'empresas', label: 'Empresas', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'sedes', label: 'Sedes', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { id: 'usuarios', label: 'Usuarios', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
];

export default function AdminDashboard() {
  const { perfil, logout } = useAuth();
  const [tab, setTab] = useState('reportes');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-primary-800 text-white">
        <div className="p-5 border-b border-primary-700">
          <h1 className="text-lg font-bold">GMP Admin</h1>
          <p className="text-primary-300 text-xs mt-1">{perfil?.email}</p>
        </div>
        <nav className="flex-1 py-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-primary-900 text-white border-l-4 border-primary-400' : 'text-primary-200 hover:bg-primary-700 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-700">
          <button onClick={logout} className="w-full py-2 px-4 text-sm text-primary-200 hover:text-white hover:bg-primary-700 rounded-lg transition-colors text-left">
            Cerrar Sesion
          </button>
        </div>
      </aside>

      {/* Header movil */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-primary-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div>
            <h1 className="font-bold">GMP Admin</h1>
            <p className="text-primary-200 text-xs">{perfil?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-primary-700 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Menu movil */}
        {menuOpen && (
          <div className="md:hidden bg-primary-800 border-t border-primary-700">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium ${tab === t.id ? 'bg-primary-900 text-white' : 'text-primary-200'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                </svg>
                {t.label}
              </button>
            ))}
            <button onClick={logout} className="w-full text-left px-5 py-3 text-sm text-red-300 hover:bg-primary-900">
              Cerrar Sesion
            </button>
          </div>
        )}

        {/* Contenido */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {tab === 'reportes' && <AdminReportes />}
          {tab === 'empresas' && <AdminEmpresas />}
          {tab === 'sedes' && <AdminSedes />}
          {tab === 'usuarios' && <AdminUsuarios />}
        </main>
      </div>
    </div>
  );
}
