import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL ?? '';
const LIMIT = 20;

export default function useAdminReportes() {
  const { getToken } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(0);
  const [descargando, setDescargando] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [msg, setMsg] = useState({ tipo: '', texto: '' });
  const [encuestaData, setEncuestaData] = useState(null);
  const [encuestaLoading, setEncuestaLoading] = useState(false);

  const cargar = useCallback(async (offset = 0) => {
    setLoading(true); setError('');
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes?limit=${LIMIT}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setReportes(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { cargar(pagina * LIMIT); }, [pagina, cargar]);

  const descargarPDF = useCallback(async (id) => {
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
      alert('Error al descargar PDF: ' + err.message);
    } finally {
      setDescargando(null);
    }
  }, [getToken]);

  const previsualizar = useCallback(async (id) => {
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
      setMsg({ tipo: 'error', texto: err.message });
    } finally {
      setPreviewLoadingId(null);
    }
  }, [getToken]);

  const cerrarPreview = useCallback(() => {
    if (previewUrl) { window.URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  }, [previewUrl]);

  const verEncuesta = useCallback(async (reporteId) => {
    setEncuestaLoading(true);
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
        setEncuestaData(await res.json());
      }
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message });
    } finally {
      setEncuestaLoading(false);
    }
  }, [getToken]);

  const cerrarEncuesta = useCallback(() => { setEncuestaData(null); setMsg({ tipo: '', texto: '' }); }, []);

  const exportarCSV = useCallback(() => {
    if (!reportes.length) return;
    const csv = (t) => `"${String(t || '').replace(/"/g, '""')}"`;
    const formatFecha = (iso) => {
      if (!iso) return '';
      try { return new Date(iso).toLocaleString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }); }
      catch { return iso; }
    };
    const h = ['ID', 'Fecha', 'Empresa', 'Sede', 'Tecnico', 'Asesor', 'Telefono Asesor', 'Hallazgos', 'Uso Materiales', 'Materiales Detalle', 'Motivo Visita', 'Motivo Visita Otro'];
    const rows = reportes.map(r => [
      r.id, formatFecha(r.fecha_hora),
      csv(r.empresas?.nombre),
      csv(r.sedes?.nombre),
      csv(r.perfiles?.nombre_completo),
      csv(r.nombre_asesor),
      csv(r.telefono_asesor),
      csv(r.hallazgos),
      r.uso_materiales ? 'Si' : 'No',
      csv(r.materiales_detalle),
      r.motivo_visita === 'otro' && r.motivo_visita_otro ? `Otro: ${r.motivo_visita_otro}` : csv(r.motivo_visita),
      csv(r.motivo_visita_otro),
    ]);
    const blob = new Blob(['\uFEFF' + [h.join(','), ...rows.map(r => r.join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = `reportes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }, [reportes]);

  const setMsgAction = useCallback((m) => setMsg(m), []);

  return {
    reportes, loading, error, pagina, setPagina,
    descargando, previewUrl, previewLoadingId,
    msg, encuestaData, encuestaLoading,
    cargar, descargarPDF, previsualizar, cerrarPreview,
    verEncuesta, cerrarEncuesta, exportarCSV, setMsg: setMsgAction,
    LIMIT,
  };
}
