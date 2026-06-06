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
