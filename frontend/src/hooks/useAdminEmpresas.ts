import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Empresa, EmpresaForm } from '../types';

const API = import.meta.env.VITE_API_URL ?? '';

export default function useAdminEmpresas() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<Empresa[]>([]);
  const [form, setForm] = useState<EmpresaForm>({ nombre: '', nit: '', direccion: '', telefono: '', email: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/admin/empresas`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) setItems(await res.json() as Empresa[]);
    } finally {
      setCargando(false);
    }
  }, [getToken]);

  useEffect(() => { cargar(); }, [cargar]);

  const resetForm = useCallback(() => {
    setForm({ nombre: '', nit: '', direccion: '', telefono: '', email: '' });
    setEditId(null);
    setShowForm(false);
  }, []);

  const guardar = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
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
    } finally {
      setSaving(false);
    }
  }, [getToken, editId, form, resetForm, cargar]);

  const editar = useCallback((item: Empresa) => {
    setEditId(item.id);
    setForm({ nombre: item.nombre, nit: item.nit || '', direccion: item.direccion || '', telefono: item.telefono || '', email: item.email || '' });
    setShowForm(true);
  }, []);

  const eliminar = useCallback(async (id: number, nombre: string) => {
    if (!window.confirm(`Eliminar "${nombre}"? Esta accion no se puede deshacer.`)) return;
    try {
      const t = await getToken();
      await fetch(`${API}/api/admin/empresas/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      cargar();
    } catch {
      // ignore
    }
  }, [getToken, cargar]);

  return {
    items, form, setForm, editId, saving, cargando, msg, setMsg, showForm, setShowForm,
    cargar, resetForm, guardar, editar, eliminar,
  };
}
