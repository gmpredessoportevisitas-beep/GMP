import { useState, useRef, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import useTecnicoView from '../hooks/useTecnicoView';
import Combobox from './Combobox';
import Logo from '../assets/logo-white.svg';
import PoliticaPrivacidad from './PoliticaPrivacidad';
import QrIcon from '../assets/icons/encuestas/QrIcon';
import PdfIcon from '../assets/icons/reportes/PdfIcon';
import GuardarReporte from '../assets/icons/reportes/GuardarReporte';
import EncuestaIcon from '../assets/icons/reportes/EncuestaIcon';
import ReportesIcon from '../assets/icons/reportes/ReportesIcon';

const CW = 400;
const CH = 250;

interface Point {
  x: number;
  y: number;
}

export default function TecnicoView() {
  const {
    empresas, sedes, sedesLoading, loaded,
    empresaId, setEmpresaId,
    sedeId, setSedeId,
    nombreAsesor, setNombreAsesor,
    telefonoAsesor, setTelefonoAsesor,
    hallazgos, setHallazgos,
    usoMateriales, setUsoMateriales,
    materialesDetalle, setMaterialesDetalle,
    cambioAntena, setCambioAntena,
    serialAntena, setSerialAntena,
    motivoVisita, setMotivoVisita,
    motivoVisitaOtro, setMotivoVisitaOtro,
    setFirmaSvg,
    loading, descargando, guardado, setGuardado,
    msg, setMsg,
    empresaNombre, sedeNombre,
    guardarReporte, descargarPDF, resetForm, perfil, logout,
    aceptoPrivacidad, setAceptoPrivacidad,
    qrUrl, qrLoading, qrModalOpen, setQrModalOpen, obtenerQrEncuesta,
  } = useTecnicoView();

  const [step, setStep] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [tocado, setTocado] = useState(false);
  const trazosRef = useRef<Point[][]>([]);
  const trazoRef = useRef<Point[]>([]);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [closeAvisoEncuesta, setCloseAvisoEncuesta] = useState(false);

  const handleEncuesta = () => {
    console.log(closeAvisoEncuesta)
    setCloseAvisoEncuesta(true);
  }

  useEffect(() => {
    if (!privacyOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPrivacyOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [privacyOpen]);

  const getCoords = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return {
      x: (clientX - r.left) / r.width * CW,
      y: (clientY - r.top) / r.height * CH,
    };
  }, []);

  const ptsToD = useCallback((pts: Point[]) => {
    if (!pts.length) return '';
    if (pts.length === 1) return `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)} l 0.1 0.1`;
    if (pts.length === 2) return `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)} L ${pts[1]!.x.toFixed(1)} ${pts[1]!.y.toFixed(1)}`;
    let d = `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const next = pts[i + 1]!;
      const curr = pts[i]!;
      if (i === pts.length - 2) d += ` L ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
      else d += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${((curr.x + next.x) / 2).toFixed(1)} ${((curr.y + next.y) / 2).toFixed(1)}`;
    }
    return d;
  }, []);

  const construirSvg = useCallback(() => {
    const todos: Point[][] = [...trazosRef.current];
    if (trazoRef.current.length) todos.push(trazoRef.current);
    if (!todos.length) return '';
    const paths = todos.map(p => ptsToD(p)).filter(Boolean).map(d =>
      `<path d="${d}" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
    ).join('\n    ');
    return `<svg viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg">\n  <rect width="${CW}" height="${CH}" fill="#fff"/>\n  ${paths}\n</svg>`;
  }, [ptsToD]);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y);
    trazoRef.current = [{ x, y }];
    setDrawing(true); setTocado(true);
  }, [getCoords]);

  const doDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y); ctx.stroke();
    trazoRef.current.push({ x, y });
  }, [drawing, getCoords]);

  const stopDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    setDrawing(false);
    if (trazoRef.current.length) trazosRef.current.push([...trazoRef.current]);
    trazoRef.current = [];
    setFirmaSvg(construirSvg());
  }, [drawing, construirSvg, setFirmaSvg]);

  function limpiarFirma() {
    const c = canvasRef.current;
    if (c) c.getContext('2d')?.clearRect(0, 0, CW, CH);
    trazosRef.current = []; trazoRef.current = [];
    setFirmaSvg(''); setTocado(false);
  }

  function irAlPaso2() {
    if (!empresaId || !sedeId) {
      setMsg({ tipo: 'error', texto: 'Debe seleccionar una empresa y una sede.' });
      return;
    }
    setStep(2);
    setCloseAvisoEncuesta(false);
    setMsg({ tipo: '', texto: '' });
  }

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const colorPorRol = '#111827';
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', colorPorRol);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={Logo} alt="Logo" className="w-16 h-10" />
          <div className="flex flex-col justify-center w-full">
            <h1 className="text-lg font-semibold text-center w-full">Reporte</h1>
            <p className="text-xs text-white/70 truncate text-center">{perfil?.nombre_completo}</p>
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
                <PdfIcon />
                Descargar PDF
              </button>
              <button onClick={() => obtenerQrEncuesta(guardado.id)} disabled={qrLoading}
                className="w-full py-3.5 px-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all active:scale-[0.97] shadow-md flex items-center justify-center gap-2">
                {qrLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <QrIcon />
                )}
                Encuesta QR
              </button>
              <button onClick={() => { setGuardado(null); resetForm(); limpiarFirma(); setStep(1); }}
                className="w-full py-3.5 px-4 bg-white text-primary-600 border-2 border-primary-600 rounded-xl font-semibold hover:bg-orange-50 transition-all active:scale-[0.97]">
                <div className="flex items-center justify-center gap-2">
                  <ReportesIcon />
                  Nuevo Reporte
                </div>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); guardarReporte(); }} className="space-y-3" noValidate>
            {!loaded ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="h-4 w-1/3 bg-gray-200 rounded mb-3" />
                    <div className="h-11 bg-gray-100 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`flex  items-center gap-2 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-colors ${step === 1 ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-200 text-gray-500'}`}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold bg-white/20">1</span>
                    Datos del Tecnico
                  </div>
                  <div className="w-4 h-px bg-gray-300" />
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-colors ${step === 2 ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-200 text-gray-500'}`}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold bg-white/20">2</span>
                    Datos del Asesor
                  </div>
                </div>
                {step === 1 && (
                  <>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
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
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Sede / Punto de Trabajo <span className="text-red-500">*</span>
                      </label>
                      <Combobox
                        options={sedes.map(s => ({ value: String(s.id), label: s.nombre, sublabel: s.direccion}))}
                        value={sedeId}
                        onChange={setSedeId}
                        placeholder={empresaId ? 'Buscar sede...' : 'Primero selecciona una empresa'}
                        disabled={!empresaId}
                        loading={sedesLoading}
                        emptyMessage="No se encontraron sedes"
                      />
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Tecnico Responsable
                      </label>
                      <input type="text" value={perfil?.nombre_completo || ''} disabled
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 outline-none" />
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
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
                      <label className="flex items-center gap-3 text-xs font-semibold text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={usoMateriales} onChange={e => { setUsoMateriales(e.target.checked); if (!e.target.checked) setMaterialesDetalle(''); }}
                          className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Se Utilizaron Materiales / Repuestos
                      </label>
                      {usoMateriales && (
                        <textarea value={materialesDetalle} onChange={e => setMaterialesDetalle(e.target.value)}
                          rows={3} maxLength={2000} placeholder="Describe los materiales o repuestos utilizados..."
                          className="mt-3 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white resize-none transition-shadow" />
                      )}
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <label className="flex items-center gap-3 text-xs font-semibold text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={cambioAntena} onChange={e => { setCambioAntena(e.target.checked); if (!e.target.checked) setSerialAntena(''); }}
                          className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
                        </svg>
                        Se Cambió Antena
                      </label>
                      {cambioAntena && (
                        <input type="text" value={serialAntena} onChange={e => setSerialAntena(e.target.value)}
                          placeholder="Ingresa el número serial alfanumérico de la antena" maxLength={100}
                          className="mt-3 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white transition-shadow" />
                      )}
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
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
                    <div className="flex justify-end">
                      <button type="button" onClick={irAlPaso2}
                        disabled={!empresaId || !sedeId}
                        className={`w-1/2 py-3 px-4 rounded-xl font-semibold text-white transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-md ${
                          !empresaId || !sedeId
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg'
                        }`}>
                        Siguiente
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={aceptoPrivacidad}
                          onChange={e => setAceptoPrivacidad(e.target.checked)}
                          className="w-5 h-5 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer flex-shrink-0" />
                        <div className="sm:text-[10px] text-[9px] text-gray-500 leading-relaxed">
                          <span className="text-gray-700 font-semibold">Autorizacion de Tratamiento de Datos Personales <span className="text-red-500">*</span></span><br />
                          De conformidad con la Ley 1581 de 2012, autorizo de manera voluntaria, previa, explicita e informada el tratamiento de mis datos personales para fines internos de control de calidad, evaluación del servicio brindado y como constancia técnica del trabajo realizado.{' '}
                          <button type="button" onClick={() => setPrivacyOpen(true)}
                            className="text-primary-600 underline hover:text-primary-700 font-medium">
                            Ver Politica Completa
                          </button>
                        </div>
                      </label>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Asesor
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" value={nombreAsesor} onChange={e => setNombreAsesor(e.target.value)}
                          placeholder="Nombre del asesor" maxLength={255} disabled={!aceptoPrivacidad}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white transition-shadow" />
                        <input type="text" value={telefonoAsesor} onChange={e => setTelefonoAsesor(e.target.value)}
                          placeholder="Telefono del asesor" maxLength={50} disabled={!aceptoPrivacidad}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white transition-shadow" />
                      </div>
                    </div>
                    {!closeAvisoEncuesta && (
                      <div className="relative w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-pulse hover:animate-none">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); 
                            setCloseAvisoEncuesta(true);
                          }}
                          className="absolute top-3 right-3 text-emerald-600 hover:text-emerald-900 rounded-lg p-1 hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Cerrar aviso"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" className="h-4 w-4" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
                        </button>
                        <button 
                          type="button"
                          onClick={handleEncuesta} 
                          className="w-full text-left pr-6 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg"
                        >
                          <div className="text-xs text-emerald-800 leading-relaxed">
                            <span className="font-semibold text-sm text-emerald-900 block mb-1">
                              Encuesta de Satisfacción
                            </span>
                            Después de guardar el reporte, se generará un código QR que podrá escanear con su celular para llenar la encuesta de satisfacción sobre el servicio recibido.
                          </div>
                        </button>
                        
                      </div>
                    )} 
                    <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-3">
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Firma del Asesor
                      </label>
                      <div className={`border-2 rounded-xl h-full overflow-hidden transition-all ${tocado ? 'border-primary-500 ring-1 ring-primary-200' : 'border-dashed border-gray-300'}`}>
                        <canvas ref={canvasRef} width={CW} height={CH} 
                          onMouseDown={startDraw} onMouseMove={doDraw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                          onTouchStart={startDraw} onTouchMove={doDraw} onTouchEnd={stopDraw}
                          className="w-full touch-none cursor-crosshair block bg-white" />
                      </div>
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        {tocado ? 'Suelta para guardar la firma' : 'Firma aqui con el dedo o mouse'}
                      </p>
                      <button type="button" onClick={limpiarFirma} disabled={!tocado}
                        className="mt-3 w-full py-2.5 px-4 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-medium active:scale-[0.98]">
                        Limpiar Firma
                      </button>
                    </div>
                    <div className="flex gap-6">
                      <button type="button" onClick={() => { setStep(1); setMsg({ tipo: '', texto: '' }); }}
                        className="flex-1 py-2 px-2 rounded-xl font-semibold text-primary-600 border-2 border-primary-600 bg-white hover:bg-orange-50 transition-all active:scale-[0.97] flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Anterior
                      </button>
                      <button type="submit" disabled={loading || !aceptoPrivacidad}
                        className={`flex-1 py-3 px-2 rounded-xl font-semibold text-white transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-md ${
                          loading || !aceptoPrivacidad
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg'
                        }`}>
                        {loading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        ) : (
                          <GuardarReporte />
                        )}
                        Guardar
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </form>
        )}
      </main>

      {privacyOpen && (
        <PoliticaPrivacidad setPrivacyOpen={setPrivacyOpen} />
      )}
      {qrModalOpen && qrUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          onClick={() => setQrModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-fade-in"
            onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <EncuestaIcon />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Encuesta de Satisfaccion</h3>
            <p className="text-sm text-gray-500 mb-5">
              Escanea este codigo QR con tu celular para llenar la encuesta de satisfaccion
            </p>
            <div className="flex justify-center mb-5">
              <div className="bg-white p-3 border-2 border-gray-100 rounded-xl shadow-inner">
                <QRCodeSVG value={qrUrl} size={200} />
              </div>
            </div>
            <button type="button" onClick={() => { navigator.clipboard.writeText(qrUrl); setMsg({ tipo: 'exito', texto: 'Enlace copiado al portapapeles' }); }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-4 block mx-auto underline underline-offset-2">
              Copiar enlace
            </button>
            <button type="button" onClick={() => setQrModalOpen(false)}
              className="w-full py-2.5 px-4 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all active:scale-[0.98]">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}