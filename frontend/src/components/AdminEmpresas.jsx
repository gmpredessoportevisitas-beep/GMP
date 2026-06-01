import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminEmpresas() {
  const { getToken } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ nombre: '', nit: '', direccion: '', telefono: '', email: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function cargar() {
    const t = await getToken();
    const res = await fetch(`${API}/api/admin/empresas`, { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => { cargar(); }, []);

  function resetForm() {
    setForm({ nombre: '', nit: '', direccion: '', telefono: '', email: '' });
    setEditId(null);
  }

  async function guardar(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const t = await getToken();
    const url = editId ? `${API}/api/admin/empresas/${editId}` : `${API}/api/admin/empresas`;
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg(editId ? 'Empresa actualizada.' : 'Empresa creada.');
      resetForm();
      cargar();
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.detail || 'Error al guardar.');
    }
    setLoading(false);
  }

  function editar(item) {
    setEditId(item.id);
    setForm({ nombre: item.nombre, nit: item.nit || '', direccion: item.direccion || '', telefono: item.telefono || '', email: item.email || '' });
  }

  async function eliminar(id) {
    if (!confirm('Eliminar esta empresa?')) return;
    const t = await getToken();
    await fetch(`${API}/api/admin/empresas/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
    cargar();
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Empresas</h2>

      {msg && <div className="mb-4 p-3 rounded-xl text-sm font-medium bg-green-50 text-green-800 border border-green-200">{msg}</div>}

      <form onSubmit={guardar} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input placeholder="Nombre *" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
        <input placeholder="NIT" value={form.nit} onChange={e => setForm({...form, nit: e.target.value})} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
        <input placeholder="Telefono" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
        <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none md:col-span-2" />
        <input placeholder="Direccion" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none md:col-span-2" />
        <div className="flex gap-2 md:col-span-3">
          <button type="submit" disabled={loading} className="py-2.5 px-6 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50">
            {loading ? 'Guardando...' : editId ? 'Actualizar' : 'Crear Empresa'}
          </button>
          {editId && <button type="button" onClick={resetForm} className="py-2.5 px-6 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300">Cancelar</button>}
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <Th>ID</Th><Th>Nombre</Th><Th>NIT</Th><Th>Telefono</Th><Th>Email</Th><Th className="text-center">Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-500">#{i.id}</td>
                  <td className="px-5 py-3 text-sm font-medium">{i.nombre}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{i.nit || '\u2014'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{i.telefono || '\u2014'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{i.email || '\u2014'}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => editar(i)} className="text-primary-600 hover:text-primary-800 text-sm font-medium mr-3">Editar</button>
                    <button onClick={() => eliminar(i.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Eliminar</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin empresas registradas</td></tr>}
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
