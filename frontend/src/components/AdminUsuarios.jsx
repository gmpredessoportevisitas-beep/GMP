import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminUsuarios() {
  const { getToken } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', nombre_completo: '', rol: 'tecnico' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function cargar() {
    const t = await getToken();
    const res = await fetch(`${API}/api/admin/usuarios`, { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => { cargar(); }, []);

  async function crearUsuario(e) {
    e.preventDefault();
    setLoading(true); setMsg('');
    const t = await getToken();
    const res = await fetch(`${API}/api/admin/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg('Usuario creado exitosamente.');
      setForm({ email: '', password: '', nombre_completo: '', rol: 'tecnico' });
      cargar();
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.detail || 'Error al crear usuario.');
    }
    setLoading(false);
  }

  async function toggleActivo(userId) {
    const t = await getToken();
    const res = await fetch(`${API}/api/admin/usuarios/${userId}/toggle`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.ok) cargar();
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Usuarios</h2>
      {msg && <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${msg.includes('Error') ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'} border`}>{msg}</div>}

      <form onSubmit={crearUsuario} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input placeholder="Nombre completo *" value={form.nombre_completo} onChange={e => setForm({...form, nombre_completo: e.target.value})} required className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
        <input placeholder="Email *" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
        <input placeholder="Contrasena (min 6) *" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
        <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white">
          <option value="tecnico">Tecnico</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit" disabled={loading} className="py-2.5 px-6 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50">
          {loading ? 'Creando...' : 'Crear Usuario'}
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b"><Th>Nombre</Th><Th>Email</Th><Th>Rol</Th><Th>Estado</Th><Th className="text-center">Accion</Th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium">{i.nombre_completo}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{i.email}</td>
                  <td className="px-5 py-3 text-sm">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${i.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {i.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${i.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {i.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => toggleActivo(i.id)} className={`text-sm font-medium ${i.activo ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}>
                      {i.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin usuarios registrados</td></tr>}
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
