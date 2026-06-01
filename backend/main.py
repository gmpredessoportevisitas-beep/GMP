"""
GMP v2 Backend - API de Reportes con Control de Roles
======================================================
FastAPI + Supabase + JWT Auth + xhtml2pdf
Despliegue: Render (Plan Free)

Variables de entorno:
  SUPABASE_URL                -> URL del proyecto Supabase
  SUPABASE_SERVICE_ROLE_KEY   -> Service Role Key
  SUPABASE_JWT_SECRET         -> JWT Secret (Settings > API > JWT Secret)
"""

import os
import io
import re
import base64
from datetime import datetime, timezone, timedelta
from typing import Optional
from functools import wraps

import jwt as pyjwt
from fastapi import FastAPI, HTTPException, Query, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from supabase import create_client, Client
from xhtml2pdf import pisa
from PIL import Image, ImageDraw

# ===========================================================================
# CONFIGURACION
# ===========================================================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

for var, name in [
    (SUPABASE_URL, "SUPABASE_URL"),
    (SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
    (SUPABASE_JWT_SECRET, "SUPABASE_JWT_SECRET"),
]:
    if not var:
        raise RuntimeError(f"Variable de entorno {name} es obligatoria.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI(
    title="GMP v2 - Gestion de Mantenimiento Preventivo",
    version="2.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================================================================
# DEPENDENCIAS DE AUTENTICACION Y AUTORIZACION
# ===========================================================================

async def get_usuario_actual(authorization: str = Header(...)) -> dict:
    """Verifica el JWT de Supabase y retorna el perfil del usuario."""
    token = authorization.replace("Bearer ", "")
    try:
        payload = pyjwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expirado. Inicia sesion nuevamente.")
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "Token invalido.")

    user_id = payload.get("sub", "")
    result = supabase.table("perfiles").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(403, "Perfil no encontrado. Contacta al administrador.")
    perfil = result.data[0]
    if not perfil.get("activo", False):
        raise HTTPException(403, "Cuenta desactivada.")
    return perfil


def solo_admin(usuario: dict = Depends(get_usuario_actual)) -> dict:
    """Solo permite acceso a usuarios con rol 'admin'."""
    if usuario.get("rol") != "admin":
        raise HTTPException(403, "Accion reservada a administradores.")
    return usuario


# ===========================================================================
# ESQUEMAS Pydantic
# ===========================================================================

class EmpresaCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255)
    nit: str = Field(default="", max_length=50)
    direccion: str = Field(default="", max_length=500)
    telefono: str = Field(default="", max_length=50)
    email: str = Field(default="", max_length=255)


class SedeCreate(BaseModel):
    empresa_id: int
    nombre: str = Field(..., min_length=1, max_length=255)
    direccion: str = Field(default="", max_length=500)
    ciudad: str = Field(default="", max_length=100)


