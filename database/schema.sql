-- ============================================================
-- ESQUEMA COMPLETO GMP v3 - Gestión de Mantenimiento Preventivo
-- Base de datos: PostgreSQL (Supabase)
-- Incluye: empresas, sedes, perfiles (con trigger auth),
--          reportes (actualizado), encuesta_preguntas,
--          encuestas_satisfaccion, encuesta_respuestas
-- Ejecutar en SQL Editor de Supabase (cuenta nueva)
-- ============================================================

-- 1. EMPRESAS (clientes corporativos)
CREATE TABLE IF NOT EXISTS empresas (
    id          BIGSERIAL       PRIMARY KEY,
    nombre      VARCHAR(255)    NOT NULL,
    nit         VARCHAR(50)     DEFAULT '',
    direccion   TEXT            DEFAULT '',
    telefono    VARCHAR(50)     DEFAULT '',
    email       VARCHAR(255)    DEFAULT '',
    creado_en   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_empresas_nombre ON empresas (nombre);

-- 2. SEDES (puntos de trabajo de cada empresa)
CREATE TABLE IF NOT EXISTS sedes (
    id          BIGSERIAL       PRIMARY KEY,
    empresa_id  BIGINT          NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre      VARCHAR(255)    NOT NULL,
    direccion   TEXT            DEFAULT '',
    ciudad      VARCHAR(100)    DEFAULT '',
    creado_en   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sedes_empresa ON sedes (empresa_id);

-- 3. PERFILES (usuarios con rol: admin | tecnico)
--    El id debe coincidir con auth.users.id de Supabase Auth
CREATE TABLE IF NOT EXISTS perfiles (
    id              UUID            PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    nombre_completo VARCHAR(255)    NOT NULL,
    rol             VARCHAR(20)     NOT NULL CHECK (rol IN ('admin', 'tecnico')),
    activo          BOOLEAN         NOT NULL DEFAULT true,
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles (rol);

-- TRIGGER: crea perfil automáticamente cuando un usuario se registra en auth.users
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

-- 4. REPORTES (actualizado con nombre_asesor, hallazgos, motivo_visita, etc.)
CREATE TABLE IF NOT EXISTS reportes (
    id              BIGSERIAL       PRIMARY KEY,
    fecha_hora      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    empresa_id      BIGINT          NOT NULL REFERENCES empresas(id),
    sede_id         BIGINT          NOT NULL REFERENCES sedes(id),
    tecnico_id      UUID            NOT NULL REFERENCES perfiles(id),
    nombre_asesor   VARCHAR(255)    NOT NULL DEFAULT '',
    telefono_asesor VARCHAR(50)     NOT NULL DEFAULT '',
    hallazgos       TEXT            NOT NULL DEFAULT '',
    uso_materiales  BOOLEAN         NOT NULL DEFAULT false,
    materiales_detalle TEXT          NOT NULL DEFAULT '',
    motivo_visita   VARCHAR(50)     NOT NULL DEFAULT 'soporte'
        CHECK (motivo_visita IN ('soporte', 'instalación', 'reubicación', 'desinstalación', 'otro')),
    motivo_visita_otro VARCHAR(255) NOT NULL DEFAULT '',
    firma_vector    TEXT            NOT NULL DEFAULT '',
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha    ON reportes (fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_empresa  ON reportes (empresa_id);
CREATE INDEX IF NOT EXISTS idx_reportes_tecnico  ON reportes (tecnico_id);

-- 5. ENCUESTA_PREGUNTAS (banco dinámico de preguntas)
CREATE TABLE IF NOT EXISTS encuesta_preguntas (
    id          BIGSERIAL       PRIMARY KEY,
    texto       VARCHAR(500)    NOT NULL,
    activa      BOOLEAN         NOT NULL DEFAULT true,
    orden       SMALLINT        NOT NULL DEFAULT 0,
    creado_en   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Preguntas por defecto
INSERT INTO encuesta_preguntas (texto, orden) VALUES
    ('¿Cómo califica la atención del técnico?', 1),
    ('¿El servicio se realizó en el tiempo acordado?', 2),
    ('¿Recomendaría nuestros servicios?', 3);

-- 6. ENCUESTAS_SATISFACCION (una por reporte)
CREATE TABLE IF NOT EXISTS encuestas_satisfaccion (
    id              BIGSERIAL       PRIMARY KEY,
    reporte_id      BIGINT          NOT NULL UNIQUE REFERENCES reportes(id) ON DELETE CASCADE,
    observaciones   TEXT            NOT NULL DEFAULT '',
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_encuestas_reporte ON encuestas_satisfaccion (reporte_id);

-- 7. ENCUESTA_RESPUESTAS (valor 1-5 por pregunta)
CREATE TABLE IF NOT EXISTS encuesta_respuestas (
    id              BIGSERIAL       PRIMARY KEY,
    encuesta_id     BIGINT          NOT NULL REFERENCES encuestas_satisfaccion(id) ON DELETE CASCADE,
    pregunta_id     BIGINT          NOT NULL REFERENCES encuesta_preguntas(id),
    valor           SMALLINT        NOT NULL CHECK (valor BETWEEN 1 AND 5),
    creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (encuesta_id, pregunta_id)
);
CREATE INDEX IF NOT EXISTS idx_respuestas_encuesta ON encuesta_respuestas (encuesta_id);

-- ============================================================
-- COMENTARIOS
-- ============================================================
COMMENT ON TABLE  empresas               IS 'Empresas o clientes que contratan los servicios de mantenimiento.';
COMMENT ON TABLE  sedes                  IS 'Ubicaciones o sucursales de cada empresa donde se ejecuta el mantenimiento.';
COMMENT ON TABLE  perfiles               IS 'Usuarios del sistema. El id es el UUID de Supabase Auth. Rol define permisos.';
COMMENT ON TABLE  reportes               IS 'Reportes de mantenimiento con datos del asesor, hallazgos, materiales y motivo de visita.';
COMMENT ON TABLE  encuesta_preguntas     IS 'Banco dinámico de preguntas para la encuesta de satisfacción.';
COMMENT ON TABLE  encuestas_satisfaccion IS 'Encuesta de satisfacción asociada 1:1 a un reporte.';
COMMENT ON TABLE  encuesta_respuestas    IS 'Respuestas numéricas (1-5) por cada pregunta de la encuesta.';
COMMENT ON COLUMN perfiles.id                  IS 'UUID que debe coincidir con auth.users.id de Supabase.';
COMMENT ON COLUMN perfiles.rol                 IS 'Rol del usuario: admin (gestión total) o tecnico (solo crear reportes y ver propios).';
COMMENT ON COLUMN reportes.firma_vector        IS 'Firma del cliente en SVG vectorial (paths M/L/Q). Zero-Storage: se renderiza bajo demanda en el PDF.';
COMMENT ON COLUMN reportes.motivo_visita       IS 'Motivo de la visita: soporte, instalación, reubicación, desinstalación u otro.';
COMMENT ON COLUMN reportes.hallazgos           IS 'Hallazgos encontrados durante la visita (anteriormente observaciones).';
COMMENT ON COLUMN encuesta_respuestas.valor    IS 'Valoración numérica del 1 al 5 (1 = Muy malo, 5 = Excelente).';
