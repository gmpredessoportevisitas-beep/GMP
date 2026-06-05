export interface Perfil {
  id: string;
  email: string;
  nombre_completo: string;
  rol: 'admin' | 'tecnico';
  activo: boolean;
  creado_en: string;
  username: string;
}

export interface Empresa {
  id: number;
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
  creado_en: string;
}

export interface Sede {
  id: number;
  empresa_id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  creado_en: string;
  empresas?: { nombre: string };
}

export interface ReporteVista {
  id: number;
  fecha_hora: string;
  empresa_id: number;
  sede_id: number;
  tecnico_id: string;
  nombre_asesor: string;
  telefono_asesor: string;
  hallazgos: string;
  uso_materiales: boolean;
  materiales_detalle?: string;
  motivo_visita: string;
  motivo_visita_otro?: string;
  firma_vector: string;
  creado_en: string;
  empresa_nombre: string;
  sede_nombre: string;
  tecnico_nombre: string; 
  autorizacion_datos: boolean;
  fecha_autorizacion: string | null;
  version_politica: string;
}

export interface EncuestaPregunta {
  id: number;
  texto: string;
  activa: boolean;
  orden: number;
  creado_en: string;
}

export interface EncuestaSatisfaccion {
  id: number;
  reporte_id: number;
  observaciones: string;
  creado_en: string;
}

export interface EncuestaRespuesta {
  id: number;
  encuesta_id: number;
  pregunta_id: number;
  valor: number;
  creado_en: string;
  encuesta_preguntas?: { texto: string };
}

export interface EmpresaForm {
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface SedeForm {
  empresa_id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
}

export interface UsuarioForm {
  username: string;
  password: string;
  nombre_completo: string;
  rol: 'admin' | 'tecnico';
}

export interface EncuestaRespuestaItem {
  pregunta_id: number;
  valor: number;
}

export interface EncuestaData {
  encuesta: EncuestaSatisfaccion;
  respuestas: (EncuestaRespuesta & { encuesta_preguntas?: { texto: string } })[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}