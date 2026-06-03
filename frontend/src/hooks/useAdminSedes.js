import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL ?? '';

export default function useAdminSedes() {
  const { getToken } = useAuth();
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [form, setForm] = useState({ empresa_id: '', nombre: '', direccion: '', ciudad: '' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const t = await getToken();
      const [rSedes, rEmp] = await Promise.all([
        fetch(`${API}/api/admin/sedes`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/api/admin/empresas`, { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      if (rSedes.ok) setItems(await rSedes.json());
      if (rEmp.ok) setEmpresas(await rEmp.json());
    } finally {
      setCargando(false);
    }
  }, [getToken]);

  useEffect(() => { cargar(); }, [cargar]);

  const resetForm = useCallback(() => {
    setForm({ empresa_id: '', nombre: '', direccion: '', ciudad: '' });
    setEditId(null);
    setShowForm(false);
  }, []);

  const guardar = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const t = await getToken();
      const body = { ...form, empresa_id: parseInt(form.empresa_id) };
      const url = editId ? `${API}/api/admin/sedes/${editId}` : `${API}/api/admin/sedes`;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify(body),
      });
      if (res.ok) { setMsg(editId ? 'Sede actualizada.' : 'Sede creada.'); resetForm(); cargar(); }
      else { const err = await res.json().catch(() => ({})); setMsg(err.detail || 'Error.'); }
    } finally {
      setSaving(false);
    }
  }, [getToken, form, editId, resetForm, cargar]);

  const editar = useCallback((item) => {
    setEditId(item.id);
    setForm({ empresa_id: String(item.empresa_id), nombre: item.nombre, direccion: item.direccion || '', ciudad: item.ciudad || '' });
    setShowForm(true);
  }, []);

  const eliminar = useCallback(async (id, nombre) => {
    if (!window.confirm(`Eliminar "${nombre}"? Esta accion no se puede deshacer.`)) return;
    try {
      const t = await getToken();
      await fetch(`${API}/api/admin/sedes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      cargar();
    } catch {
      // ignore
    }
  }, [getToken, cargar]);

  const empresaNombre = useCallback((id) => {
    const e = empresas.find(x => x.id === id);
    return e ? e.nombre : '—';
  }, [empresas]);

  return {
    items, empresas, form, setForm, editId, saving, cargando, msg, setMsg, showForm, setShowForm,
    cargar, resetForm, guardar, editar, eliminar, empresaNombre,
  };
}
