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