class UsuarioCreate(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    nombre_completo: str = Field(..., min_length=1, max_length=255)
    rol: str = Field(..., pattern="^(admin|tecnico)$")


class ReporteCreate(BaseModel):
    empresa_id: int
    sede_id: int
    observaciones: str = Field(default="", max_length=5000)
    firma_vector: str = Field(default="", max_length=50000)


# ===========================================================================
# PLANTILLA HTML PARA PDF
# ===========================================================================
PDF_TEMPLATE = """<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
@page{size:A4;margin:2cm 1.5cm 2.5cm 1.5cm;
  @frame header{-pdf-frame-content:hd;left:1.5cm;right:1.5cm;top:1cm;height:2.5cm;}
  @frame footer{-pdf-frame-content:ft;left:1.5cm;right:1.5cm;bottom:1cm;height:1.5cm;}}
body{font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#333;line-height:1.6;}
.header{text-align:center;border-bottom:3px solid #1a5276;padding-bottom:15px;margin-bottom:25px;}
.header h1{color:#1a5276;font-size:22px;margin:0 0 5px 0;}
.header p{color:#666;font-size:11px;margin:0;}
.info-grid{width:100%;border-collapse:collapse;margin-bottom:25px;}
.info-grid td{padding:8px 12px;border:1px solid #d5dbdb;vertical-align:top;}
.info-grid .label{background-color:#eaf2f8;font-weight:bold;color:#1a5276;width:25%;font-size:11px;}
.info-grid .value{font-size:12px;background:#fff;}
.section-title{color:#1a5276;font-size:14px;font-weight:bold;border-bottom:2px solid #aed6f1;padding-bottom:5px;margin:25px 0 10px 0;}
.obs-box{border:1px solid #d5dbdb;border-radius:4px;padding:15px;background:#f9fbfd;min-height:80px;font-size:12px;white-space:pre-wrap;}
.firma-section{margin-top:40px;}
.firma-box{text-align:center;border:1px solid #d5dbdb;border-radius:4px;padding:15px 10px 10px 10px;min-height:130px;}
.firma-box img{max-width:300px;max-height:120px;}
.firma-line{border-top:1px solid #333;width:250px;margin:10px auto 0 auto;padding-top:5px;font-size:10px;color:#666;}
.sin-firma{color:#999;font-style:italic;font-size:12px;padding:40px 0;}
.footer{text-align:center;font-size:9px;color:#999;}.footer span{margin:0 15px;}
</style></head><body>
<div id="hd" class="header"><h1>REPORTE DE MANTENIMIENTO</h1><p>Sistema GMP &middot; Gestion de Mantenimiento Preventivo</p></div>
<div class="section-title">Informacion General</div>
<table class="info-grid">
<tr><td class="label">ID Reporte</td><td class="value">{{id}}</td><td class="label">Fecha y Hora</td><td class="value">{{fecha_hora}}</td></tr>
<tr><td class="label">Empresa</td><td class="value">{{empresa}}</td><td class="label">Sede / Punto</td><td class="value">{{sede}}</td></tr>
<tr><td class="label">Tecnico</td><td class="value">{{tecnico}}</td><td class="label">Email Tecnico</td><td class="value">{{email_tecnico}}</td></tr>
</table>
<div class="section-title">Observaciones / Hallazgos</div>
<div class="obs-box">{{observaciones}}</div>
<div class="section-title firma-section">Firma del Cliente</div>
<div class="firma-box">{{firma_img}}<div class="firma-line">Firma de conformidad del cliente</div></div>
<div id="ft" class="footer"><span>Documento generado el {{fecha_generacion}}</span><span>GMP &copy; {{anio}}</span><span>Pagina <pdf:pagenumber> de <pdf:pagecount></span></div>
</body></html>"""

# ===========================================================================
# FUNCIONES AUXILIARES
# ===========================================================================

def ahora_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def format_fecha(iso: str, tz_offset: int = -5) -> str:
    if not iso:
        return "\u2014"
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        local = dt.astimezone(timezone(timedelta(hours=tz_offset)))
        meses = ["enero","febrero","marzo","abril","mayo","junio",
                 "julio","agosto","septiembre","octubre","noviembre","diciembre"]
        return f"{local.day} de {meses[local.month-1]} de {local.year} - {local.strftime('%H:%M')} hrs"
    except Exception:
        return iso


def svg_paths_a_png(svg_string: str, width: int = 400, height: int = 150) -> str:
    """Convierte paths SVG vectoriales a PNG base64 (data URI)."""
    if not svg_string or not svg_string.strip():
        return ""
    paths = re.findall(r'<path\s[^>]*\bd="([^"]*)"', svg_string)
    if not paths:
        paths = re.findall(r"<path\s[^>]*\bd='([^']*)'", svg_string)
    if not paths:
        return ""

    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    for d in paths:
        _dibujar_path(draw, d)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode()
    return f"data:image/png;base64,{b64}"


def _dibujar_path(draw: ImageDraw.ImageDraw, d: str) -> None:
    """Renderiza comandos M, L, Q de SVG sobre un ImageDraw."""
    tokens = re.findall(r"[MLQmlq]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", d)
    cur = (0.0, 0.0)
    i = 0
    while i < len(tokens):
        cmd = tokens[i].upper(); i += 1
        if cmd == "M" and i + 1 < len(tokens):
            cur = (float(tokens[i]), float(tokens[i+1])); i += 2
        elif cmd == "L" and i + 1 < len(tokens):
            p = (float(tokens[i]), float(tokens[i+1]))
            draw.line([cur, p], fill="black", width=3); cur = p; i += 2
        elif cmd == "Q" and i + 3 < len(tokens):
            cx, cy = float(tokens[i]), float(tokens[i+1])
            nx, ny = float(tokens[i+2]), float(tokens[i+3])
            prev = cur
            for s in range(1, 21):
                t = s / 20
                bx = (1-t)**2*cur[0] + 2*(1-t)*t*cx + t**2*nx
                by = (1-t)**2*cur[1] + 2*(1-t)*t*cy + t**2*ny
                pt = (bx, by)
                draw.line([prev, pt], fill="black", width=3)
                prev = pt
            cur = (nx, ny); i += 4
        else:
            i += 2  # skip unknown


def generar_html_pdf(reporte: dict, empresa_nombre: str, sede_nombre: str,
                     tecnico_nombre: str, tecnico_email: str) -> str:
    ahora = datetime.now(timezone.utc)
    firma_raw = reporte.get("firma_vector", "").strip()
    firma_html = (f'<img src="{svg_paths_a_png(firma_raw)}" alt="Firma" />'
                  if firma_raw else '<p class="sin-firma">Sin firma registrada</p>')
    obs = reporte.get("observaciones", "").strip() or "Sin observaciones registradas."

    r = {
        "{{id}}":               str(reporte.get("id","\u2014")),
        "{{fecha_hora}}":       format_fecha(reporte.get("fecha_hora","")),
        "{{empresa}}":          empresa_nombre,
        "{{sede}}":             sede_nombre,
        "{{tecnico}}":          tecnico_nombre,
        "{{email_tecnico}}":    tecnico_email,
        "{{observaciones}}":    obs,
        "{{firma_img}}":        firma_html,
        "{{fecha_generacion}}": format_fecha(ahora.isoformat()),
        "{{anio}}":             str(ahora.year),
    }
    html = PDF_TEMPLATE
    for k, v in r.items():
        html = html.replace(k, v)
    return html


# ===========================================================================
# ENDPOINTS ADMIN - Empresas
# ===========================================================================

@app.get("/api/admin/empresas")
async def listar_empresas(admin: dict = Depends(solo_admin)):
    result = supabase.table("empresas").select("*").order("nombre").execute()
    return result.data


@app.post("/api/admin/empresas", status_code=201)
async def crear_empresa(data: EmpresaCreate, admin: dict = Depends(solo_admin)):
    row = data.model_dump()
    row["creado_en"] = ahora_iso()
    result = supabase.table("empresas").insert(row).execute()
    return result.data[0]


@app.put("/api/admin/empresas/{empresa_id}")
async def editar_empresa(empresa_id: int, data: EmpresaCreate, admin: dict = Depends(solo_admin)):
    result = supabase.table("empresas").update(data.model_dump()).eq("id", empresa_id).execute()
    if not result.data:
        raise HTTPException(404, "Empresa no encontrada")
    return result.data[0]


@app.delete("/api/admin/empresas/{empresa_id}")
async def eliminar_empresa(empresa_id: int, admin: dict = Depends(solo_admin)):
    supabase.table("empresas").delete().eq("id", empresa_id).execute()
    return {"ok": True}


# ===========================================================================
# ENDPOINTS ADMIN - Sedes
# ===========================================================================

@app.get("/api/admin/sedes")
async def listar_sedes(admin: dict = Depends(solo_admin)):
    result = supabase.table("sedes").select("*, empresas(nombre)").order("nombre").execute()
    return result.data


@app.post("/api/admin/sedes", status_code=201)
async def crear_sede(data: SedeCreate, admin: dict = Depends(solo_admin)):
    row = data.model_dump()
    row["creado_en"] = ahora_iso()
    result = supabase.table("sedes").insert(row).execute()
    return result.data[0]


@app.put("/api/admin/sedes/{sede_id}")
async def editar_sede(sede_id: int, data: SedeCreate, admin: dict = Depends(solo_admin)):
    result = supabase.table("sedes").update(data.model_dump()).eq("id", sede_id).execute()
    if not result.data:
        raise HTTPException(404, "Sede no encontrada")
    return result.data[0]


@app.delete("/api/admin/sedes/{sede_id}")
async def eliminar_sede(sede_id: int, admin: dict = Depends(solo_admin)):
    supabase.table("sedes").delete().eq("id", sede_id).execute()
    return {"ok": True}


# ===========================================================================
# ENDPOINTS ADMIN - Usuarios (crea auth user + perfil)
# ===========================================================================

@app.get("/api/admin/usuarios")
async def listar_usuarios(admin: dict = Depends(solo_admin)):
    result = supabase.table("perfiles").select("*").order("nombre_completo").execute()
    return result.data


@app.post("/api/admin/usuarios", status_code=201)
async def crear_usuario(data: UsuarioCreate, admin: dict = Depends(solo_admin)):
    # 1) Crear usuario en Supabase Auth
    auth_resp = supabase.auth.admin.create_user({
        "email": data.email,
        "password": data.password,
        "email_confirm": True,
        "user_metadata": {"nombre_completo": data.nombre_completo, "rol": data.rol},
    })
    if not auth_resp.user:
        raise HTTPException(500, "Error al crear usuario en Auth.")

    user_id = auth_resp.user.id

    # 2) Insertar perfil en tabla perfiles
    perfil = {
        "id": user_id,
        "email": data.email,
        "nombre_completo": data.nombre_completo,
        "rol": data.rol,
        "activo": True,
        "creado_en": ahora_iso(),
    }
    supabase.table("perfiles").insert(perfil).execute()

    return {"id": user_id, "email": data.email, "rol": data.rol, "nombre_completo": data.nombre_completo}


@app.put("/api/admin/usuarios/{user_id}")
async def editar_usuario(user_id: str, data: UsuarioCreate, admin: dict = Depends(solo_admin)):
    supabase.table("perfiles").update({
        "nombre_completo": data.nombre_completo,
        "rol": data.rol,
    }).eq("id", user_id).execute()
    return {"ok": True}


@app.put("/api/admin/usuarios/{user_id}/toggle")
async def toggle_usuario(user_id: str, admin: dict = Depends(solo_admin)):
    perfil = supabase.table("perfiles").select("activo").eq("id", user_id).execute()
    if not perfil.data:
        raise HTTPException(404, "Usuario no encontrado")
    nuevo = not perfil.data[0]["activo"]
    supabase.table("perfiles").update({"activo": nuevo}).eq("id", user_id).execute()
    return {"activo": nuevo}


# ===========================================================================
# ENDPOINTS PUBLICOS - Catalogos para dropdowns (requiere auth)
# ===========================================================================

@app.get("/api/catalogos/empresas")
async def catalogos_empresas(usuario: dict = Depends(get_usuario_actual)):
    result = supabase.table("empresas").select("id, nombre").order("nombre").execute()
    return result.data


@app.get("/api/catalogos/sedes")
async def catalogos_sedes(empresa_id: Optional[int] = None, usuario: dict = Depends(get_usuario_actual)):
    q = supabase.table("sedes").select("id, nombre, ciudad, empresa_id").order("nombre")
    if empresa_id:
        q = q.eq("empresa_id", empresa_id)
    result = q.execute()
    return result.data


# ===========================================================================
# ENDPOINTS - Reportes
# ===========================================================================

@app.post("/api/reportes", status_code=201)
async def crear_reporte(data: ReporteCreate, usuario: dict = Depends(get_usuario_actual)):
    row = data.model_dump()
    row["tecnico_id"] = usuario["id"]
    row["fecha_hora"] = ahora_iso()
    row["creado_en"] = ahora_iso()

    # Validar que la sede pertenezca a la empresa
    sede = supabase.table("sedes").select("empresa_id").eq("id", data.sede_id).execute()
    if not sede.data or sede.data[0]["empresa_id"] != data.empresa_id:
        raise HTTPException(400, "La sede no pertenece a la empresa seleccionada.")

    result = supabase.table("reportes").insert(row).execute()
    return {"mensaje": "Reporte creado", "reporte": result.data[0]}


@app.get("/api/reportes")
async def listar_reportes(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    usuario: dict = Depends(get_usuario_actual),
):
    q = (supabase.table("reportes")
         .select("*, empresas(nombre), sedes(nombre, ciudad), perfiles!reportes_tecnico_id_fkey(nombre_completo, email)")
         .order("fecha_hora", desc=True))

    # Admin ve todo, tecnico solo ve sus reportes
    if usuario["rol"] != "admin":
        q = q.eq("tecnico_id", usuario["id"])

    result = q.range(offset, offset + limit - 1).execute()
    return result.data


@app.get("/api/reportes/{reporte_id}/pdf")
async def generar_pdf(reporte_id: int, usuario: dict = Depends(get_usuario_actual)):
    result = (supabase.table("reportes")
              .select("*, empresas(nombre), sedes(nombre), perfiles!reportes_tecnico_id_fkey(nombre_completo, email)")
              .eq("id", reporte_id)
              .execute())
    if not result.data:
        raise HTTPException(404, "Reporte no encontrado")
    r = result.data[0]

    # Control de acceso: admin ve todo, tecnico solo lo propio
    if usuario["rol"] != "admin" and r.get("tecnico_id") != usuario["id"]:
        raise HTTPException(403, "No tienes permiso para ver este reporte.")

    empresa_nombre = r.get("empresas", {}).get("nombre", "\u2014") if isinstance(r.get("empresas"), dict) else "\u2014"
    sede_nombre = r.get("sedes", {}).get("nombre", "\u2014") if isinstance(r.get("sedes"), dict) else "\u2014"
    perfil = r.get("perfiles", {}) if isinstance(r.get("perfiles"), dict) else {}
    tecnico_nombre = perfil.get("nombre_completo", "\u2014")
    tecnico_email = perfil.get("email", "\u2014")

    html = generar_html_pdf(r, empresa_nombre, sede_nombre, tecnico_nombre, tecnico_email)

    buf = io.BytesIO()
    pdf_status = pisa.CreatePDF(src=io.StringIO(html), dest=buf, encoding="UTF-8")
    if pdf_status.err:
        raise HTTPException(500, "Error al generar PDF")
    buf.seek(0)

    filename = f"reporte_{reporte_id}.pdf"
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": ahora_iso()}


@app.get("/api/me")
async def mi_perfil(usuario: dict = Depends(get_usuario_actual)):
    """Retorna el perfil del usuario autenticado (usado por el frontend al iniciar)."""
    return usuario


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
