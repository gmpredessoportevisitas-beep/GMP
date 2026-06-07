-- ============================================================
-- MIGRACION: Agregar nuevas columnas y tablas a reportes
-- Ejecutar en SQL Editor de Supabase Dashboard
-- ============================================================

-- 1. Nuevas columnas en reportes
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS materiales_detalle   TEXT        NOT NULL DEFAULT '';
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS motivo_visita_otro   VARCHAR(255) NOT NULL DEFAULT '';

-- 2. Tablas de encuesta (si no existen)
CREATE TABLE IF NOT EXISTS encuesta_preguntas (
    id          BIGSERIAL       PRIMARY KEY,
    texto       VARCHAR(500)    NOT NULL,
    activa      BOOLEAN         NOT NULL DEFAULT true,
    orden       SMALLINT        NOT NULL DEFAULT 0,
    creado_en   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

INSERT INTO encuesta_preguntas (texto, orden) VALUES
    ('¿Cómo califica la atención del técnico?', 1),
    ('¿El servicio se realizó en el tiempo acordado?', 2),
    ('¿Recomendaría nuestros servicios?', 3)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS encuestas_satisfaccion (
    id              BIGSERIAL       PRIMARY KEY,
    reporte_id      BIGINT          NOT NULL UNIQUE REFERENCES reportes(id) ON DELETE CASCADE,
    observaciones   TEXT            NOT NULL DEFAULT '',
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_encuestas_reporte ON encuestas_satisfaccion (reporte_id);

CREATE TABLE IF NOT EXISTS encuesta_respuestas (
    id              BIGSERIAL       PRIMARY KEY,
    encuesta_id     BIGINT          NOT NULL REFERENCES encuestas_satisfaccion(id) ON DELETE CASCADE,
    pregunta_id     BIGINT          NOT NULL REFERENCES encuesta_preguntas(id),
    valor           SMALLINT        NOT NULL CHECK (valor BETWEEN 1 AND 5),
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (encuesta_id, pregunta_id)
);
CREATE INDEX IF NOT EXISTS idx_respuestas_encuesta ON encuesta_respuestas (encuesta_id);

-- 3. Trigger para sincronizar perfiles con auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, email, nombre_completo, rol)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'nombre_completo', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'rol', 'tecnico')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Campos de autorizacion de datos personales (Ley 1581 de 2012)
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS autorizacion_datos   BOOLEAN     NOT NULL DEFAULT false;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS fecha_autorizacion   TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS version_politica     VARCHAR(50) DEFAULT '';

-- 5. Campo de antena, serial y token de encuesta externa
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS cambio_antena    BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS serial_antena    VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS token_encuesta   VARCHAR(36)  NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_reportes_token_encuesta ON reportes (token_encuesta) WHERE token_encuesta != '';

-- 6. Recrear vista de búsqueda incluyendo todos los campos nuevos
DROP VIEW IF EXISTS vista_reportes_busqueda;
CREATE VIEW vista_reportes_busqueda AS
SELECT r.id,
    r.fecha_hora,
    r.empresa_id,
    r.sede_id,
    r.tecnico_id,
    r.nombre_asesor,
    r.telefono_asesor,
    r.hallazgos,
    r.uso_materiales,
    r.materiales_detalle,
    r.motivo_visita,
    r.motivo_visita_otro,
    r.firma_vector,
    r.creado_en,
    r.autorizacion_datos,
    r.fecha_autorizacion,
    r.version_politica,
    r.cambio_antena,
    r.serial_antena,
    r.token_encuesta,
    p.nombre_completo AS tecnico_nombre,
    e.nombre AS empresa_nombre,
    s.nombre AS sede_nombre,
    CONCAT_WS(' ',
        r.nombre_asesor,
        r.hallazgos,
        r.materiales_detalle,
        r.serial_antena,
        p.nombre_completo,
        e.nombre,
        s.nombre
    ) AS texto_busqueda
FROM reportes r
    LEFT JOIN perfiles p ON r.tecnico_id = p.id
    LEFT JOIN empresas e ON r.empresa_id = e.id
    LEFT JOIN sedes s ON r.sede_id = s.id;

-- ============================================================
-- MIGRACIÓN: Habilitar RLS y crear políticas restrictivas
-- Opción A: Máxima seguridad - todo acceso vía backend (service_role)
-- ============================================================

-- 1. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encuesta_preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encuestas_satisfaccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encuesta_respuestas ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS POR TABLA

-- empresas: sin acceso directo
CREATE POLICY "Sin acceso directo a empresas"
ON public.empresas FOR ALL
USING (false) WITH CHECK (false);

-- sedes: sin acceso directo
CREATE POLICY "Sin acceso directo a sedes"
ON public.sedes FOR ALL
USING (false) WITH CHECK (false);

-- perfiles: solo ver tu propio perfil
CREATE POLICY "Ver propio perfil"
ON public.perfiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Sin escritura directa en perfiles"
ON public.perfiles FOR ALL
USING (false) WITH CHECK (false);

-- reportes: técnicos ven los propios, admins ven todos
CREATE POLICY "Ver reportes propios o todos si admin"
ON public.reportes FOR SELECT
USING (
    tecnico_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.perfiles
        WHERE id = auth.uid() AND rol = 'admin'
    )
);

CREATE POLICY "Sin escritura directa en reportes"
ON public.reportes FOR ALL
USING (false) WITH CHECK (false);

-- encuesta_preguntas: sin acceso directo (todo vía backend)
CREATE POLICY "Sin acceso directo a preguntas"
ON public.encuesta_preguntas FOR ALL
USING (false) WITH CHECK (false);

-- encuestas_satisfaccion: sin acceso directo
CREATE POLICY "Sin acceso directo a encuestas"
ON public.encuestas_satisfaccion FOR ALL
USING (false) WITH CHECK (false);

-- encuesta_respuestas: sin acceso directo
CREATE POLICY "Sin acceso directo a respuestas"
ON public.encuesta_respuestas FOR ALL
USING (false) WITH CHECK (false);

-- 3. SECURIZAR FUNCIÓN TRIGGER
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, email, nombre_completo, rol)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'nombre_completo', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'rol', 'tecnico')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. CAMBIAR VISTA A SECURITY INVOKER
CREATE OR REPLACE VIEW public.vista_reportes_busqueda
SECURITY INVOKER AS
SELECT r.id,
    r.fecha_hora,
    r.empresa_id,
    r.sede_id,
    r.tecnico_id,
    r.nombre_asesor,
    r.telefono_asesor,
    r.hallazgos,
    r.uso_materiales,
    r.materiales_detalle,
    r.motivo_visita,
    r.motivo_visita_otro,
    r.firma_vector,
    r.creado_en,
    r.autorizacion_datos,
    r.fecha_autorizacion,
    r.version_politica,
    r.cambio_antena,
    r.serial_antena,
    r.token_encuesta,
    p.nombre_completo AS tecnico_nombre,
    e.nombre AS empresa_nombre,
    s.nombre AS sede_nombre,
    CONCAT_WS(' ',
        r.nombre_asesor,
        r.hallazgos,
        r.materiales_detalle,
        r.serial_antena,
        p.nombre_completo,
        e.nombre,
        s.nombre
    ) AS texto_busqueda
FROM reportes r
    LEFT JOIN perfiles p ON r.tecnico_id = p.id
    LEFT JOIN empresas e ON r.empresa_id = e.id
    LEFT JOIN sedes s ON r.sede_id = e.id;