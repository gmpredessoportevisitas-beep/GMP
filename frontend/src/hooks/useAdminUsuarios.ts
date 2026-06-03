import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Perfil, UsuarioForm } from '../types';

const API = import.meta.env.VITE_API_URL ?? '';

export default function useAdminUsuarios() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<Perfil[]>([]);
  const [form, setForm] = useState<UsuarioForm>({ username: '', password: '', nombre_completo: '', rol: 'tecnico' });
  const [saving, setSaving] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/admin/usuarios`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) setItems(await res.json() as Perfil[]);
    } finally {
      setCargando(false);
    }
  }, [getToken]);

  useEffect(() => { cargar(); }, [cargar]);

  const resetForm = useCallback(() => {
    setForm({ username: '', password: '', nombre_completo: '', rol: 'tecnico' });
    setShowForm(false);
  }, []);

  const crearUsuario = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/admin/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg('Usuario creado exitosamente.');
        resetForm();
        cargar();
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg(err.detail || 'Error al crear usuario.');
      }
    } finally {
      setSaving(false);
    }
  }, [getToken, form, resetForm, cargar]);

  const toggleActivo = useCallback(async (userId: string) => {
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/admin/usuarios/${userId}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) cargar();
    } catch {
      // ignore
    }
  }, [getToken, cargar]);

  return {
    items, form, setForm, saving, cargando, msg, setMsg, showForm, setShowForm,
    cargar, resetForm, crearUsuario, toggleActivo,
  };
}
