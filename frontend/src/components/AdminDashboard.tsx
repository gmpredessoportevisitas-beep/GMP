import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminEmpresas from './AdminEmpresas';
import AdminSedes from './AdminSedes';
import AdminUsuarios from './AdminUsuarios';
import AdminReportes from './AdminReportes';
import AdminEncuestaPreguntas from './AdminEncuestaPreguntas';
import UsuarioIcon from '../assets/icons/usuarios/UsuarioIcon';
import EmpresaIcon from '../assets/icons/empresas/EmpresaIcon';
import SedesIcon from '../assets/icons/sedes/SedesIcon';
import EncuestasIcon from '../assets/icons/encuestas/EncuestasIcon';
import ReportesIcon from '../assets/icons/reportes/ReportesIcon';
import logo from '../assets/logo.webp';
import type { Tab } from '../types';



const TABS: Tab[] = [
  { id: 'reportes', label: 'Reportes', icon:  <ReportesIcon />,},
  { id: 'empresas', label: 'Empresas', icon: <EmpresaIcon />},
  { id: 'sedes', label: 'Sedes', icon: <SedesIcon />},
  { id: 'usuarios', label: 'Usuarios', icon: <UsuarioIcon />},
  { id: 'encuestas', label: 'Encuesta', icon: <EncuestasIcon />},
  ];

export default function AdminDashboard() {
  const { perfil, logout } = useAuth();
  const [tab, setTab] = useState('reportes');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col w-56 bg-gradient-to-b from-primary-900 to-black text-white">
        <div className="p-5 border-b border-primary-800">
          <div className="flex items-center gap-3 mb-2 justify-center">
            <img src={logo} alt="Logo GMP" className="h-20" />
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
                {t.icon}
              </svg>
              <div className="text-left">
                <div>{t.label}</div>
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
            <img src={logo} alt="Logo GMP" className="h-10" />
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
                  {t.icon}
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
        <main className="flex-1 md:px-12 md:py-8 py-4 overflow-auto bg-gradient-to-b from-gray-50 to-white">
          {tab === 'reportes' && <AdminReportes />}
          {tab === 'empresas' && <AdminEmpresas />}
          {tab === 'sedes' && <AdminSedes />}
          {tab === 'usuarios' && <AdminUsuarios />}
          {tab === 'encuestas' && <AdminEncuestaPreguntas />}
        </main>
      </div>
    </div>
  );
}
