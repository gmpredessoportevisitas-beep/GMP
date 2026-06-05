import AnimatedWifiIcon from '../assets/icons/AnimatedWifiIcon';
import useAdminSedes from '../hooks/useAdminSedes';
import SearchBar from './SearchBar';
import FilterChips from './FilterChips';
import Pagination from './Pagination';
import TableTh from './TableTh';
import PageHeader from './PageHeader';
import ButtonCrud from './ButtonCrud';
import AddSedeIcon from '../assets/icons/sedes/AddSedeIcon';
import CloseSedeIcon from '../assets/icons/sedes/CloseSedeIcon';
import CheckSedeIcon from '../assets/icons/sedes/CheckSedeIcon';

export default function AdminSedes() {
  const {
    items, total, empresas, form, setForm, editId, saving, cargando, msg, setMsg, showForm, setShowForm,
    resetForm, guardar, editar, eliminar, empresaNombre, allEmpresas,
    pagina, setPagina, searchTerm, setSearchTerm, filterEmpresaId, setFilterEmpresaId, PAGE_SIZE,
  } = useAdminSedes();

  const empresaChips = allEmpresas.map(e => ({
    key: String(e.id),
    label: e.nombre,
    active: filterEmpresaId === e.id,
  }));

  return (
    <div className="animate-fade-in max-w-[100vw] sm:mx-auto min-h-full flex flex-col justify-between">
      <div>
        <PageHeader
          title="Sedes"
          subtitle="Gestion de puntos de trabajo por empresa"
          button={
            <ButtonCrud
              label={'Nueva Sede'}
              onClick={() => setShowForm(!showForm)}
              disabled={showForm}
              icon={showForm ? <CloseSedeIcon /> : <AddSedeIcon />}
              className={showForm ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'} 
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
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar por nombre o ciudad..." />
        </div>
        {empresaChips.length > 0 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap px-2 sm:px-0">
            <span className="text-xs font-semibold text-gray-500 mr-1">Empresa:</span>
            <FilterChips
              chips={[{ key: 'all', label: 'Todas', active: filterEmpresaId === null }, ...empresaChips]}
              onToggle={(key) => setFilterEmpresaId(key === 'all' ? null : Number(key))}
            />
          </div>
        )}

        {showForm && (
          <form onSubmit={guardar} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <h3 className="text-md font-bold text-gray-800 mb-1">{editId ? 'Editar Sede' : 'Nueva Sede'}</h3>
            <p className="text-xs text-gray-400 mb-5">{editId ? 'Modifica los datos de la sede' : 'Ingresa los datos de la nueva sede'}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Empresa <span className="text-red-500">*</span></label>
                <select value={form.empresa_id} onChange={e => setForm({...form, empresa_id: e.target.value})} required
                  className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all">
                  <option value="">Seleccionar empresa...</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                <input placeholder="Nombre de la sede o punto" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required
                  className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ciudad</label>
                <input placeholder="Ciudad de ubicacion" value={form.ciudad} onChange={e => setForm({...form, ciudad: e.target.value})}
                  className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Direccion</label>
                <input placeholder="Direccion del punto" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})}
                  className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
              </div>
            </div>
            <div className="flex justify-start items-center gap-2 mt-4">
              <ButtonCrud
                label={editId ? 'Actualizar Sede' : 'Crear Sede'}
                type="submit"
                disabled={saving}
                icon={!saving ? <CheckSedeIcon/> : <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                className={'bg-primary-600 hover:bg-primary-700  shadow-sm'}
              />
              <ButtonCrud
                label={'Cancelar'}
                onClick={resetForm}
                icon={<CloseSedeIcon />}
                className={'bg-white !text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all '}
              />
            </div>
          </form>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto w-full max-h-[calc(100vh-21rem)]">
          {cargando ? (
            <div className="flex flex-col items-center sm:py-60 py-20">
              <AnimatedWifiIcon />
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-600 to-primary-700">
                    <TableTh className="text-white/80">Empresa</TableTh>
                    <TableTh className="text-white/80">Nombre</TableTh>
                    <TableTh className="text-white/80">Dirección</TableTh>
                    <TableTh className="text-white/80 text-center">Acciones</TableTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 overflow-scroll">
                  {items.map((i) => (
                    <tr key={i.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-5 py-2 text-xs text-gray-700">{empresaNombre(i.empresa_id)}</td>
                      <td className="px-5 py-2 text-xs font-semibold text-gray-800">{i.nombre}</td>
                      <td className="px-5 py-2 text-xs text-gray-500">{i.direccion || '—'}</td>
                      <td className="px-5 py-2 text-center">
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
        <Pagination pagina={pagina} total={total} limit={PAGE_SIZE} onChange={setPagina} />
    </div>
  );
}