-- ============================================================
-- ESQUEMA RELACIONAL GMP v2 - Gestión de Mantenimiento Preventivo
-- Base de datos: PostgreSQL (Supabase)
-- Incluye: empresas, sedes, perfiles (roles), reportes con FK
-- Ejecutar en SQL Editor de Supabase
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

-- 4. REPORTES (relacionados con empresa, sede y técnico)
CREATE TABLE IF NOT EXISTS reportes (
    id                    BIGSERIAL       PRIMARY KEY,
    fecha_hora            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    empresa_id            BIGINT          NOT NULL REFERENCES empresas(id),
    sede_id               BIGINT          NOT NULL REFERENCES sedes(id),
    tecnico_id            UUID            NOT NULL REFERENCES perfiles(id),
    observaciones         TEXT            NOT NULL DEFAULT '',
    firma_vector          TEXT            NOT NULL DEFAULT '',
    creado_en             TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha    ON reportes (fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_empresa  ON reportes (empresa_id);
CREATE INDEX IF NOT EXISTS idx_reportes_tecnico  ON reportes (tecnico_id);

-- ============================================================
-- COMENTARIOS
-- ============================================================
COMMENT ON TABLE  empresas  IS 'Empresas o clientes que contratan los servicios de mantenimiento.';
COMMENT ON TABLE  sedes     IS 'Ubicaciones o sucursales de cada empresa donde se ejecuta el mantenimiento.';
COMMENT ON TABLE  perfiles  IS 'Usuarios del sistema. El id es el UUID de Supabase Auth. Rol define permisos.';
COMMENT ON TABLE  reportes  IS 'Reportes de mantenimiento con referencias a empresa, sede y técnico. Firma en formato SVG vectorial.';
COMMENT ON COLUMN perfiles.id   IS 'UUID que debe coincidir con auth.users.id de Supabase.';
COMMENT ON COLUMN perfiles.rol  IS 'Rol del usuario: admin (gestión total) o tecnico (solo crear reportes y ver propios).';
COMMENT ON COLUMN reportes.firma_vector IS 'Firma del cliente en SVG vectorial (paths M/L/Q). Zero-Storage: se renderiza bajo demanda en el PDF.';
