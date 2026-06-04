import AnimatedWifiIcon from '../assets/icons/AnimatedWifiIcon';
import useAdminEncuestaPreguntas from '../hooks/useAdminEncuestaPreguntas';
import TableTh from './TableTh';
import PageHeader from './PageHeader';
import AddEncuestaIcon from '../assets/icons/encuestas/AddEncuestaIcon';
import CloseEncuestaIcon from '../assets/icons/encuestas/CloseEncuestaIcon';
import CheckEncuestaIcon from '../assets/icons/encuestas/CheckEncuestaIcon';
import ButtonCrud from './ButtonCrud';

export default function AdminEncuestaPreguntas() {
  const {
    items, form, setForm, editId, saving, cargando, msg, setMsg, showForm, setShowForm,
    resetForm, guardar, editar, eliminar,
  } = useAdminEncuestaPreguntas();

  return (
    <div className="animate-fade-in max-w-[100vw] sm:mx-auto">
        <PageHeader
          title="Encuesta"
          subtitle="Gestion de preguntas para la encuesta de satisfaccion"
          button={
            <ButtonCrud 
              label={'Nueva Pregunta'} 
              onClick={() => setShowForm(!showForm)}
              className={showForm ? 'bg-gray-400 ' : 'bg-primary-600 hover:bg-primary-700'}
              icon={<AddEncuestaIcon/> } 
              disabled={showForm ? true : false}
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
      {showForm && (
        <form onSubmit={guardar} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-md font-bold text-gray-800 mb-1">{editId ? 'Editar Pregunta' : 'Nueva Pregunta'}</h3>
          <p className="text-xs text-gray-400 mb-5">{editId ? 'Modifica los datos de la pregunta' : 'Ingresa los datos de la nueva pregunta'}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Texto <span className="text-red-500">*</span></label>
              <textarea placeholder="Texto de la pregunta" value={form.texto} onChange={e => setForm({...form, texto: e.target.value})} required
                className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all resize-none" rows={2} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Orden</label>
              <input placeholder="Posicion en la encuesta" type="number" min={0} value={form.orden} onChange={e => setForm({...form, orden: Number(e.target.value)})}
                className="text-sm w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={form.activa} onChange={e => setForm({...form, activa: e.target.checked})}
                    className="sr-only peer" />
                  <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-primary-500 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform"></div>
                </div>
                <span className="text-sm font-semibold text-gray-700">Activa</span>
              </label>
            </div>
          </div>
          <div className="flex justify-start items-center gap-2 mt-4">
            <ButtonCrud
              label={editId ? 'Actualizar Pregunta' : 'Crear Pregunta'}
              type="submit"
              icon={!saving ? <CheckEncuestaIcon/> : <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
              className={'bg-primary-600 hover:bg-primary-700  shadow-sm'}
              disabled={saving}
            />
            <ButtonCrud
              label={'Cancelar'}
              onClick={resetForm}
              icon={<CloseEncuestaIcon/>}
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
                    <TableTh className="text-white/80">Orden</TableTh>
                    <TableTh className="text-white/80">Pregunta</TableTh>
                    <TableTh className="text-white/80 text-center">Activa</TableTh>
                    <TableTh className="text-white/80 text-center">Acciones</TableTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-400 font-mono text-center">{i.orden}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800 max-w-md truncate">{i.texto}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        i.activa ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${i.activa ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {i.activa ? 'Si' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => editar(i)}
                          className="py-1.5 px-3 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all">Editar</button>
                        <button onClick={() => eliminar(i.id, i.texto)}
                          className="py-1.5 px-3 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="font-medium">Sin preguntas registradas</p>
                      <p className="text-xs mt-1">Haz clic en &quot;Nueva Pregunta&quot; para crear la primera.</p>
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
