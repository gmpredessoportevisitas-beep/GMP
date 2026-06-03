import { ReactNode } from 'react';
import AnimatedWifiIcon from '../assets/icons/AnimatedWifiIcon';
import useAdminUsuarios from '../hooks/useAdminUsuarios';

function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider ${className}`}>{children}</th>;
}

export default function AdminUsuarios() {
  const {
    items, form, setForm, saving, cargando, msg, setMsg, showForm, setShowForm,
    cargar, resetForm, crearUsuario, toggleActivo,
  } = useAdminUsuarios();

  return (
    <div className="animate-fade-in max-w-[100vw] sm:mx-auto">
      <div className="flex flex-col sm:gap-0 gap-4 sm:flex-row items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gestion de tecnicos y administradores del sistema</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="py-2.5 px-5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? 'Cerrar' : 'Nuevo Usuario'}
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
        <form onSubmit={crearUsuario} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Nuevo Usuario</h3>
          <p className="text-xs text-gray-400 mb-5">Ingresa los datos del nuevo usuario del sistema</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
              <input placeholder="Nombres y apellidos" value={form.nombre_completo} onChange={e => setForm({...form, nombre_completo: e.target.value})} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Usuario <span className="text-red-500">*</span></label>
              <input placeholder="Nombre de usuario" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contrasena <span className="text-red-500">*</span></label>
              <input placeholder="Minimo 6 caracteres" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rol</label>
              <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all">
                <option value="tecnico">Tecnico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={saving}
              className="py-3 px-6 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 shadow-md flex items-center gap-2">
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              )}
              {saving ? 'Creando...' : 'Crear Usuario'}
            </button>
            <button type="button" onClick={resetForm}
              className="py-3 px-6 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {cargando ? (
          <div className="flex flex-col items-center py-20">
            <AnimatedWifiIcon />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-primary-600 to-primary-700">
                  <Th className="text-white/80">Nombre</Th>
                  <Th className="text-white/80">Usuario</Th>
                  <Th className="text-white/80">Rol</Th>
                  <Th className="text-white/80">Estado</Th>
                  <Th className="text-white/80 text-center">Accion</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800">{i.nombre_completo}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{i.username}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        i.rol === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {i.rol === 'admin' ? 'Administrador' : 'Tecnico'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                        i.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${i.activo ? 'bg-green-600' : 'bg-red-600'}`} />
                        {i.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => toggleActivo(i.id)}
                        className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
                          i.activo
                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                        }`}>
                        {i.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="font-medium">Sin usuarios registrados</p>
                      <p className="text-xs mt-1">Haz clic en &quot;Nuevo Usuario&quot; para crear el primero.</p>
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
