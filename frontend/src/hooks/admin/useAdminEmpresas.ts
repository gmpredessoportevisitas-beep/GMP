import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../useDebounce';
import { Empresa, EmpresaForm } from '../../types';

const API = import.meta.env.VITE_API_URL ?? '';

export default function useAdminEmpresas() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<Empresa[]>([]);
  const [form, setForm] = useState<EmpresaForm>({ nombre: '', nit: '', direccion: '', telefono: '', email: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await authFetch(`${API}/api/admin/empresas`);
      if (res.ok) setItems(await res.json() as Empresa[]);
    } finally {
      setCargando(false);
    }
  }, [authFetch]);

  useEffect(() => { cargar(); }, [cargar]);

  const resetForm = useCallback(() => {
    setForm({ nombre: '', nit: '', direccion: '', telefono: '', email: '' });
    setEditId(null);
    setShowForm(false);
  }, []);

  const guardar = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editId ? `${API}/api/admin/empresas/${editId}` : `${API}/api/admin/empresas`;
      const method = editId ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editId ? 'Empresa actualizada.' : 'Empresa creada.');
        resetForm();
        cargar();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Error al guardar.');
      }
    } finally {
      setSaving(false);
    }
  }, [authFetch, editId, form, resetForm, cargar]);

  const editar = useCallback((item: Empresa) => {
    setEditId(item.id);
    setForm({ nombre: item.nombre, nit: item.nit || '', direccion: item.direccion || '', telefono: item.telefono || '', email: item.email || '' });
    setShowForm(true);
  }, []);

  const eliminar = useCallback(async (id: number, nombre: string) => {
    const result = await Swal.fire({
      title: `Eliminar "${nombre}"?`,
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await authFetch(`${API}/api/admin/empresas/${id}`, { method: 'DELETE' });
      toast.success(`"${nombre}" eliminada.`);
      cargar();
    } catch {
      toast.error('Error al eliminar la empresa.');
    }
  }, [authFetch, cargar]);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;
    const term = debouncedSearch.toLowerCase();
    return items.filter(i =>
      i.nombre.toLowerCase().includes(term) ||
      (i.nit || '').toLowerCase().includes(term) ||
      (i.direccion || '').toLowerCase().includes(term) ||
      (i.telefono || '').toLowerCase().includes(term) ||
      (i.email || '').toLowerCase().includes(term)
    );
  }, [items, debouncedSearch]);

  return {
    items: filteredItems, allItems: items, form, setForm, editId, saving, cargando, showForm, setShowForm,
    cargar, resetForm, guardar, editar, eliminar, searchTerm, setSearchTerm,
  };
}