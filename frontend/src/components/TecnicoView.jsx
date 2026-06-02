import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const CW = 400;
const CH = 150;

export default function TecnicoView() {
  const { getToken, perfil, logout } = useAuth();

  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [empresaId, setEmpresaId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [firmaSvg, setFirmaSvg] = useState('');

  const [loading, setLoading] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [guardado, setGuardado] = useState(null);
  const [msg, setMsg] = useState({ tipo: '', texto: '' });

  /* Preview */
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [tocado, setTocado] = useState(false);
  const trazosRef = useRef([]);
  const trazoRef = useRef([]);

  /* ------------------------------------------------------------------ */
  /* Catalogos                                                           */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      const t = await getToken();
      const [rE, rS] = await Promise.all([
        fetch(`${API}/api/catalogos/empresas`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/api/catalogos/sedes`, { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      if (rE.ok) setEmpresas(await rE.json());
      if (rS.ok) setSedes(await rS.json());
      setLoaded(true);
    })();
  }, []);

  const sedesFiltradas = empresaId
    ? sedes.filter(s => s.empresa_id === parseInt(empresaId))
    : [];

  /* ------------------------------------------------------------------ */
  /* Canvas vectorial                                                     */
  /* ------------------------------------------------------------------ */
  const getCoords = useCallback((e) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return {
      x: ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width * CW,
      y: ((e.touches ? e.touches[0].clientY : e.clientY) - r.top) / r.height * CH,
    };
  }, []);

  const ptsToD = useCallback((pts) => {
    if (!pts.length) return '';
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} l 0.1 0.1`;
    if (pts.length === 2) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      if (i === pts.length - 2) d += ` L ${pts[i+1].x.toFixed(1)} ${pts[i+1].y.toFixed(1)}`;
      else d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${((pts[i].x+pts[i+1].x)/2).toFixed(1)} ${((pts[i].y+pts[i+1].y)/2).toFixed(1)}`;
    }
    return d;
  }, []);

  const construirSvg = useCallback(() => {
    const todos = [...trazosRef.current];
    if (trazoRef.current.length) todos.push(trazoRef.current);
    if (!todos.length) return '';
    const paths = todos.map(p => ptsToD(p)).filter(Boolean).map(d =>
      `<path d="${d}" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
    ).join('\n    ');
    return `<svg viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg">\n  <rect width="${CW}" height="${CH}" fill="#fff"/>\n  ${paths}\n</svg>`;
  }, [ptsToD]);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y);
    trazoRef.current = [{ x, y }];
    setDrawing(true); setTocado(true);
  }, [getCoords]);

  const doDraw = useCallback((e) => {
    e.preventDefault();
    if (!drawing) return;
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y); ctx.stroke();
    trazoRef.current.push({ x, y });
  }, [drawing, getCoords]);

  const stopDraw = useCallback((e) => {
    e.preventDefault();
    if (!drawing) return;
    setDrawing(false);
    if (trazoRef.current.length) trazosRef.current.push([...trazoRef.current]);
    trazoRef.current = [];
    setFirmaSvg(construirSvg());
  }, [drawing, construirSvg]);

  function limpiarFirma() {
    const c = canvasRef.current;
    if (c) c.getContext('2d').clearRect(0, 0, CW, CH);
    trazosRef.current = []; trazoRef.current = [];
    setFirmaSvg(''); setTocado(false);
  }

  /* ------------------------------------------------------------------ */
  /* Preview PDF                                                          */
  /* ------------------------------------------------------------------ */
  async function previsualizar() {
    if (!empresaId || !sedeId) { setMsg({ tipo: 'error', texto: 'Selecciona empresa y sede.' }); return; }
    setPreviewLoading(true);
    setMsg({ tipo: '', texto: '' });
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/preview-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          empresa_id: parseInt(empresaId),
          sede_id: parseInt(sedeId),
          observaciones,
          firma_vector: firmaSvg,
        }),
      });
      if (!res.ok) throw new Error('Error al generar previsualización');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewLoading(false);
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message });
      setPreviewLoading(false);
    }
  }

  function cerrarPreview() {
    if (previewUrl) { window.URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  }

  /* ------------------------------------------------------------------ */
  /* Guardar reporte                                                      */
  /* ------------------------------------------------------------------ */
  async function guardarReporte() {
    setLoading(true);
    setMsg({ tipo: '', texto: '' });
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          empresa_id: parseInt(empresaId),
          sede_id: parseInt(sedeId),
          observaciones,
          firma_vector: firmaSvg,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail || 'Error del servidor'); }
      const data = await res.json();
      setGuardado(data.reporte);
      setMsg({ tipo: 'exito', texto: 'Reporte guardado exitosamente.' });
      cerrarPreview();
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message });
    } finally {
      setLoading(false);
    }
  }

  const empresaNombre = empresas.find(e => e.id === parseInt(empresaId))?.nombre || '';
  const sedeNombre = sedes.find(s => s.id === parseInt(sedeId))?.nombre || '';

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header naranja */}
      <header className="bg-gradient-to-r from-primary-700 to-primary-500 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">Reporte de Mantenimiento</h1>
              <p className="text-xs text-white/70 truncate max-w-[180px] sm:max-w-none">{perfil?.nombre_completo}</p>
            </div>
          </div>
          <button onClick={logout} className="text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors border border-white/20">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 pb-24 animate-fade-in">
        {/* Alerta */}
        {msg.texto && (
          <div className={`mb-5 p-4 rounded-xl text-sm font-medium flex items-start gap-3 animate-fade-in border ${
            msg.tipo === 'exito'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <span className="text-lg">{msg.tipo === 'exito' ? '\u2705' : '\u26A0\uFE0F'}</span>
            <span>{msg.texto}</span>
          </div>
        )}

        {guardado ? (
          /* Vista post-guardado */
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center animate-fade-in border border-gray-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Reporte #{guardado.id}</h2>
            <p className="text-gray-500 text-sm mb-2">{empresaNombre}</p>
            <p className="text-gray-400 text-xs mb-6">{sedeNombre}</p>
            <div className="space-y-3 max-w-xs mx-auto">
              <button onClick={async () => {
                setDescargando(true);
                try {
                  const t = await getToken();
                  const res = await fetch(`${API}/api/reportes/${guardado.id}/pdf`, { headers: { Authorization: `Bearer ${t}` } });
                  if (!res.ok) throw new Error();
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `reporte_${guardado.id}.pdf`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                } catch { setMsg({ tipo: 'error', texto: 'Error al descargar PDF.' }); }
                finally { setDescargando(false); }
              }} className="w-full py-3.5 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all active:scale-[0.97] shadow-md flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar PDF
              </button>
              <button onClick={() => { setGuardado(null); setEmpresaId(''); setSedeId(''); setObservaciones(''); setFirmaSvg(''); setMsg({ tipo: '', texto: '' }); limpiarFirma(); }}
                className="w-full py-3.5 px-4 bg-white text-primary-600 border-2 border-primary-600 rounded-xl font-semibold hover:bg-orange-50 transition-all active:scale-[0.97]">
                Nuevo Reporte
              </button>
            </div>
          </div>
        ) : (
          /* Formulario */
          <form onSubmit={(e) => { e.preventDefault(); guardarReporte(); }} className="space-y-4" noValidate>
            {!loaded ? (
              /* Skeleton loading */
              <div className="space-y-4 animate-pulse">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="h-4 w-1/3 bg-gray-200 rounded mb-3" />
                    <div className="h-11 bg-gray-100 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Empresa */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Empresa <span className="text-red-500">*</span>
                  </label>
                  <select value={empresaId} onChange={e => { setEmpresaId(e.target.value); setSedeId(''); }}
                    required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white transition-shadow">
                    <option value="">Seleccionar empresa...</option>
                    {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>

                {/* Sede */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Sede / Punto de Trabajo <span className="text-red-500">*</span>
                  </label>
                  <select value={sedeId} onChange={e => setSedeId(e.target.value)}
                    required disabled={!empresaId}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400 transition-shadow">
                    <option value="">{empresaId ? 'Seleccionar sede...' : 'Primero selecciona una empresa'}</option>
                    {sedesFiltradas.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.ciudad ? `(${s.ciudad})` : ''}</option>)}
                  </select>
                </div>

                {/* Tecnico */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Tecnico Responsable
                  </label>
                  <input type="text" value={perfil?.nombre_completo || ''} disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 outline-none" />
                </div>

                {/* Observaciones */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Observaciones / Hallazgos
                  </label>
                  <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                    rows={4} maxLength={5000} placeholder="Describe los trabajos realizados, hallazgos y recomendaciones..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white resize-none transition-shadow" />
                  <div className="flex justify-between mt-1">
                    {observaciones.length > 0 && <p className="text-xs text-gray-400">{observaciones.length}/5000 caracteres</p>}
                    {!observaciones && <span />}
                  </div>
                </div>

                {/* Firma */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Firma del Cliente
                  </label>
                  <div className={`border-2 rounded-xl overflow-hidden transition-all ${tocado ? 'border-primary-500 ring-1 ring-primary-200' : 'border-dashed border-gray-300'}`}>
                    <canvas ref={canvasRef} width={CW} height={CH}
                      onMouseDown={startDraw} onMouseMove={doDraw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                      onTouchStart={startDraw} onTouchMove={doDraw} onTouchEnd={stopDraw}
                      className="w-full touch-none cursor-crosshair block bg-white" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {tocado ? 'Suelta para guardar la firma' : 'Firma aqui con el dedo o mouse'}
                  </p>
                  {tocado && (
                    <button type="button" onClick={limpiarFirma}
                      className="mt-3 w-full py-2.5 px-4 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-medium active:scale-[0.98]">
                      Limpiar Firma
                    </button>
                  )}
                </div>

                {/* Botones */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button type="button" onClick={previsualizar} disabled={previewLoading || !empresaId || !sedeId}
                    className={`py-4 px-4 rounded-xl font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-2 border-2 ${
                      previewLoading || !empresaId || !sedeId
                        ? 'border-gray-200 text-gray-400 bg-white cursor-not-allowed'
                        : 'border-primary-600 text-primary-600 bg-white hover:bg-orange-50 shadow-sm'
                    }`}>
                    {previewLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                    Vista Previa
                  </button>

                  <button type="submit" disabled={loading || !empresaId || !sedeId}
                    className={`py-4 px-4 rounded-xl font-semibold text-white transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-md ${
                      loading || !empresaId || !sedeId
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg'
                    }`}>
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    )}
                    Guardar
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </main>

      {/* ============================================================ */}
      {/* MODAL DE PREVISUALIZACION PDF                                  */}
      {/* ============================================================ */}
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
                  <p className="text-xs text-gray-400">{empresaNombre} - {sedeNombre}</p>
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

            {/* Pie del modal */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-white">
              <button onClick={cerrarPreview} className="py-2.5 px-5 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-[0.97] text-sm">
                Volver a Editar
              </button>
              <button onClick={guardarReporte} disabled={loading}
                className={`py-2.5 px-6 rounded-xl font-semibold text-white transition-all active:scale-[0.97] flex items-center gap-2 shadow-sm text-sm ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
                }`}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
                {loading ? 'Guardando...' : 'Confirmar y Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
