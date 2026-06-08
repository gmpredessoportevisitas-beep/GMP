import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../useDebounce';
import { EncuestaPregunta } from '../../types';

const API = import.meta.env.VITE_API_URL ?? '';

interface PreguntaForm {
  texto: string;
  activa: boolean;
  orden: number;
}

export default function useAdminEncuestaPreguntas() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<EncuestaPregunta[]>([]);
  const [form, setForm] = useState<PreguntaForm>({ texto: '', activa: true, orden: 0 });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await authFetch(`${API}/api/admin/encuesta-preguntas`);
      if (res.ok) setItems(await res.json() as EncuestaPregunta[]);
    } finally {
      setCargando(false);
    }
  }, [authFetch]);

  useEffect(() => { cargar(); }, [cargar]);

  const resetForm = useCallback(() => {
    setForm({ texto: '', activa: true, orden: 0 });
    setEditId(null);
    setShowForm(false);
  }, []);

  const guardar = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editId ? `${API}/api/admin/encuesta-preguntas/${editId}` : `${API}/api/admin/encuesta-preguntas`;
      const method = editId ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editId ? 'Pregunta actualizada.' : 'Pregunta creada.');
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

  const editar = useCallback((item: EncuestaPregunta) => {
    setEditId(item.id);
    setForm({ texto: item.texto, activa: item.activa, orden: item.orden });
    setShowForm(true);
  }, []);

  const eliminar = useCallback(async (id: number, texto: string) => {
    const result = await Swal.fire({
      title: `Eliminar "${texto}"?`,
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
      await authFetch(`${API}/api/admin/encuesta-preguntas/${id}`, { method: 'DELETE' });
      toast.success('Pregunta eliminada.');
      cargar();
    } catch {
      toast.error('Error al eliminar la pregunta.');
    }
  }, [authFetch, cargar]);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;
    const term = debouncedSearch.toLowerCase();
    return items.filter(i =>
      i.texto.toLowerCase().includes(term)
    );
  }, [items, debouncedSearch]);

  return {
    items: filteredItems, allItems: items, form, setForm, editId, saving, cargando, showForm, setShowForm,
    cargar, resetForm, guardar, editar, eliminar, searchTerm, setSearchTerm,
  };
}