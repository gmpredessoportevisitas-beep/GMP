import AnimatedWifiIcon from '../../assets/icons/AnimatedWifiIcon';
import useAdminEmpresas from '../../hooks/admin/useAdminEmpresas';
import SearchBar from '../ui/SearchBar';
import TableTh from '../ui/TableTh';
import PageHeader from '../ui/PageHeader';
import AddEmpresaIcon from '../../assets/icons/empresas/AddEmpresaIcon';
import CloseEmpresaIcon from '../../assets/icons/empresas/CloseEmpresaIcon';
import CheckEmpresaIcon from '../../assets/icons/empresas/CheckEmpresaIcon';
import ButtonCrud from '../ui/ButtonCrud';

export default function AdminEmpresas() {
  const {
    items, form, setForm, editId, saving, cargando, showForm, setShowForm,
    resetForm, guardar, editar, eliminar, searchTerm, setSearchTerm,
  } = useAdminEmpresas();

  return (
    <div className="animate-fade-in max-w-[100vw] sm:mx-auto">
        <PageHeader
          title="Empresas"
          subtitle="Gestion de empresas registradas en el sistema"
          button={
            <ButtonCrud 
              label={'Nueva Empresa'} 
              onClick={() => setShowForm(!showForm)}
              className={showForm ? 'bg-gray-400 ' : 'bg-primary-600 hover:bg-primary-700'}
              icon={<AddEmpresaIcon/> } 
              disabled={showForm ? true : false}
            />
          }
        />
      <div className="mb-5">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar por nombre, NIT, direccion..." />
      </div>
      {showForm && (
        <form onSubmit={guardar} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-md font-bold text-gray-800 mb-1">{editId ? 'Editar Empresa' : 'Nueva Empresa'}</h3>
          <p className="text-xs text-gray-400 mb-5">{editId ? 'Modifica los datos de la empresa' : 'Ingresa los datos de la nueva empresa'}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input placeholder="Razon social de la empresa" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required
                className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">NIT</label>
              <input placeholder="Identificacion tributaria" value={form.nit} onChange={e => setForm({...form, nit: e.target.value})}
                className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Telefono</label>
              <input placeholder="Numero de contacto" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input placeholder="Correo electronico" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Direccion</label>
              <input placeholder="Direccion fisica" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})}
                className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
          </div>
          <div className="flex justify-start items-center gap-2 mt-4">
            <ButtonCrud
              label={editId ? 'Actualizar Empresa' : 'Crear Empresa'}
              type="submit"
              icon={!saving ? <CheckEmpresaIcon/> : <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
              className={'bg-primary-600 hover:bg-primary-700  shadow-sm'}
              disabled={saving}
            />
            <ButtonCrud
              label={'Cancelar'}
              onClick={resetForm}
              icon={<CloseEmpresaIcon/>}
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
                    <TableTh className="text-white/80">NIT</TableTh>
                    <TableTh className="text-white/80">Telefono</TableTh>
                    <TableTh className="text-white/80">Email</TableTh>
                    <TableTh className="text-white/80 text-center">Acciones</TableTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800">{i.nombre}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{i.nit || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{i.telefono || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{i.email || '—'}</td>
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
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="font-medium">Sin empresas registradas</p>
                      <p className="text-xs mt-1">Haz clic en &quot;Nueva Empresa&quot; para crear la primera.</p>
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