import { useState, useRef, useCallback } from 'react';
import useTecnicoView from '../hooks/useTecnicoView';

const CW = 400;
const CH = 150;

export default function TecnicoView() {
  const {
    empresas, sedes, loaded,
    empresaId, setEmpresaId,
    sedeId, setSedeId,
    nombreAsesor, setNombreAsesor,
    telefonoAsesor, setTelefonoAsesor,
    hallazgos, setHallazgos,
    usoMateriales, setUsoMateriales,
    materialesDetalle, setMaterialesDetalle,
    motivoVisita, setMotivoVisita,
    motivoVisitaOtro, setMotivoVisitaOtro,
    firmaSvg, setFirmaSvg,
    preguntas, respuestasEncuesta, setRespuestasEncuesta,
    encuestaObservaciones, setEncuestaObservaciones,
    loading, descargando, guardado, setGuardado,
    msg, setMsg,
    sedesFiltradas, empresaNombre, sedeNombre,
    guardarReporte, descargarPDF, resetForm, perfil, logout,
  } = useTecnicoView();

  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [tocado, setTocado] = useState(false);
  const trazosRef = useRef([]);
  const trazoRef = useRef([]);

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
  }, [drawing, construirSvg, setFirmaSvg]);

  function limpiarFirma() {
    const c = canvasRef.current;
    if (c) c.getContext('2d').clearRect(0, 0, CW, CH);
    trazosRef.current = []; trazoRef.current = [];
    setFirmaSvg(''); setTocado(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <button onClick={() => descargarPDF(guardado.id)} disabled={descargando}
                className="w-full py-3.5 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all active:scale-[0.97] shadow-md flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar PDF
              </button>
              <button onClick={() => { setGuardado(null); resetForm(); limpiarFirma(); }}
                className="w-full py-3.5 px-4 bg-white text-primary-600 border-2 border-primary-600 rounded-xl font-semibold hover:bg-orange-50 transition-all active:scale-[0.97]">
                Nuevo Reporte
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); guardarReporte(); }} className="space-y-4" noValidate>
            {!loaded ? (
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

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Asesor
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" value={nombreAsesor} onChange={e => setNombreAsesor(e.target.value)}
                      placeholder="Nombre del asesor" maxLength={255}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white transition-shadow" />
                    <input type="text" value={telefonoAsesor} onChange={e => setTelefonoAsesor(e.target.value)}
                      placeholder="Telefono del asesor" maxLength={50}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white transition-shadow" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Motivo de Visita <span className="text-red-500">*</span>
                  </label>
                  <select value={motivoVisita} onChange={e => { setMotivoVisita(e.target.value); if (e.target.value !== 'otro') setMotivoVisitaOtro(''); }}
                    required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white transition-shadow">
                    <option value="soporte">Soporte</option>
                    <option value="instalación">Instalación</option>
                    <option value="reubicación">Reubicación</option>
                    <option value="desinstalación">Desinstalación</option>
                    <option value="otro">Otro</option>
                  </select>
                  {motivoVisita === 'otro' && (
                    <input type="text" value={motivoVisitaOtro} onChange={e => setMotivoVisitaOtro(e.target.value)}
                      placeholder="Especifica el motivo de la visita" maxLength={255}
                      className="mt-3 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white transition-shadow" />
                  )}
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={usoMateriales} onChange={e => { setUsoMateriales(e.target.checked); if (!e.target.checked) setMaterialesDetalle(''); }}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Se utilizaron materiales / repuestos
                  </label>
                  {usoMateriales && (
                    <textarea value={materialesDetalle} onChange={e => setMaterialesDetalle(e.target.value)}
                      rows={3} maxLength={2000} placeholder="Describe los materiales o repuestos utilizados..."
                      className="mt-3 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white resize-none transition-shadow" />
                  )}
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Hallazgos
                  </label>
                  <textarea value={hallazgos} onChange={e => setHallazgos(e.target.value)}
                    rows={4} maxLength={5000} placeholder="Describe los hallazgos encontrados durante la visita..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white resize-none transition-shadow" />
                  <div className="flex justify-between mt-1">
                    {hallazgos.length > 0 && <p className="text-xs text-gray-400">{hallazgos.length}/5000 caracteres</p>}
                    {!hallazgos && <span />}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Encuesta de Satisfaccion
                    <span className="text-xs font-normal text-gray-400 ml-1">(Opcional)</span>
                  </div>
                  {preguntas.map((p, idx) => (
                    <div key={p.id} className="mb-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
                      <p className="text-xs font-medium text-gray-600 mb-1.5">{idx + 1}. {p.texto}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(v => (
                          <button key={v} type="button" onClick={() => setRespuestasEncuesta(prev => ({ ...prev, [p.id]: prev[p.id] === v ? 0 : v }))}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                              respuestasEncuesta[p.id] >= v ? 'text-amber-400 scale-110' : 'text-gray-200 hover:text-amber-300'
                            }`}>
                            <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        ))}
                        {respuestasEncuesta[p.id] > 0 && (
                          <span className="ml-2 text-[10px] text-gray-400 self-center font-medium">
                            {['Muy malo','Malo','Regular','Bueno','Excelente'][respuestasEncuesta[p.id] - 1]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <textarea value={encuestaObservaciones} onChange={e => setEncuestaObservaciones(e.target.value)}
                    rows={2} maxLength={2000} placeholder="Observaciones adicionales de la encuesta (opcional)..."
                    className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white resize-none transition-shadow text-sm" />
                </div>

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

                <div className="w-full flex justify-center ">
                  <button type="submit" disabled={loading || !empresaId || !sedeId}
                    className={`py-4 px-4 rounded-xl  font-semibold text-white transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-md ${
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
    </div>
  );
}
