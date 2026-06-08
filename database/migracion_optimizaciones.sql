-- ============================================================
-- MIGRACION: Optimizaciones de indexes y RPCs
-- Ejecutar en SQL Editor de Supabase Dashboard
-- ============================================================

-- 1. Agregar indices faltantes
CREATE INDEX IF NOT EXISTS idx_reportes_sede ON reportes (sede_id);
CREATE INDEX IF NOT EXISTS idx_encuestas_satisfaccion_creado ON encuestas_satisfaccion (creado_en DESC);

-- 2. Eliminar indices redundantes
DROP INDEX IF EXISTS idx_encuestas_reporte;
DROP INDEX IF EXISTS idx_perfiles_username;

-- 3. RPC: dashboard_resumen(fecha_inicio, fecha_fin, empresa_id)
--    Retorna total visitas, visitas por tecnico, top 20 puntos mas visitados
DROP FUNCTION IF EXISTS public.dashboard_resumen(timestamptz, timestamptz);
CREATE OR REPLACE FUNCTION public.dashboard_resumen(
    p_fecha_inicio TIMESTAMPTZ DEFAULT NULL,
    p_fecha_fin TIMESTAMPTZ DEFAULT NULL,
    p_empresa_id BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_total BIGINT;
    v_tecnicos JSONB;
    v_sedes JSONB;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM reportes r
    WHERE (p_fecha_inicio IS NULL OR r.fecha_hora >= p_fecha_inicio)
      AND (p_fecha_fin IS NULL OR r.fecha_hora <= p_fecha_fin)
      AND (p_empresa_id IS NULL OR r.empresa_id = p_empresa_id);

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_tecnicos
    FROM (
        SELECT r.tecnico_id AS tecnico_id,
               p.nombre_completo AS nombre,
               COUNT(*) AS cantidad
        FROM reportes r
        LEFT JOIN perfiles p ON r.tecnico_id = p.id
        WHERE (p_fecha_inicio IS NULL OR r.fecha_hora >= p_fecha_inicio)
          AND (p_fecha_fin IS NULL OR r.fecha_hora <= p_fecha_fin)
          AND (p_empresa_id IS NULL OR r.empresa_id = p_empresa_id)
        GROUP BY r.tecnico_id, p.nombre_completo
        ORDER BY cantidad DESC
    ) t;

    SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]'::jsonb) INTO v_sedes
    FROM (
        SELECT r.sede_id,
               s.nombre AS sede_nombre,
               e.nombre AS empresa_nombre,
               COUNT(*) AS cantidad
        FROM reportes r
        LEFT JOIN sedes s ON r.sede_id = s.id
        LEFT JOIN empresas e ON r.empresa_id = e.id
        WHERE (p_fecha_inicio IS NULL OR r.fecha_hora >= p_fecha_inicio)
          AND (p_fecha_fin IS NULL OR r.fecha_hora <= p_fecha_fin)
          AND (p_empresa_id IS NULL OR r.empresa_id = p_empresa_id)
        GROUP BY r.sede_id, s.nombre, e.nombre
        ORDER BY cantidad DESC
        LIMIT 20
    ) s;

    RETURN jsonb_build_object(
        'total_visitas', v_total,
        'visitas_por_tecnico', v_tecnicos,
        'puntos_mas_visitados', v_sedes
    );
END;
$$;

-- 4. RPC: dashboard_puntuaciones(fecha_inicio, fecha_fin)
--    Retorna promedios de puntuacion por tecnico
CREATE OR REPLACE FUNCTION public.dashboard_puntuaciones(
    p_fecha_inicio TIMESTAMPTZ DEFAULT NULL,
    p_fecha_fin TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object('puntuaciones', COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)) INTO v_result
    FROM (
        SELECT r.tecnico_id,
               p.nombre_completo AS nombre,
               ROUND(AVG(er.valor)::numeric, 2) AS promedio,
               COUNT(*) AS total_encuestas
        FROM encuesta_respuestas er
        JOIN encuestas_satisfaccion es ON er.encuesta_id = es.id
        JOIN reportes r ON es.reporte_id = r.id
        LEFT JOIN perfiles p ON r.tecnico_id = p.id
        WHERE (p_fecha_inicio IS NULL OR es.creado_en >= p_fecha_inicio)
          AND (p_fecha_fin IS NULL OR es.creado_en <= p_fecha_fin)
        GROUP BY r.tecnico_id, p.nombre_completo
        ORDER BY promedio DESC
    ) t;

    RETURN v_result;
END;
$$;