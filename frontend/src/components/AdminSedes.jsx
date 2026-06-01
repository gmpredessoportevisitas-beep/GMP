import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminSedes() {
  const { getToken } = useAuth();
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [form, setForm] = useState({ empresa_id: '', nombre: '', direccion: '', ciudad: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function cargar() {
    const t = await getToken();
    const [rSedes, rEmp] = await Promise.all([
      fetch(`${API}/api/admin/sedes`, { headers: { Authorization: `Bearer ${t}` } }),
      fetch(`${API}/api/admin/empresas`, { headers: { Authorization: `Bearer ${t}` } }),
    ]);
    if (rSedes.ok) setItems(await rSedes.json());
    if (rEmp.ok) setEmpresas(await rEmp.json());
  }

  useEffect(() => { cargar(); }, []);

  function resetForm() {
    setForm({ empresa_id: '', nombre: '', direccion: '', ciudad: '' });
    setEditId(null);
  }

  async function guardar(e) {
    e.preventDefault();
    setLoading(true); setMsg('');
    const t = await getToken();
    const body = { ...form, empresa_id: parseInt(form.empresa_id) };
    const url = editId ? `${API}/api/admin/sedes/${editId}` : `${API}/api/admin/sedes`;
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify(body),
    });
    if (res.ok) { setMsg(editId ? 'Sede actualizada.' : 'Sede creada.'); resetForm(); cargar(); }
    else { const err = await res.json().catch(()=>({})); setMsg(err.detail || 'Error.'); }
    setLoading(false);
  }

  function editar(item) {
    setEditId(item.id);
    setForm({ empresa_id: String(item.empresa_id), nombre: item.nombre, direccion: item.direccion || '', ciudad: item.ciudad || '' });
  }

  async function eliminar(id) {
    if (!confirm('Eliminar esta sede?')) return;
    const t = await getToken();
    await fetch(`${API}/api/admin/sedes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
    cargar();
  }

  function empresaNombre(id) {
    const e = empresas.find(x => x.id === id);
    return e ? e.nombre : '\u2014';
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Sedes</h2>
      {msg && <div className="mb-4 p-3 rounded-xl text-sm font-medium bg-green-50 text-green-800 border border-green-200">{msg}</div>}

      <form onSubmit={guardar} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <select value={form.empresa_id} onChange={e => setForm({...form, empresa_id: e.target.value})} required className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white">
          <option value="">Seleccionar empresa...</option>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <input placeholder="Nombre sede *" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
        <input placeholder="Ciudad" value={form.ciudad} onChange={e => setForm({...form, ciudad: e.target.value})} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
        <input placeholder="Direccion" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="py-2.5 px-6 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50">
            {loading ? 'Guardando...' : editId ? 'Actualizar' : 'Crear Sede'}
          </button>
          {editId && <button type="button" onClick={resetForm} className="py-2.5 px-6 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300">Cancelar</button>}
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b"><Th>ID</Th><Th>Empresa</Th><Th>Nombre</Th><Th>Ciudad</Th><Th className="text-center">Acciones</Th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-500">#{i.id}</td>
                  <td className="px-5 py-3 text-sm">{empresaNombre(i.empresa_id)}</td>
                  <td className="px-5 py-3 text-sm font-medium">{i.nombre}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{i.ciudad || '\u2014'}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => editar(i)} className="text-primary-600 hover:text-primary-800 text-sm font-medium mr-3">Editar</button>
                    <button onClick={() => eliminar(i.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Eliminar</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin sedes registradas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = '' }) {
  return <th className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}>{children}</th>;
}
