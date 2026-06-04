import AnimatedWifiIcon from '../assets/icons/AnimatedWifiIcon';
import useAdminReportes from '../hooks/useAdminReportes';
import SearchBar from './SearchBar';
import FilterChips from './FilterChips';
import Pagination from './Pagination';
import TableTh from './TableTh';
import PageHeader from './PageHeader';

const MOTIVOS = [
  { key: 'soporte', label: 'Soporte' },
  { key: 'instalación', label: 'Instalación' },
  { key: 'reubicación', label: 'Reubicación' },
  { key: 'desinstalación', label: 'Desinstalación' },
  { key: 'otro', label: 'Otro' },
];

export default function AdminReportes() {
  const {
    reportes, totalReportes, loading, error, pagina, setPagina,
    descargando, previewUrl, previewLoadingId,
    msg, encuestaData,
    cargar, descargarPDF, previsualizar, cerrarPreview,
    verEncuesta, cerrarEncuesta, exportarCSV, setMsg,
    LIMIT, tecnicos, empresas,
    searchTerm, setSearchTerm,
    filterEmpresaId, setFilterEmpresaId,
    filterTecnicoId, setFilterTecnicoId,
    filterMotivo, setFilterMotivo,
    fechaInicio, setFechaInicio,
    fechaFin, setFechaFin,
  } = useAdminReportes();

  function formatFecha(iso: string) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString('es-CO', { year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:true }); }
    catch { return iso; }
  }

  const filtroActivado = filterEmpresaId !== null || filterMotivo !== null || filterTecnicoId !== null || fechaInicio || fechaFin;

  return (
    <div className="animate-fade-in max-w-[100vw] sm:mx-auto min-h-full flex flex-col justify-between">
      <div>
        <PageHeader
        title="Reportes"
        subtitle="Historial de visitas técnicas realizadas"
        // button={
        //   <button onClick={exportarCSV} disabled={!reportes.length}
        //     className="py-2.5 px-5 bg-white text-primary-600 border-2 border-primary-200 rounded-xl font-semibold hover:bg-primary-50 hover:border-primary-300 disabled:opacity-40 transition-all flex items-center gap-2 text-sm shadow-sm">
        //     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        //     </svg>
        //     Exportar CSV
        //   </button>
        // }
      />
      <div className="flex flex-col gap-2 sm:flex-row w-full justify-between">
        <div className="space-y-1 sm:w-1/2 w-full sm:px-0 px-2">
          {empresas.length > 0 && (
            <div className="flex flex-col items-start gap-1 flex-wrap">
              <span className="text-xs font-semibold text-gray-500">Empresa:</span>
              <FilterChips
                chips={[
                  { key: 'all', label: 'Todas', active: filterEmpresaId === null },
                  ...empresas.map(e => ({ key: String(e.id), label: e.nombre, active: filterEmpresaId === e.id }))
                ]}
                onToggle={(key) => {
                  setFilterEmpresaId(key === 'all' ? null : Number(key));
                }}
              />
            </div>
          )}
          <div className="flex flex-col items-start gap-1 flex-wrap">
            <span className="text-xs font-semibold text-gray-500">Motivo:</span>
            <FilterChips
              chips={[
                { key: 'all', label: 'Todos', active: filterMotivo === null },
                ...MOTIVOS.map(m => ({ key: m.key, label: m.label, active: filterMotivo === m.key }))
              ]}
              onToggle={(key) => setFilterMotivo(key === 'all' ? null : key)}
            />
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-1 w-full sm:items-end sm:w-1/2">
          {tecnicos.length > 0 && (
            <div className="flex flex-col sm:px-0 px-10 w-full sm:w-auto gap-1">
              <label htmlFor="filtro-tecnico" className="text-xs font-semibold text-gray-500">
                Técnico:
              </label>
              <select
                id="filtro-tecnico"
                value={filterTecnicoId || ""}
                onChange={(e) => {
                  const valor = e.target.value;
                  setFilterTecnicoId(valor === "" ? null : valor);
                }}
                className="w-full sm:w-64 px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id} className="hover:!bg-primary-600 hover:!text-white ">
                    {t.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex sm:justify-end justify-around sm:gap-4 w-full sm:w-full">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-500">Desde:</span>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-500">Hasta:</span>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
          </div>
        </div>
      </div>
      <div className="h-6">
        {filtroActivado && (
          <button
            onClick={() => { setFilterEmpresaId(null); setFilterTecnicoId(null); setFilterMotivo(null); setFechaInicio(''); setFechaFin(''); }}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      {error && (
        <div className="mb-5 p-4 rounded-xl text-sm font-medium bg-red-50 text-red-800 border border-red-200 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => cargar()} className="ml-auto underline font-semibold">Reintentar</button>
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
      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar reportes..." />
      {loading ? (
        <div className="flex flex-col items-center sm:py-60 py-20 bg-white rounded-2xl shadow-lg border border-gray-100 mt-2">
          <AnimatedWifiIcon/>
        </div>
      ) : !reportes.length ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-16 sm:py-60 py-20 text-center mt-2">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium text-gray-400">Sin reportes registrados</p>
          <p className="text-sm text-gray-300 mt-1">Los reportes generados por los tecnicos apareceran aqui.</p>
          {filtroActivado && (
            <p className="text-sm text-gray-400 font-semibold">Prueba ajustando tus filtros para ver resultados</p>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto w-full sm:max-h-[calc(100vh-25rem)] max-h-[calc(100vh-14rem)] mt-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-600 to-primary-700">
                    <TableTh className="text-white/80">ID</TableTh>
                    <TableTh className="text-white/80">Fecha</TableTh>
                    <TableTh className="text-white/80">Empresa</TableTh>
                    <TableTh className="text-white/80">Sede</TableTh>
                    <TableTh className="text-white/80">Tecnico</TableTh>
                    <TableTh className="text-white/80">Motivo</TableTh>
                    <TableTh className="text-white/80">Asesor</TableTh>
                    <TableTh className="text-white/80">Hallazgos</TableTh>
                    <TableTh className="text-white/80 text-center">PDF/Enc.</TableTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportes.map(r => (
                    <tr key={r.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-5 py-4 text-xs font-bold text-primary-600 font-mono">#{r.id}</td>
                      <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{formatFecha(r.fecha_hora)}</td>
                      <td className="px-5 py-4 text-xs font-medium text-gray-700">{r.empresa_nombre || '—'}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{r.sede_nombre || '—'}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{r.tecnico_nombre || '—'}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{r.motivo_visita || '—'}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{r.nombre_asesor || '—'}</td>
                      <td className="px-5 py-4 text-xs text-gray-400 max-w-[220px] truncate">{r.hallazgos || '—'}</td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => previsualizar(r.id)} 
                            className="p-2 rounded-xl transition-all hover:bg-orange-50">
                            {previewLoadingId === r.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
                            ) : (
                              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                          {previewUrl && (
                            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 md:p-6 animate-fade-in" onClick={cerrarPreview}>
                              <div className="bg-white rounded-2xl w-full max-w-4xl h-[94vh] md:h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <h2 className="text-lg font-bold text-gray-800">Vista Previa del Reporte</h2>
                                    </div>
                                  </div>
                                  <button onClick={cerrarPreview} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Cerrar">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="flex-1 bg-gray-200 min-h-0">
                                  <iframe src={previewUrl} className="w-full h-full" title="Previsualizacion del PDF" />
                                </div>
                              </div>
                            </div>
                          )}
                          <button onClick={() => descargarPDF(r.id)} disabled={descargando === r.id}
                            className={`inline-flex items-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
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
                            {descargando === r.id ? '' : 'PDF'}
                          </button>
                          <button onClick={() => verEncuesta(r.id)}
                            className="inline-flex items-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all bg-amber-500 text-white hover:bg-amber-600 shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Enc.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
      <Pagination pagina={pagina} total={totalReportes} limit={LIMIT} onChange={setPagina} />
    </div>
  );
}