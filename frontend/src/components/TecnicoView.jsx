import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const CW = 400;
const CH = 150;

export default function TecnicoView() {
  const { getToken, perfil, logout } = useAuth();

  /* Catalogos */
  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);

  /* Formulario */
  const [empresaId, setEmpresaId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [firmaSvg, setFirmaSvg] = useState('');

  /* Estados */
  const [loading, setLoading] = useState(false);
  const [guardado, setGuardado] = useState(null);
  const [msg, setMsg] = useState({ tipo: '', texto: '' });
  const [descargando, setDescargando] = useState(false);

  /* Canvas */
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [tocado, setTocado] = useState(false);
  const trazosRef = useRef([]);
  const trazoRef = useRef([]);

  /* ------------------------------------------------------------------ */
  /* Cargar catalogos                                                    */
  /* ------------------------------------------------------------------ */
  async function cargarCatalogos() {
    const t = await getToken();
    const [rEmp, rSed] = await Promise.all([
      fetch(`${API}/api/catalogos/empresas`, { headers: { Authorization: `Bearer ${t}` } }),
      fetch(`${API}/api/catalogos/sedes`, { headers: { Authorization: `Bearer ${t}` } }),
    ]);
    if (rEmp.ok) setEmpresas(await rEmp.json());
    if (rSed.ok) setSedes(await rSed.json());
  }

  useEffect(() => { cargarCatalogos(); }, []);

  /* Filtrar sedes por empresa */
  const sedesFiltradas = empresaId
    ? sedes.filter(s => s.empresa_id === parseInt(empresaId))
    : [];

  /* ------------------------------------------------------------------ */
  /* Canvas de firma (captura VECTORIAL)                                 */
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
    const paths = todos.map(pts => ptsToD(pts)).filter(d => d).map(d =>
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
  /* Enviar reporte                                                      */
  /* ------------------------------------------------------------------ */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!empresaId || !sedeId) { setMsg({ tipo: 'error', texto: 'Selecciona empresa y sede.' }); return; }
    setLoading(true); setMsg({ tipo: '', texto: '' });
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
      if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.detail || 'Error del servidor'); }
      const data = await res.json();
      setGuardado(data.reporte);
      setMsg({ tipo: 'exito', texto: 'Reporte guardado exitosamente.' });
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message });
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Descargar PDF                                                       */
  /* ------------------------------------------------------------------ */
  async function descargarPDF() {
    if (!guardado) return;
    setDescargando(true);
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes/${guardado.id}/pdf`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error('Error al generar PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `reporte_${guardado.id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMsg({ tipo: 'error', texto: 'Error al descargar el PDF.' });
    } finally {
      setDescargando(false);
    }
  }

  function nuevoReporte() {
    setEmpresaId(''); setSedeId(''); setObservaciones('');
    setFirmaSvg(''); setGuardado(null); setMsg({ tipo: '', texto: '' });
    limpiarFirma();
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  const sedeNombre = sedes.find(s => s.id === parseInt(sedeId))?.nombre || '';
  const empresaNombre = empresas.find(e => e.id === parseInt(empresaId))?.nombre || '';

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <header className="bg-primary-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
        <h1 className="text-lg font-semibold flex-1">Nuevo Reporte</h1>
        <span className="text-primary-200 text-xs hidden sm:inline">{perfil?.nombre_completo}</span>
        <button onClick={logout} className="text-xs text-primary-200 hover:text-white px-2 py-1 rounded-lg hover:bg-primary-700 transition-colors">Salir</button>
      </header>

      <main className="max-w-lg mx-auto p-4 pb-24">
        {msg.texto && (
          <div className={`mb-5 p-4 rounded-xl text-sm font-medium flex items-start gap-3 animate-fade-in ${
            msg.tipo === 'exito' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <span>{msg.tipo === 'exito' ? '\u2705' : '\u26A0\uFE0F'}</span>
            <span>{msg.texto}</span>
          </div>
        )}

        {guardado ? (
          <div className="bg-white rounded-2xl shadow-md p-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Reporte #{guardado.id}</h2>
            <p className="text-gray-500 text-sm">{empresaNombre} - {sedeNombre}</p>
            <div className="space-y-3 mt-6">
              <button onClick={descargarPDF} disabled={descargando}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-md ${descargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}>
                {descargando ? 'Generando PDF...' : 'Descargar PDF'}
              </button>
              <button onClick={nuevoReporte} className="w-full py-3.5 px-4 bg-white text-primary-600 border-2 border-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all active:scale-[0.97]">
                Nuevo Reporte
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Empresa */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Empresa <span className="text-red-500">*</span></label>
              <select value={empresaId} onChange={e => { setEmpresaId(e.target.value); setSedeId(''); }}
                required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                <option value="">Seleccionar empresa...</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>

            {/* Sede */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sede / Punto de Trabajo <span className="text-red-500">*</span></label>
              <select value={sedeId} onChange={e => setSedeId(e.target.value)}
                required disabled={!empresaId}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400">
                <option value="">{empresaId ? 'Seleccionar sede...' : 'Primero selecciona una empresa'}</option>
                {sedesFiltradas.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.ciudad ? `(${s.ciudad})` : ''}</option>)}
              </select>
            </div>

            {/* Tecnico (auto) */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tecnico Responsable</label>
              <input type="text" value={perfil?.nombre_completo || ''} disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 outline-none" />
            </div>

            {/* Observaciones */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones / Hallazgos</label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                rows={4} maxLength={5000} placeholder="Describe los trabajos realizados..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white resize-none" />
              <p className="text-xs text-gray-400 text-right mt-1">{observaciones.length}/5000</p>
            </div>

            {/* Firma */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Firma del Cliente</label>
              <div className={`border-2 rounded-xl overflow-hidden transition-colors ${tocado ? 'border-primary-500' : 'border-dashed border-gray-300'}`}>
                <canvas ref={canvasRef} width={CW} height={CH}
                  onMouseDown={startDraw} onMouseMove={doDraw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  onTouchStart={startDraw} onTouchMove={doDraw} onTouchEnd={stopDraw}
                  className="w-full touch-none cursor-crosshair block bg-white" />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">{tocado ? 'Suelta para guardar la firma' : 'Toca aqui con el dedo o mouse'}</p>
              <button type="button" onClick={limpiarFirma}
                className="mt-3 w-full py-2.5 px-4 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-medium">
                Limpiar Firma
              </button>
            </div>

            <button type="submit" disabled={loading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all active:scale-[0.98] shadow-md ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 hover:shadow-xl'}`}>
              {loading ? 'Guardando reporte...' : 'Guardar Reporte'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
