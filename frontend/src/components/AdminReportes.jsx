import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AnimatedWifiIcon from '../assets/icons/AnimatedWifiIcon'

const API = import.meta.env.VITE_API_URL ?? '';
const LIMIT = 20;

export default function AdminReportes() {
  const { getToken } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(0);
  const [descargando, setDescargando] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [msg, setMsg] = useState({ tipo: '', texto: '' });
  const [encuestaData, setEncuestaData] = useState(null);
  const [encuestaLoading, setEncuestaLoading] = useState(false);
  
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

    async function previsualizar(id) {
  setPreviewLoadingId(id);
  setMsg({ tipo: '', texto: '' });
  try {
    const t = await getToken();
    const res = await fetch(`${API}/api/reportes/${id}/preview-pdf`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) throw new Error('Error al generar previsualización');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    setPreviewUrl(url);
  } catch (err) {
    setMsg({ tipo: 'error', texto: err.message });
  } finally {
    setPreviewLoadingId(null);
  }
}

  function cerrarPreview() {
    if (previewUrl) { window.URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  }

  async function verEncuesta(reporteId) {
    setEncuestaLoading(true);
    setMsg({ tipo: '', texto: '' });
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes/${reporteId}/encuesta`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        if (res.status === 404) { setMsg({ tipo: 'info', texto: 'Este reporte no tiene encuesta registrada.' }); }
        else throw new Error('Error al consultar encuesta');
      } else {
        setEncuestaData(await res.json());
      }
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message });
    } finally {
      setEncuestaLoading(false);
    }
  }

  function cerrarEncuesta() { setEncuestaData(null); setMsg({ tipo: '', texto: '' }); }


  function exportarCSV() {
    if (!reportes.length) return;
    const h = ['ID', 'Fecha', 'Empresa', 'Sede', 'Tecnico', 'Asesor', 'Telefono Asesor', 'Hallazgos', 'Uso Materiales', 'Materiales Detalle', 'Motivo Visita', 'Motivo Visita Otro'];
    const rows = reportes.map(r => [
      r.id, formatFecha(r.fecha_hora),
      csv(r.empresas?.nombre),
      csv(r.sedes?.nombre),
      csv(r.perfiles?.nombre_completo),
      csv(r.nombre_asesor),
      csv(r.telefono_asesor),
      csv(r.hallazgos),
      r.uso_materiales ? 'Si' : 'No',
      csv(r.materiales_detalle),
      r.motivo_visita === 'otro' && r.motivo_visita_otro ? `Otro: ${r.motivo_visita_otro}` : csv(r.motivo_visita),
      csv(r.motivo_visita_otro),
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

      {msg.texto && (
        <div className={`mb-5 p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
          msg.tipo === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
          msg.tipo === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' : ''
        }`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={msg.tipo === 'error' ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
          </svg>
          {msg.texto}
          <button onClick={() => setMsg({ tipo: '', texto: '' })} className="ml-auto text-gray-500 hover:text-gray-700 font-bold">X</button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <AnimatedWifiIcon/>
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
                    <Th className="text-white/80">Asesor</Th>
                    <Th className="text-white/80">Hallazgos</Th>
                    <Th className="text-white/80 text-center">PDF/Enc.</Th>
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
                      <td className="px-5 py-4 text-sm text-gray-500">{r.nombre_asesor || '—'}</td>
                      <td className="px-5 py-4 text-sm text-gray-400 max-w-[140px] truncate">{r.hallazgos || '—'}</td>
                      <td className="px-5 py-4 text-center flex items-center justify-center gap-2">
                        <button onClick={() => previsualizar(r.id)} 
                          className={`py-2.5 px-2 rounded-xl gap-2 shadow-sm transition-all hover:bg-orange-50`}>
                          {previewLoadingId === r.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2  border-t-transparent" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        {previewUrl && (
                          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 md:p-6 animate-fade-in" onClick={cerrarPreview}>
                            <div className="bg-white rounded-2xl w-full max-w-4xl h-[94vh] md:h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                              {/* Cabecera del modal */}
                              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h2 className="text-lg font-bold text-gray-800">Vista Previa del Reporte</h2>
                                    <p className="text-xs text-gray-400">{r?.empresas?.nombre || '—'} - {r?.sedes?.nombre || '—'}</p>
                                  </div>
                                </div>
                                <button onClick={cerrarPreview} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Cerrar">
                                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>

                              {/* Visor PDF */}
                              <div className="flex-1 bg-gray-200 min-h-0">
                                <iframe src={previewUrl} className="w-full h-full" title="Previsualizacion del PDF" />
                              </div>
                            </div>
                          </div>
                        )}
                        <button onClick={() => descargarPDF(r.id)} disabled={descargando === r.id}
                          className={`inline-flex items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-bold transition-all ${
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
                        <button onClick={() => verEncuesta(r.id)}
                          className="inline-flex items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-bold transition-all bg-amber-500 text-white hover:bg-amber-600 shadow-sm">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Enc.
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

      {encuestaData && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={cerrarEncuesta}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Encuesta de Satisfaccion</h2>
                  <p className="text-xs text-gray-400">Reporte #{encuestaData.encuesta.reporte_id}</p>
                </div>
              </div>
              <button onClick={cerrarEncuesta} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {(encuestaData.respuestas || []).map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{r.encuesta_preguntas?.texto || `Pregunta ${r.pregunta_id}`}</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(v => (
                      <svg key={v} className={`w-6 h-6 ${v <= r.valor ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-xs font-semibold text-gray-500 self-center">{r.valor}/5</span>
                  </div>
                </div>
              ))}
              {encuestaData.encuesta.observaciones && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Observaciones del cliente:</p>
                  <p className="text-sm text-gray-700">{encuestaData.encuesta.observaciones}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 text-right">
                {new Date(encuestaData.encuesta.creado_en).toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = '' }) {
  return <th className={`px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider ${className}`}>{children}</th>;
}
