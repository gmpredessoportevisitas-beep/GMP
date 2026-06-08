import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL ?? '';

export interface VisitasPorTecnico {
  tecnico_id: string;
  nombre: string;
  cantidad: number;
}

export interface PuntoVisitado {
  sede_id: number;
  sede_nombre: string;
  empresa_nombre: string;
  cantidad: number;
}

export interface PuntuacionTecnico {
  tecnico_id: string;
  nombre: string;
  promedio: number;
  total_encuestas: number;
}

export interface DashboardResumen {
  total_visitas: number;
  visitas_por_tecnico: VisitasPorTecnico[];
  puntos_mas_visitados: PuntoVisitado[];
}

export interface DashboardPuntuaciones {
  puntuaciones: PuntuacionTecnico[];
}

export default function useAdminDashboard() {
  const { authFetch } = useAuth();
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [puntuaciones, setPuntuaciones] = useState<DashboardPuntuaciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [empresaId, setEmpresaId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.set('fecha_inicio', fechaInicio);
      if (fechaFin) params.set('fecha_fin', fechaFin);
      if (empresaId) params.set('empresa_id', String(empresaId));

      const [resRes, punRes] = await Promise.all([
        authFetch(`${API}/api/admin/dashboard/resumen?${params}`),
        authFetch(`${API}/api/admin/dashboard/puntuaciones?${params}`),
      ]);

      if (resRes.ok) setResumen(await resRes.json() as DashboardResumen);
      if (punRes.ok) setPuntuaciones(await punRes.json() as DashboardPuntuaciones);
    } catch {
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [authFetch, fechaInicio, fechaFin, empresaId]);

  useEffect(() => { cargar(); }, [cargar]);

  const exportarExcel = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.set('fecha_inicio', fechaInicio);
      if (fechaFin) params.set('fecha_fin', fechaFin);

      const res = await authFetch(`${API}/api/admin/reportes/exportar-excel?${params}`);
      if (!res.ok) throw new Error('Error al exportar Excel');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reportes_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Excel exportado exitosamente');
    } catch (err) {
      toast.error('Error al exportar Excel: ' + (err as Error).message);
    } finally {
      setExporting(false);
    }
  }, [authFetch, fechaInicio, fechaFin]);

  return {
    resumen, puntuaciones, loading, exporting,
    fechaInicio, setFechaInicio, fechaFin, setFechaFin,
    empresaId, setEmpresaId,
    cargar, exportarExcel,
  };
}
