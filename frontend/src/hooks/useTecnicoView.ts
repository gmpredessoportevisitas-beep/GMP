import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Empresa, Sede, EncuestaPregunta } from '../types';

const API = import.meta.env.VITE_API_URL ?? '';

export default function useTecnicoView() {
  const { getToken, perfil, logout } = useAuth();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [empresaId, setEmpresaId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [nombreAsesor, setNombreAsesor] = useState('');
  const [telefonoAsesor, setTelefonoAsesor] = useState('');
  const [hallazgos, setHallazgos] = useState('');
  const [usoMateriales, setUsoMateriales] = useState(false);
  const [materialesDetalle, setMaterialesDetalle] = useState('');
  const [motivoVisita, setMotivoVisita] = useState('soporte');
  const [motivoVisitaOtro, setMotivoVisitaOtro] = useState('');
  const [firmaSvg, setFirmaSvg] = useState('');

  const [preguntas, setPreguntas] = useState<EncuestaPregunta[]>([]);
  const [respuestasEncuesta, setRespuestasEncuesta] = useState<Record<number, number>>({});
  const [encuestaObservaciones, setEncuestaObservaciones] = useState('');

  const [loading, setLoading] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [guardado, setGuardado] = useState<{ id: number } | null>(null);
  const [msg, setMsg] = useState<{ tipo: string; texto: string }>({ tipo: '', texto: '' });

  useEffect(() => {
    (async () => {
      const t = await getToken();
      const [rE, rS, rP] = await Promise.all([
        fetch(`${API}/api/catalogos/empresas`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/api/catalogos/sedes`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/api/encuesta-preguntas`),
      ]);
      if (rE.ok) setEmpresas(await rE.json() as Empresa[]);
      if (rS.ok) setSedes(await rS.json() as Sede[]);
      if (rP.ok) {
        const data = await rP.json() as EncuestaPregunta[];
        setPreguntas(data);
        const inicial: Record<number, number> = {};
        data.forEach(p => { inicial[p.id] = 0; });
        setRespuestasEncuesta(inicial);
      }
      setLoaded(true);
    })();
  }, []);

  const sedesFiltradas = empresaId
    ? sedes.filter(s => s.empresa_id === parseInt(empresaId))
    : [];

  const empresaNombre = empresas.find(e => e.id === parseInt(empresaId))?.nombre || '';
  const sedeNombre = sedes.find(s => s.id === parseInt(sedeId))?.nombre || '';

  const guardarReporte = useCallback(async () => {
    setLoading(true);
    setMsg({ tipo: '', texto: '' });
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
          motivo_visita: motivoVisita,
          motivo_visita_otro: motivoVisitaOtro,
          firma_vector: firmaSvg,
          encuesta_observaciones: encuestaObservaciones,
          encuesta_respuestas: Object.entries(respuestasEncuesta)
            .filter(([_, v]) => v > 0)
            .map(([pid, val]) => ({ pregunta_id: parseInt(pid), valor: val })),
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Error del servidor'); }
      const data = await res.json();
      setGuardado(data.reporte);
      setMsg({ tipo: 'exito', texto: 'Reporte guardado exitosamente.' });
    } catch (err) {
      setMsg({ tipo: 'error', texto: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [getToken, empresaId, sedeId, nombreAsesor, telefonoAsesor, hallazgos, usoMateriales, materialesDetalle, motivoVisita, motivoVisitaOtro, firmaSvg, encuestaObservaciones, respuestasEncuesta]);

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
      setMsg({ tipo: 'error', texto: 'Error al descargar PDF.' });
    } finally {
      setDescargando(false);
    }
  }, [getToken]);

  const resetForm = useCallback(() => {
    setEmpresaId(''); setSedeId(''); setNombreAsesor(''); setTelefonoAsesor('');
    setHallazgos(''); setUsoMateriales(false); setMaterialesDetalle('');
    setMotivoVisita('soporte'); setMotivoVisitaOtro(''); setFirmaSvg('');
    setEncuestaObservaciones('');
    setRespuestasEncuesta(Object.fromEntries(preguntas.map(p => [p.id, 0])));
    setMsg({ tipo: '', texto: '' });
  }, [preguntas]);

  return {
    empresas, sedes, loaded,
    empresaId, setEmpresaId,
    sedeId, setSedeId,
    nombreAsesor, setNombreAsesor,
    telefonoAsesor, setTelefonoAsesor,
    hallazgos, setHallazgos,
    usoMateriales, setUsoMateriales,
    materialesDetalle, setMaterialesDetalle,
    motivoVisita, setMotivoVisita,
    motivoVisitaOtro, setMotivoVisitaOtro,
    firmaSvg, setFirmaSvg,
    preguntas, respuestasEncuesta, setRespuestasEncuesta,
    encuestaObservaciones, setEncuestaObservaciones,
    loading, descargando, guardado, setGuardado,
    msg, setMsg,
    sedesFiltradas, empresaNombre, sedeNombre,
    guardarReporte, descargarPDF, resetForm, perfil, logout,
  };
}
