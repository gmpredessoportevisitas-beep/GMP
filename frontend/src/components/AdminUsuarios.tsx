import { useState, Fragment } from 'react';
import AnimatedWifiIcon from '../assets/icons/AnimatedWifiIcon';
import useAdminUsuarios from '../hooks/useAdminUsuarios';
import SearchBar from './SearchBar';
import FilterChips from './FilterChips';
import TableTh from './TableTh';
import PageHeader from './PageHeader';
import CloseUsuarioIcon from '../assets/icons/usuarios/CloseUsuarioIcon';
import AddUsuarioIcon from '../assets/icons/usuarios/AddUsuarioIcon';
import ButtonCrud from './ButtonCrud';
import CheckUsuarioIcon from '../assets/icons/usuarios/CheckUsuarioIcon';
import EyeIcon from '../assets/icons/EyeIcon';


export default function AdminUsuarios() {
  const {
    items, form, setForm, saving, cargando, msg, setMsg, showForm, setShowForm,
    resetForm, crearUsuario, toggleActivo, cambiarPassword,
    editingPasswordId, setEditingPasswordId, newPassword, setNewPassword,
    searchTerm, setSearchTerm, filtroRol, setFiltroRol, filtroEstado, setFiltroEstado,
  } = useAdminUsuarios();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const rolChips = [
    { key: 'all', label: 'Todos', active: filtroRol === null },
    { key: 'admin', label: 'Administrador', active: filtroRol === 'admin' },
    { key: 'tecnico', label: 'Tecnico', active: filtroRol === 'tecnico' },
  ];

  const estadoChips = [
    { key: 'all', label: 'Todos', active: filtroEstado === null },
    { key: 'activo', label: 'Activo', active: filtroEstado === 'activo' },
    { key: 'inactivo', label: 'Inactivo', active: filtroEstado === 'inactivo' },
  ];

  return (
    <div className="animate-fade-in max-w-[100vw] sm:mx-auto">
        <PageHeader
          title="Usuarios"
          subtitle="Gestion de tecnicos y administradores del sistema"
          button={
            <ButtonCrud
              label="Nuevo Usuario"
              onClick={() => setShowForm(!showForm)}
              icon={<AddUsuarioIcon/>}
              className={showForm ? 'bg-gray-400 ' : 'bg-primary-600 hover:bg-primary-700'}
              disabled={showForm ? true : false}
              type="button"
            />
          }
        />

      {msg && (
        <div className={`mb-5 p-4 rounded-xl text-sm font-medium border flex items-center gap-3 ${
          msg.includes('Error') ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'
        }`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {msg}
          <button onClick={() => setMsg('')} className="ml-auto text-gray-400 hover:text-gray-600">X</button>
        </div>
      )}

      <div className="mb-4">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar por nombre o usuario..." />
      </div>

      <div className="mb-4 space-y-2 sm:px-0 px-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500">Rol:</span>
          <FilterChips chips={rolChips} onToggle={(key) => setFiltroRol(key === 'all' ? null : key as 'admin' | 'tecnico')} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500">Estado:</span>
          <FilterChips chips={estadoChips} onToggle={(key) => setFiltroEstado(key === 'all' ? null : key)} />
        </div>
      </div>

      {showForm && (
        <form onSubmit={crearUsuario} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-md font-bold text-gray-800 mb-1">Nuevo Usuario</h3>
          <p className="text-xs text-gray-400 mb-5">Ingresa los datos del nuevo usuario del sistema</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
              <input placeholder="Nombres y apellidos" value={form.nombre_completo} onChange={e => setForm({...form, nombre_completo: e.target.value})} required
                className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Usuario <span className="text-red-500">*</span></label>
              <input placeholder="Nombre de usuario" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required
                className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contrasena <span className="text-red-500">*</span></label>
              <div className="relative">
                <input placeholder="Minimo 6 caracteres" type={showNewPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6}
                  className="text-sm w-full px-4 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  <EyeIcon isOpen={showNewPassword} size={20}/>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Rol</label>
              <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value as 'admin' | 'tecnico'})}
                className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all">
                <option value="tecnico">Tecnico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex justify-start items-center gap-2 mt-4">
            <ButtonCrud
              label={saving ? 'Creando...' : 'Crear Usuario'}
              type="submit"
              disabled={saving}
              icon={!saving ? <CheckUsuarioIcon/> : <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
              className={'bg-primary-600 hover:bg-primary-700'}
            />
            <ButtonCrud
              label="Cancelar"
              onClick={resetForm}
              icon={<CloseUsuarioIcon />}
              className={'bg-white !text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all '}
            />
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {cargando ? (
          <div className="flex flex-col items-center sm:py-60 py-20">
            <AnimatedWifiIcon />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-primary-600 to-primary-700">
                    <TableTh className="text-white/80">Nombre</TableTh>
                    <TableTh className="text-white/80">Usuario</TableTh>
                    <TableTh className="text-white/80">Rol</TableTh>
                    <TableTh className="text-white/80">Estado</TableTh>
                    <TableTh className="text-white/80 text-center">Acciones</TableTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {items.map((i) => (
                   <Fragment key={i.id}>
                   <tr className="hover:bg-orange-50/50 transition-colors">
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
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => toggleActivo(i.id)}
                          title={i.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                            i.activo
                              ? 'text-red-600 bg-red-50 hover:bg-red-100'
                              : 'text-green-600 bg-green-50 hover:bg-green-100'
                          }`}>
                          {i.activo ? 
                            (<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-user-off" height={24} strokeWidth={2} width={24} viewBox="0 0 24 24"><path fill="none" stroke="none" d="M0 0h24v24H0z"/><path d="M8.18 8.189a4.01 4.01 0 0 0 2.616 2.627m3.507-.545a4 4 0 1 0-5.59-5.552M6 21v-2a4 4 0 0 1 4-4h4c.412 0 .81.062 1.183.178m2.633 2.618c.12.38.184.785.184 1.204v2M3 3l18 18"/></svg> ) :
                            (<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-user-check" height={24} strokeWidth={2} width={24} viewBox="0 0 24 24"><path fill="none" stroke="none" d="M0 0h24v24H0z"/><path d="M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4m1 4 2 2 4-4"/></svg> )
                          }
                        </button>
                        <button onClick={() => {
                          if (editingPasswordId === i.id) {
                            setEditingPasswordId(null);
                            setNewPassword('');
                          } else {
                            setEditingPasswordId(i.id);
                            setNewPassword('');
                            setShowEditPassword(false);
                          }
                        }}
                          title="Cambiar contrasena"
                          className={`p-2 text-xs font-semibold rounded-lg transition-all ${
                            editingPasswordId === i.id
                              ? 'bg-[#FDE6D4] text-[#CE6400]'
                              : 'bg-[#FDE6D4] text-[#CE6400]'
                          }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-user-key">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                            <path d="M6 21v-2a4 4 0 0 1 4 -4h5" />
                            <path d="M18.5 18.5l-3.5 3.5l-1.5 -1.5" />
                            <path d="M18.554 18.414a2 2 0 1 1 2.828 -2.828a2 2 0 0 1 -2.828 2.828" />
                            <path d="M16 19l1 1" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingPasswordId === i.id && (
                    <tr key={`pw-${i.id}`} className="bg-blue-50/30">
                      <td colSpan={5} className="px-5 py-3">
                        <div className="flex items-center gap-3 justify-center">
                          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">Nueva contrasena para {i.nombre_completo}:</span>
                          <div className="relative flex-1 max-w-xs">
                            <input
                              type={showEditPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Minimo 6 caracteres"
                              minLength={6}
                              className="text-sm w-full px-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} tabIndex={-1}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                              <EyeIcon isOpen={showEditPassword} size={20}/>
                            </button>
                          </div>
                          <button onClick={() => cambiarPassword(i.id)} disabled={saving}
                            className="py-2 px-4 text-xs font-semibold rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white disabled:opacity-50 transition-all whitespace-nowrap">
                            {saving ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button onClick={() => { setEditingPasswordId(null); setNewPassword(''); }}
                            className="py-2 px-3 text-xs font-semibold rounded-lg bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all whitespace-nowrap">
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
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