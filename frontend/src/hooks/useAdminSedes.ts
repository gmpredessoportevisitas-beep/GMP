import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from './useDebounce';
import { Sede, Empresa, SedeForm, PaginatedResponse } from '../types';

const API = import.meta.env.VITE_API_URL ?? '';
const PAGE_SIZE = 20;

export default function useAdminSedes() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<Sede[]>([]);
  const [total, setTotal] = useState(0);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [form, setForm] = useState<SedeForm>({ empresa_id: '', nombre: '', direccion: '', ciudad: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresaId, setFilterEmpresaId] = useState<number | null>(null);
  const [allEmpresas, setAllEmpresas] = useState<Empresa[]>([]);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const t = await getToken();
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(pagina * PAGE_SIZE),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterEmpresaId !== null) params.set('empresa_id', String(filterEmpresaId));

      const rSedes = await fetch(`${API}/api/admin/sedes?${params}`, { headers: { Authorization: `Bearer ${t}` } });
      if (rSedes.ok) {
        const data = await rSedes.json() as PaginatedResponse<Sede>;
        setItems(data.items);
        setTotal(data.total);
      }
      const rEmp = await fetch(`${API}/api/admin/empresas`, { headers: { Authorization: `Bearer ${t}` } });
      if (rEmp.ok) {
        const empData = await rEmp.json() as Empresa[];
        setAllEmpresas(empData);
        setEmpresas(empData);
      }
    } finally {
      setCargando(false);
    }
  }, [getToken, pagina, debouncedSearch, filterEmpresaId]);

  useEffect(() => { cargar(); }, [cargar]);

  const resetForm = useCallback(() => {
    setForm({ empresa_id: '', nombre: '', direccion: '', ciudad: '' });
    setEditId(null);
    setShowForm(false);
  }, []);

  const guardar = useCallback(async (e: React.FormEvent) => {
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

  const editar = useCallback((item: Sede) => {
    setEditId(item.id);
    setForm({ empresa_id: String(item.empresa_id), nombre: item.nombre, direccion: item.direccion || '', ciudad: item.ciudad || '' });
    setShowForm(true);
  }, []);

  const eliminar = useCallback(async (id: number, nombre: string) => {
    if (!window.confirm(`Eliminar "${nombre}"? Esta accion no se puede deshacer.`)) return;
    try {
      const t = await getToken();
      await fetch(`${API}/api/admin/sedes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      cargar();
    } catch {
      // ignore
    }
  }, [getToken, cargar]);

  const empresaNombre = useCallback((id: number) => {
    const e = empresas.find(x => x.id === id);
    return e ? e.nombre : '—';
  }, [empresas]);

  return {
    items, total, empresas, form, setForm, editId, saving, cargando, msg, setMsg, showForm, setShowForm,
    cargar, resetForm, guardar, editar, eliminar, empresaNombre, allEmpresas,
    pagina, setPagina, searchTerm, setSearchTerm, filterEmpresaId, setFilterEmpresaId, PAGE_SIZE,
  };
}