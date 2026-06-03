import { ReactNode } from 'react';
import AnimatedWifiIcon from '../assets/icons/AnimatedWifiIcon';
import useAdminSedes from '../hooks/useAdminSedes';

function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider ${className}`}>{children}</th>;
}

export default function AdminSedes() {
  const {
    items, empresas, form, setForm, editId, saving, cargando, msg, setMsg, showForm, setShowForm,
    resetForm, guardar, editar, eliminar, empresaNombre,
  } = useAdminSedes();

  return (
    <div className="animate-fade-in max-w-[100vw] sm:mx-auto">
      <div className="flex flex-col sm:gap-0 gap-4 sm:flex-row items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sedes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gestion de puntos de trabajo por empresa</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="py-2.5 px-5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? 'Cerrar' : 'Nueva Sede'}
        </button>
      </div>

      {msg && (
        <div className={`mb-5 p-4 rounded-xl text-sm font-medium border flex items-center gap-3 ${
          msg.includes('Error') ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'
        }`}>
          {msg.includes('Error') ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {msg}
        </div>
      )}

      {showForm && (
        <form onSubmit={guardar} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{editId ? 'Editar Sede' : 'Nueva Sede'}</h3>
          <p className="text-xs text-gray-400 mb-5">{editId ? 'Modifica los datos de la sede' : 'Ingresa los datos de la nueva sede'}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Empresa <span className="text-red-500">*</span></label>
              <select value={form.empresa_id} onChange={e => setForm({...form, empresa_id: e.target.value})} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all">
                <option value="">Seleccionar empresa...</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input placeholder="Nombre de la sede o punto" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ciudad</label>
              <input placeholder="Ciudad de ubicacion" value={form.ciudad} onChange={e => setForm({...form, ciudad: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Direccion</label>
              <input placeholder="Direccion del punto" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={saving}
              className="py-3 px-6 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 shadow-md flex items-center gap-2">
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              {saving ? 'Guardando...' : editId ? 'Actualizar Sede' : 'Crear Sede'}
            </button>
            <button type="button" onClick={resetForm}
              className="py-3 px-6 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto w-full">
        {cargando ? (
          <div className="flex flex-col items-center py-20">
            <AnimatedWifiIcon />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-primary-600 to-primary-700">
                  <Th className="text-white/80">ID</Th>
                  <Th className="text-white/80">Empresa</Th>
                  <Th className="text-white/80">Nombre</Th>
                  <Th className="text-white/80">Ciudad</Th>
                  <Th className="text-white/80 text-center">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 w-24  overflow-scroll">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-400 font-mono">#{i.id}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{empresaNombre(i.empresa_id)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800">{i.nombre}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{i.ciudad || '—'}</td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => editar(i)}
                          className="py-1.5 px-3 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all">Editar</button>
                        <button onClick={() => eliminar(i.id, i.nombre)}
                          className="py-1.5 px-3 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <p className="font-medium">Sin sedes registradas</p>
                      <p className="text-xs mt-1">Haz clic en &quot;Nueva Sede&quot; para crear la primera.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
