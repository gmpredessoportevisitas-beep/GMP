import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL ?? '';
const LIMIT = 20;

export default function AdminReportes() {
  const { getToken } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(0);
  const [descargando, setDescargando] = useState(null);

  const cargar = useCallback(async (offset = 0) => {
    setLoading(true); setError('');
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes?limit=${LIMIT}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setReportes(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { cargar(pagina * LIMIT); }, [pagina, cargar]);

  async function descargarPDF(id) {
    setDescargando(id);
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes/${id}/pdf`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error('Error al generar PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar PDF: ' + err.message);
    } finally {
      setDescargando(null);
    }
  }

  function exportarCSV() {
    if (!reportes.length) return;
    const h = ['ID', 'Fecha', 'Empresa', 'Sede', 'Tecnico', 'Observaciones'];
    const rows = reportes.map(r => [
      r.id, formatFecha(r.fecha_hora),
      csv(r.empresas?.nombre),
      csv(r.sedes?.nombre),
      csv(r.perfiles?.nombre_completo),
      csv(r.observaciones),
    ]);
    const blob = new Blob(['\uFEFF' + [h.join(','), ...rows.map(r => r.join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = `reportes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  function formatFecha(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString('es-CO', { year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:true }); }
    catch { return iso; }
  }

  function csv(t) { return `"${String(t||'').replace(/"/g,'""')}"`; }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Historial de reportes de mantenimiento generados</p>
        </div>
        <button onClick={exportarCSV} disabled={!reportes.length}
          className="py-2.5 px-5 bg-white text-primary-600 border-2 border-primary-200 rounded-xl font-semibold hover:bg-primary-50 hover:border-primary-300 disabled:opacity-40 transition-all flex items-center gap-2 text-sm shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl text-sm font-medium bg-red-50 text-red-800 border border-red-200 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => cargar(pagina * LIMIT)} className="ml-auto underline font-semibold">Reintentar</button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4" />
          <p className="text-sm text-gray-400">Cargando reportes...</p>
        </div>
      ) : !reportes.length ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium text-gray-400">Sin reportes registrados</p>
          <p className="text-sm text-gray-300 mt-1">Los reportes generados por los tecnicos apareceran aqui.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-600 to-primary-700">
                    <Th className="text-white/80">ID</Th>
                    <Th className="text-white/80">Fecha</Th>
                    <Th className="text-white/80">Empresa</Th>
                    <Th className="text-white/80">Sede</Th>
                    <Th className="text-white/80">Tecnico</Th>
                    <Th className="text-white/80">Obs.</Th>
                    <Th className="text-white/80 text-center">PDF</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportes.map(r => (
                    <tr key={r.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-5 py-4 text-xs font-bold text-primary-600 font-mono">#{r.id}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{formatFecha(r.fecha_hora)}</td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-700">{r.empresas?.nombre || '—'}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{r.sedes?.nombre || '—'}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{r.perfiles?.nombre_completo || '—'}</td>
                      <td className="px-5 py-4 text-sm text-gray-400 max-w-[140px] truncate">{r.observaciones || '—'}</td>
                      <td className="px-5 py-4 text-center">
                        <button onClick={() => descargarPDF(r.id)} disabled={descargando === r.id}
                          className={`inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                            descargando === r.id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                          }`}>
                          {descargando === r.id ? (
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                          {descargando === r.id ? 'Descargando...' : 'PDF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 bg-white rounded-xl px-5 py-3 border border-gray-100 shadow-sm">
            <button onClick={() => setPagina(p => Math.max(0, p-1))} disabled={pagina===0}
              className="py-2 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-orange-50 hover:border-primary-300 disabled:opacity-40 transition-all flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
            <span className="text-sm font-semibold text-gray-600">
              Pagina <span className="text-primary-600">{pagina + 1}</span>
            </span>
            <button onClick={() => setPagina(p => p+1)} disabled={reportes.length < LIMIT}
              className="py-2 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-orange-50 hover:border-primary-300 disabled:opacity-40 transition-all flex items-center gap-1">
              Siguiente
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children, className = '' }) {
  return <th className={`px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider ${className}`}>{children}</th>;
}
