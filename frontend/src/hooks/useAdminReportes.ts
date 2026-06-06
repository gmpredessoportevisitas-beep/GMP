import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from './useDebounce';
import { ReporteVista, Perfil, Empresa, EncuestaData, PaginatedResponse } from '../types';

const API = import.meta.env.VITE_API_URL ?? '';
const LIMIT = 20;

export default function useAdminReportes() {
  const { getToken } = useAuth();
  const [reportes, setReportes] = useState<ReporteVista[]>([]);
  const [totalReportes, setTotalReportes] = useState(0);
  const [tecnicos, setTecnicos] = useState<Perfil[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(0);
  const [descargando, setDescargando] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ tipo: string; texto: string }>({ tipo: '', texto: '' });
  const [encuestaData, setEncuestaData] = useState<EncuestaData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresaId, setFilterEmpresaId] = useState<number | null>(null);
  const [filterTecnicoId, setFilterTecnicoId] = useState<string | null>(null);
  const [filterMotivo, setFilterMotivo] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingEncuesta, setLoadingEncuesta] = useState<number | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const cargar = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const t = await getToken();
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(pagina * LIMIT) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterEmpresaId !== null) params.set('empresa_id', String(filterEmpresaId));
      if (filterTecnicoId !== null) params.set('tecnico_id', filterTecnicoId);
      if (filterMotivo !== null) params.set('motivo_visita', filterMotivo);
      if (fechaInicio) params.set('fecha_inicio', fechaInicio);
      if (fechaFin) params.set('fecha_fin', fechaFin);

      const res = await fetch(`${API}/api/reportes?${params}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json() as PaginatedResponse<ReporteVista>;
      setReportes(data.items);
      setTotalReportes(data.total);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagina, debouncedSearch, filterEmpresaId, filterTecnicoId, filterMotivo, fechaInicio, fechaFin]);

  useEffect(() => { cargar(); }, [cargar]);

  const cargarFiltros = useCallback(async () => {
    setLoadingFilters(true);
    try {
      const t = await getToken();
      const [rTec, rEmp] = await Promise.all([
        fetch(`${API}/api/admin/usuarios?solo_tecnicos=true`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/api/admin/empresas`, { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      if (rTec.ok) setTecnicos(await rTec.json() as Perfil[]);
      if (rEmp.ok) setEmpresas(await rEmp.json() as Empresa[]);
    } catch {
      setMsg({ tipo: 'error', texto: 'Error al cargar filtros' });
    } finally {
      setLoadingFilters(false);
    }
  }, [getToken]);

  useEffect(() => { cargarFiltros(); }, [cargarFiltros]);

  const descargarPDF = useCallback(async (id: number) => {
    setDescargando(id);
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes/${id}/pdf`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error('Error al generar PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar PDF: ' + (err as Error).message);
    } finally {
      setDescargando(null);
    }
  }, [getToken]);

  const previsualizar = useCallback(async (id: number) => {
    setPreviewLoadingId(id);
    setMsg({ tipo: '', texto: '' });
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes/${id}/preview-pdf`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error('Error al generar previsualización');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      setMsg({ tipo: 'error', texto: (err as Error).message });
    } finally {
      setPreviewLoadingId(null);
    }
  }, [getToken]);

  const cerrarPreview = useCallback(() => {
    if (previewUrl) { window.URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  }, [previewUrl]);

  const verEncuesta = useCallback(async (reporteId: number) => {
    setEncuestaData(null);
    setLoadingEncuesta(reporteId);
    setMsg({ tipo: '', texto: '' });
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes/${reporteId}/encuesta`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        if (res.status === 404) { setMsg({ tipo: 'info', texto: 'Este reporte no tiene encuesta registrada.' }); }
        else throw new Error('Error al consultar encuesta');
      } else {
        setEncuestaData(await res.json() as EncuestaData);
      }
    } catch (err) {
      setMsg({ tipo: 'error', texto: (err as Error).message });
    } finally {
      setLoadingEncuesta(null);
    }
  }, [getToken]);

  const cerrarEncuesta = useCallback(() => { setEncuestaData(null); setMsg({ tipo: '', texto: '' }); }, []);

  const exportarCSV = useCallback(() => {
    if (!reportes.length) return;
    const csv = (t: unknown) => `"${String(t || '').replace(/"/g, '""')}"`;
    const formatFecha = (iso: string) => {
      if (!iso) return '';
      try { return new Date(iso).toLocaleString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }); }
      catch { return iso; }
    };
    const h = ['ID', 'Fecha', 'Empresa', 'Sede', 'Tecnico', 'Asesor', 'Telefono Asesor', 'Hallazgos', 'Uso Materiales', 'Materiales Detalle', 'Cambio Antena', 'Serial Antena', 'Motivo Visita', 'Motivo Visita Otro'];
    const rows = reportes.map(r => [
      r.id, formatFecha(r.fecha_hora),
      csv(r.empresa_nombre),
      csv(r.sede_nombre),
      csv(r.tecnico_nombre),
      csv(r.nombre_asesor),
      csv(r.telefono_asesor),
      csv(r.hallazgos),
      r.uso_materiales ? 'Si' : 'No',
      csv(r.materiales_detalle),
      r.cambio_antena ? 'Si' : 'No',
      csv(r.serial_antena),
      r.motivo_visita === 'otro' && r.motivo_visita_otro ? `Otro: ${r.motivo_visita_otro}` : csv(r.motivo_visita),
      csv(r.motivo_visita_otro),
    ]);
    const blob = new Blob(['\uFEFF' + [h.join(','), ...rows.map(r => r.join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = `reportes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }, [reportes]);

  const setMsgAction = useCallback((m: { tipo: string; texto: string }) => setMsg(m), []);

  return {
    reportes, totalReportes, loading, error, pagina, setPagina, loadingFilters,
    descargando, previewUrl, previewLoadingId, loadingEncuesta,
    msg, encuestaData,
    cargar, descargarPDF, previsualizar, cerrarPreview,
    verEncuesta, cerrarEncuesta, exportarCSV, setMsg: setMsgAction,
    LIMIT, tecnicos, empresas,
    searchTerm, setSearchTerm,
    filterEmpresaId, setFilterEmpresaId,
    filterTecnicoId, setFilterTecnicoId,
    filterMotivo, setFilterMotivo,
    fechaInicio, setFechaInicio,
    fechaFin, setFechaFin,
  };
}