import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../useDebounce';
import { Perfil, UsuarioForm } from '../../types';

const API = import.meta.env.VITE_API_URL ?? '';

export default function useAdminUsuarios() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<Perfil[]>([]);
  const [form, setForm] = useState<UsuarioForm>({ username: '', password: '', nombre_completo: '', rol: 'tecnico' });
  const [saving, setSaving] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

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
    setSaving(true);
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/admin/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Usuario creado exitosamente.');
        resetForm();
        cargar();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Error al crear usuario.');
      }
    } finally {
      setSaving(false);
    }
  }, [getToken, form, resetForm, cargar]);

  const toggleActivo = useCallback(async (userId: string, nombre: string, activo: boolean) => {
    const accion = activo ? 'Desactivar' : 'Activar';
    const result = await Swal.fire({
      title: `${accion} "${nombre}"?`,
      text: activo ? 'El usuario no podra iniciar sesion hasta que se reactive.' : 'El usuario podra iniciar sesion nuevamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: activo ? '#dc2626' : '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Si, ${accion.toLowerCase()}`,
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
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

  const cambiarPassword = useCallback(async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      toast.warning('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSaving(true);
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/admin/usuarios/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        toast.success('Contraseña actualizada correctamente.');
        setEditingPasswordId(null);
        setNewPassword('');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Error al cambiar contraseña.');
      }
    } finally {
      setSaving(false);
    }
  }, [getToken, newPassword]);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const filteredItems = useMemo(() => {
    let result = items;
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(i =>
        i.nombre_completo.toLowerCase().includes(term) ||
        (i.username || '').toLowerCase().includes(term)
      );
    }
    if (filtroRol) result = result.filter(i => i.rol === filtroRol);
    if (filtroEstado === 'activo') result = result.filter(i => i.activo);
    else if (filtroEstado === 'inactivo') result = result.filter(i => !i.activo);
    return result;
  }, [items, debouncedSearch, filtroRol, filtroEstado]);

  return {
    items: filteredItems, allItems: items, form, setForm, saving, cargando, showForm, setShowForm,
    cargar, resetForm, crearUsuario, toggleActivo, cambiarPassword,
    editingPasswordId, setEditingPasswordId, newPassword, setNewPassword,
    searchTerm, setSearchTerm, filtroRol, setFiltroRol, filtroEstado, setFiltroEstado,
  };
}