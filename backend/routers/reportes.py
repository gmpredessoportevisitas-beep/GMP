from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from config import supabase
from schemas import ReporteCreate
from deps import get_usuario_actual
from utils import ahora_iso, generar_pdf_fpdf

router = APIRouter(prefix="/api", tags=["reportes"])


@router.post("/reportes", status_code=201)
async def crear_reporte(data: ReporteCreate, usuario: dict = Depends(get_usuario_actual)):
    row = data.model_dump()
    row["tecnico_id"] = usuario["id"]
    row["fecha_hora"] = ahora_iso()
    row["creado_en"] = ahora_iso()

    sede = supabase.table("sedes").select("empresa_id").eq("id", data.sede_id).execute()
    if not sede.data or sede.data[0]["empresa_id"] != data.empresa_id:
        raise HTTPException(400, "La sede no pertenece a la empresa seleccionada.")

    result = supabase.table("reportes").insert(row).execute()
    return {"mensaje": "Reporte creado", "reporte": result.data[0]}


@router.get("/reportes")
async def listar_reportes(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    usuario: dict = Depends(get_usuario_actual),
):
    q = (supabase.table("reportes")
         .select("*, empresas(nombre), sedes(nombre, ciudad), perfiles!reportes_tecnico_id_fkey(nombre_completo, email)")
         .order("fecha_hora", desc=True))

    if usuario["rol"] != "admin":
        q = q.eq("tecnico_id", usuario["id"])

    return q.range(offset, offset + limit - 1).execute().data


@router.get("/reportes/{reporte_id}/pdf")
async def generar_pdf(reporte_id: int, usuario: dict = Depends(get_usuario_actual)):
    result = (supabase.table("reportes")
              .select("*, empresas(nombre), sedes(nombre), perfiles!reportes_tecnico_id_fkey(nombre_completo, email)")
              .eq("id", reporte_id)
              .execute())
    if not result.data:
        raise HTTPException(404, "Reporte no encontrado")
    r = result.data[0]

    if usuario["rol"] != "admin" and r.get("tecnico_id") != usuario["id"]:
        raise HTTPException(403, "No tienes permiso para ver este reporte.")

    empresa_nombre = r.get("empresas", {}).get("nombre", "-") if isinstance(r.get("empresas"), dict) else "-"
    sede_nombre = r.get("sedes", {}).get("nombre", "-") if isinstance(r.get("sedes"), dict) else "-"
    perfil = r.get("perfiles", {}) if isinstance(r.get("perfiles"), dict) else {}
    tecnico_nombre = perfil.get("nombre_completo", "-")
    tecnico_email = perfil.get("email", "-")

    buf = generar_pdf_fpdf(r, empresa_nombre, sede_nombre, tecnico_nombre, tecnico_email)

    filename = f"reporte_{reporte_id}.pdf"
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/reportes/{reporte_id}/preview-pdf")
async def previsualizar_pdf(reporte_id: int, usuario: dict = Depends(get_usuario_actual)):
    result = (supabase.table("reportes")
              .select("*, empresas(nombre), sedes(nombre), perfiles!reportes_tecnico_id_fkey(nombre_completo, email)")
              .eq("id", reporte_id)
              .execute())
    if not result.data:
        raise HTTPException(404, "Reporte no encontrado")
    r = result.data[0]

    if usuario["rol"] != "admin" and r.get("tecnico_id") != usuario["id"]:
        raise HTTPException(403, "No tienes permiso para ver este reporte.")

    empresa_nombre = r.get("empresas", {}).get("nombre", "-") if isinstance(r.get("empresas"), dict) else "-"
    sede_nombre = r.get("sedes", {}).get("nombre", "-") if isinstance(r.get("sedes"), dict) else "-"
    perfil = r.get("perfiles", {}) if isinstance(r.get("perfiles"), dict) else {}
    tecnico_nombre = perfil.get("nombre_completo", "-")
    tecnico_email = perfil.get("email", "-")

    buf = generar_pdf_fpdf(r, empresa_nombre, sede_nombre, tecnico_nombre, tecnico_email)
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": "inline"})


@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": ahora_iso()}


@router.get("/me")
async def mi_perfil_legacy(usuario: dict = Depends(get_usuario_actual)):
    return usuario
