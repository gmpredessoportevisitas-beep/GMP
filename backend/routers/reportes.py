import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from config import supabase, FRONTEND_URL
from schemas import ReporteCreate
from deps import get_usuario_actual
from utils import ahora_iso, generar_pdf_fpdf, fecha_local_a_utc

router = APIRouter(prefix="/api", tags=["reportes"])


@router.post("/reportes", status_code=201)
async def crear_reporte(data: ReporteCreate, usuario: dict = Depends(get_usuario_actual)):
    row = data.model_dump(exclude={"encuesta_respuestas", "encuesta_observaciones"})
    row["tecnico_id"] = usuario["id"]
    row["fecha_hora"] = ahora_iso()
    row["creado_en"] = ahora_iso()
    row["token_encuesta"] = str(uuid.uuid4())

    if data.autorizacion_datos:
        row["fecha_autorizacion"] = ahora_iso()

    sede = supabase.table("sedes").select("empresa_id").eq("id", data.sede_id).execute()
    if not sede.data or sede.data[0]["empresa_id"] != data.empresa_id:
        raise HTTPException(400, "La sede no pertenece a la empresa seleccionada.")

    result = supabase.table("reportes").insert(row).execute()
    reporte = result.data[0]

    if data.encuesta_respuestas:
        encuesta = (supabase.table("encuestas_satisfaccion")
                    .insert({
                        "reporte_id": reporte["id"],
                        "observaciones": data.encuesta_observaciones,
                        "creado_en": ahora_iso(),
                    })
                    .execute())
        encuesta_id = encuesta.data[0]["id"]

        respuestas = [
            {"encuesta_id": encuesta_id, "pregunta_id": r.pregunta_id, "valor": r.valor, "creado_en": ahora_iso()}
            for r in data.encuesta_respuestas
        ]
        if respuestas:
            supabase.table("encuesta_respuestas").insert(respuestas).execute()

    return {"mensaje": "Reporte creado", "reporte": reporte}


@router.get("/reportes")
async def listar_reportes(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    empresa_id: Optional[int] = None,
    sede_id: Optional[int] = None,
    tecnico_id: Optional[str] = None,
    motivo_visita: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: dict = Depends(get_usuario_actual),
):
    q = (supabase.from_("vista_reportes_busqueda")
        .select("id, fecha_hora, empresa_id, sede_id, tecnico_id, nombre_asesor, telefono_asesor, hallazgos, uso_materiales, materiales_detalle, motivo_visita, motivo_visita_otro, creado_en, autorizacion_datos, fecha_autorizacion, version_politica, cambio_antena, serial_antena, token_encuesta, tecnico_nombre, empresa_nombre, sede_nombre, texto_busqueda", count="exact")
        .order("fecha_hora", desc=True))
        
    if usuario["rol"] != "admin":
        q = q.eq("tecnico_id", usuario["id"])
    if search and search.strip():
        q = q.ilike("texto_busqueda", f"%{search}%")
    if empresa_id:
        q = q.eq("empresa_id", empresa_id)
    if sede_id:
        q = q.eq("sede_id", sede_id)
    if tecnico_id:
        q = q.eq("tecnico_id", tecnico_id)
    if motivo_visita:
        q = q.eq("motivo_visita", motivo_visita)
    if fecha_inicio:
        q = q.gte("fecha_hora", fecha_local_a_utc(fecha_inicio, inicio=True))
    if fecha_fin:
        q = q.lte("fecha_hora", fecha_local_a_utc(fecha_fin, inicio=False))

    result = q.range(offset, offset + limit - 1).execute()
    return {"items": result.data, "total": result.count}


