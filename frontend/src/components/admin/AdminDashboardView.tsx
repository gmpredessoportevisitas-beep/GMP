import { useState, useEffect } from 'react';
import useAdminDashboard from '../../hooks/admin/useAdminDashboard';
import { useAuth } from '../../contexts/AuthContext';
import AnimatedWifiIcon from '../../assets/icons/AnimatedWifiIcon';
import PageHeader from '../ui/PageHeader';
import type { Empresa } from '../../types';

const API = import.meta.env.VITE_API_URL ?? '';

function Bar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-4 ">
      <span className="text-xs text-gray-600 w-1/3 truncate text-right shrink-0" title={label}>{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right shrink-0">{value}</span>
    </div>
  );
}

function StarRating({ value, maxVal = 5 }: { value: number; maxVal?: number }) {
  const stars = [];
  for (let i = 1; i <= maxVal; i++) {
    stars.push(
      <svg key={i} className={`w-4 h-4 ${i <= Math.round(value) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
}

export default function AdminDashboardView() {
  const {
    resumen, puntuaciones, loading, exporting,
    fechaInicio, setFechaInicio, fechaFin, setFechaFin,
    empresaId, setEmpresaId,
    exportarExcel,
  } = useAdminDashboard();

  const { authFetch } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  useEffect(() => {
    authFetch(`${API}/api/catalogos/empresas`)
      .then(res => res.ok ? res.json() : [])
      .then((data: Empresa[]) => setEmpresas(data))
      .catch(() => {});
  }, [authFetch]);

  const maxPuntos = Math.max(...(resumen?.puntos_mas_visitados.map(p => p.cantidad) || [1]), 1);

  const tecColors = [
    'border-primary-500 bg-primary-50',
    'border-amber-500 bg-amber-50',
    'border-emerald-500 bg-emerald-50',
    'border-blue-500 bg-blue-50',
    'border-violet-500 bg-violet-50',
    'border-rose-500 bg-rose-50',
    'border-cyan-500 bg-cyan-50',
    'border-teal-500 bg-teal-50',
  ];

  return (
    <div className="animate-fade-in max-w-[100vw] mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Resumen general de visitas técnicas"
        button={
          <button
            onClick={exportarExcel}
            disabled={exporting}
            className="py-2.5 px-5 bg-white text-primary-600 border-2 border-primary-200 rounded-xl font-semibold hover:bg-primary-50 hover:border-primary-300 disabled:opacity-40 transition-all flex items-center gap-2 text-sm shadow-sm"
          >
            {exporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Exportar Excel
          </button>
        }
      />

      {/* Filtros por fecha y empresa */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Desde:</span>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Hasta:</span>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Empresa:</span>
          <select value={empresaId ?? ''} onChange={e => setEmpresaId(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[180px]">
            <option value="">Todas</option>
            {empresas.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>
        {(fechaInicio || fechaFin || empresaId) && (
          <button onClick={() => { setFechaInicio(''); setFechaFin(''); setEmpresaId(null); }}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
            Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-40 bg-white rounded-2xl shadow-lg border border-gray-100">
          <AnimatedWifiIcon />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tarjeta de total visitas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Visitas</p>
                <p className="text-3xl font-bold text-gray-900">{resumen?.total_visitas ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Visitas por técnico */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Visitas por Técnico</h3>
            {resumen?.visitas_por_tecnico && resumen.visitas_por_tecnico.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumen.visitas_por_tecnico.map((t, i) => (
                  <div key={t.tecnico_id} className={`border-l-4 rounded-xl p-4 shadow-sm ${tecColors[i % tecColors.length]}`}>
                    <p className="text-sm text-gray-500 font-medium truncate" title={t.nombre}>{t.nombre}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{t.cantidad}</p>
                    <p className="text-xs text-gray-400 mt-0.5">visita{t.cantidad !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Sin datos de visitas</p>
            )}
          </div>

          {/* Puntos más visitados */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col sm:flex-row gap-4 ">
            {/* Puntuación de técnicos */}
            <div className="sm:w-1/3 w-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Puntuación de Técnicos (Encuestas)</h3>
                {puntuaciones?.puntuaciones && puntuaciones.puntuaciones.length > 0 ? (
                  <div className="space-y-3">
                    {puntuaciones.puntuaciones.map(p => (
                      <div key={p.tecnico_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700">
                            {p.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">{p.nombre}</p>
                            <p className="text-xs text-gray-400">{p.total_encuestas} encuesta{p.total_encuestas !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating value={p.promedio} />
                          <span className="text-sm font-bold text-gray-700">{p.promedio.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Sin encuestas registradas</p>
                )}
            </div>
            <div className="w-full">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Top 20 Sedes más Visitadas</h3>
              {resumen?.puntos_mas_visitados && resumen.puntos_mas_visitados.length > 0 ? (
                <div className="space-y-2.5">
                  {resumen.puntos_mas_visitados.map(p => (
                    <Bar key={p.sede_id} value={p.cantidad} max={maxPuntos} label={`${p.sede_nombre}${p.empresa_nombre ? ` (${p.empresa_nombre})` : ''}`} color="bg-amber-500" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Sin datos de visitas</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
