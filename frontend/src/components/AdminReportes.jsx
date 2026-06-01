import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Reportes</h2>
        <button onClick={exportarCSV} disabled={!reportes.length} className="py-2 px-4 bg-white text-primary-600 border border-primary-300 rounded-lg text-sm font-semibold hover:bg-primary-50 disabled:opacity-40 transition-all">
          Exportar CSV
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm">{error} <button onClick={() => cargar(pagina * LIMIT)} className="ml-2 underline font-medium">Reintentar</button></div>}

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" /></div>
      ) : !reportes.length ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 text-gray-400">Sin reportes registrados.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b">
                <Th>ID</Th><Th>Fecha</Th><Th>Empresa</Th><Th>Sede</Th><Th>Tecnico</Th><Th>Obs.</Th><Th className="text-center">PDF</Th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {reportes.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-bold text-primary-600">#{r.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatFecha(r.fecha_hora)}</td>
                    <td className="px-4 py-3 text-sm">{r.empresas?.nombre || '\u2014'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.sedes?.nombre || '\u2014'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.perfiles?.nombre_completo || '\u2014'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-[120px] truncate">{r.observaciones || '\u2014'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => descargarPDF(r.id)} disabled={descargando === r.id}
                        className={`inline-flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                          descargando === r.id ? 'bg-gray-200 text-gray-500' : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}>
                        {descargando === r.id ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" /> : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-4">
        <button onClick={() => setPagina(p => Math.max(0, p-1))} disabled={pagina===0} className="py-2 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Anterior</button>
        <span className="text-sm text-gray-500 self-center">Pagina {pagina + 1}</span>
        <button onClick={() => setPagina(p => p+1)} disabled={reportes.length < LIMIT} className="py-2 px-4 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Siguiente</button>
      </div>
    </div>
  );
}

function Th({ children, className = '' }) {
  return <th className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}>{children}</th>;
}