@router.get("/reportes/{reporte_id}/pdf")
async def generar_pdf(reporte_id: int, usuario: dict = Depends(get_usuario_actual)):
    result = (supabase.table("reportes")
              .select("id, fecha_hora, empresa_id, sede_id, tecnico_id, nombre_asesor, telefono_asesor, hallazgos, uso_materiales, materiales_detalle, motivo_visita, motivo_visita_otro, firma_vector, cambio_antena, serial_antena, empresas(nombre), sedes(nombre, direccion), perfiles!reportes_tecnico_id_fkey(nombre_completo, email)")
              .eq("id", reporte_id)
              .execute())
    if not result.data:
        raise HTTPException(404, "Reporte no encontrado")
    r = result.data[0]

    if usuario["rol"] != "admin" and r.get("tecnico_id") != usuario["id"]:
        raise HTTPException(403, "No tienes permiso para ver este reporte.")

    empresa_nombre = r.get("empresas", {}).get("nombre", "-") if isinstance(r.get("empresas"), dict) else "-"
    sede_data = r.get("sedes", {}) if isinstance(r.get("sedes"), dict) else {}
    sede_nombre = sede_data.get("nombre", "-")
    sede_direccion = sede_data.get("direccion", "")
    perfil = r.get("perfiles", {}) if isinstance(r.get("perfiles"), dict) else {}
    tecnico_nombre = perfil.get("nombre_completo", "-")
    tecnico_email = perfil.get("email", "-")

    buf = generar_pdf_fpdf(r, empresa_nombre, sede_nombre, sede_direccion, tecnico_nombre, tecnico_email)

    filename = f"reporte_{reporte_id}.pdf"
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/reportes/{reporte_id}/preview-pdf")
async def previsualizar_pdf(reporte_id: int, usuario: dict = Depends(get_usuario_actual)):
    result = (supabase.table("reportes")
              .select("id, fecha_hora, empresa_id, sede_id, tecnico_id, nombre_asesor, telefono_asesor, hallazgos, uso_materiales, materiales_detalle, motivo_visita, motivo_visita_otro, firma_vector, cambio_antena, serial_antena, empresas(nombre), sedes(nombre, direccion), perfiles!reportes_tecnico_id_fkey(nombre_completo, email)")
              .eq("id", reporte_id)
              .execute())
    if not result.data:
        raise HTTPException(404, "Reporte no encontrado")
    r = result.data[0]

    if usuario["rol"] != "admin" and r.get("tecnico_id") != usuario["id"]:
        raise HTTPException(403, "No tienes permiso para ver este reporte.")

    empresa_nombre = r.get("empresas", {}).get("nombre", "-") if isinstance(r.get("empresas"), dict) else "-"
    sede_data = r.get("sedes", {}) if isinstance(r.get("sedes"), dict) else {}
    sede_nombre = sede_data.get("nombre", "-")
    sede_direccion = sede_data.get("direccion", "")
    perfil = r.get("perfiles", {}) if isinstance(r.get("perfiles"), dict) else {}
    tecnico_nombre = perfil.get("nombre_completo", "-")
    tecnico_email = perfil.get("email", "-")

    buf = generar_pdf_fpdf(r, empresa_nombre, sede_nombre, sede_direccion, tecnico_nombre, tecnico_email)
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": "inline"})


@router.get("/reportes/{reporte_id}/qr-encuesta")
async def obtener_qr_encuesta(reporte_id: int, usuario: dict = Depends(get_usuario_actual)):
    result = supabase.table("reportes").select("id, token_encuesta, tecnico_id").eq("id", reporte_id).execute()
    if not result.data:
        raise HTTPException(404, "Reporte no encontrado")
    reporte = result.data[0]

    if usuario["rol"] != "admin" and reporte.get("tecnico_id") != usuario["id"]:
        raise HTTPException(403, "No tienes permiso para ver este reporte.")

    token = reporte.get("token_encuesta", "")
    if not token:
        token = str(uuid.uuid4())
        supabase.table("reportes").update({"token_encuesta": token}).eq("id", reporte_id).execute()

    return {"url": f"{FRONTEND_URL}/encuesta/{token}"}


@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": ahora_iso()}


@router.get("/me")
async def mi_perfil_legacy(usuario: dict = Depends(get_usuario_actual)):
    return usuario
