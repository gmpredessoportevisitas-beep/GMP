import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Empresa, Sede } from '../types';

const API = import.meta.env.VITE_API_URL ?? '';
export const VERSION_POLITICA = '1.0';

export default function useTecnicoView() {
  const { getToken, perfil, logout } = useAuth();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [sedesLoading, setSedesLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [empresaId, setEmpresaId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [nombreAsesor, setNombreAsesor] = useState('');
  const [telefonoAsesor, setTelefonoAsesor] = useState('');
  const [hallazgos, setHallazgos] = useState('');
  const [usoMateriales, setUsoMateriales] = useState(false);
  const [materialesDetalle, setMaterialesDetalle] = useState('');
  const [cambioAntena, setCambioAntena] = useState(false);
  const [serialAntena, setSerialAntena] = useState('');
  const [motivoVisita, setMotivoVisita] = useState('soporte');
  const [motivoVisitaOtro, setMotivoVisitaOtro] = useState('');
  const [firmaSvg, setFirmaSvg] = useState('');

  const [loading, setLoading] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [guardado, setGuardado] = useState<{ id: number } | null>(null);

  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      const rE = await fetch(`${API}/api/catalogos/empresas`, { headers: { Authorization: `Bearer ${t}` } });
      if (rE.ok) setEmpresas(await rE.json() as Empresa[]);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!empresaId) { setSedes([]); setSedeId(''); return; }
    (async () => {
      setSedesLoading(true);
      try {
        const t = await getToken();
        const rS = await fetch(`${API}/api/catalogos/sedes?empresa_id=${empresaId}`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (rS.ok) setSedes(await rS.json() as Sede[]);
      } finally {
        setSedesLoading(false);
      }
    })();
  }, [empresaId, getToken]);

  const empresaNombre = useMemo(
    () => empresas.find(e => e.id === parseInt(empresaId))?.nombre || '',
    [empresas, empresaId]
  );

  const sedeNombre = useMemo(
    () => sedes.find(s => s.id === parseInt(sedeId))?.nombre || '',
    [sedes, sedeId]
  );

  const guardarReporte = useCallback(async () => {
    setLoading(true);

    if (!aceptoPrivacidad) {
      toast.error('Debe aceptar la Politica de Tratamiento de Datos Personales.');
      setLoading(false);
      return;
    }

    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          empresa_id: parseInt(empresaId),
          sede_id: parseInt(sedeId),
          nombre_asesor: nombreAsesor,
          telefono_asesor: telefonoAsesor,
          hallazgos,
          uso_materiales: usoMateriales,
          materiales_detalle: materialesDetalle,
          cambio_antena: cambioAntena,
          serial_antena: serialAntena,
          motivo_visita: motivoVisita,
          motivo_visita_otro: motivoVisitaOtro,
          firma_vector: firmaSvg,
          autorizacion_datos: true,
          version_politica: VERSION_POLITICA,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Error del servidor'); }
      const data = await res.json();
      setGuardado(data.reporte);
      toast.success('Reporte guardado exitosamente.');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getToken, empresaId, sedeId, nombreAsesor, telefonoAsesor, hallazgos, usoMateriales, materialesDetalle, cambioAntena, serialAntena, motivoVisita, motivoVisitaOtro, firmaSvg, aceptoPrivacidad]);

  const descargarPDF = useCallback(async (reporteId: number) => {
    setDescargando(true);
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes/${reporteId}/pdf`, { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `reporte_${reporteId}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al descargar PDF.');
    } finally {
      setDescargando(false);
    }
  }, [getToken]);

  const obtenerQrEncuesta = useCallback(async (reporteId: number) => {
    setQrLoading(true);
    try {
      const t = await getToken();
      const res = await fetch(`${API}/api/reportes/${reporteId}/qr-encuesta`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error('Error al obtener enlace de encuesta');
      const data = await res.json();
      setQrUrl(data.url);
      setQrModalOpen(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setQrLoading(false);
    }
  }, [getToken]);

  const resetForm = useCallback(() => {
    setEmpresaId(''); setSedeId(''); setNombreAsesor(''); setTelefonoAsesor('');
    setHallazgos(''); setUsoMateriales(false); setMaterialesDetalle('');
    setCambioAntena(false); setSerialAntena('');
    setMotivoVisita('soporte'); setMotivoVisitaOtro(''); setFirmaSvg('');
    setAceptoPrivacidad(false);
  }, []);

  return {
    empresas, sedes, sedesLoading, loaded,
    empresaId, setEmpresaId,
    sedeId, setSedeId,
    nombreAsesor, setNombreAsesor,
    telefonoAsesor, setTelefonoAsesor,
    hallazgos, setHallazgos,
    usoMateriales, setUsoMateriales,
    materialesDetalle, setMaterialesDetalle,
    cambioAntena, setCambioAntena,
    serialAntena, setSerialAntena,
    motivoVisita, setMotivoVisita,
    motivoVisitaOtro, setMotivoVisitaOtro,
    firmaSvg, setFirmaSvg,
    loading, descargando, guardado, setGuardado,
    empresaNombre, sedeNombre,
    guardarReporte, descargarPDF, resetForm, perfil, logout,
    aceptoPrivacidad, setAceptoPrivacidad,
    qrUrl, qrLoading, qrModalOpen, setQrModalOpen, obtenerQrEncuesta,
  };
}