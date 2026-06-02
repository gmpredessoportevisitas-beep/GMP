"""
GMP v2 Backend - API de Reportes con Control de Roles
======================================================
FastAPI + Supabase + JWT Auth + fpdf2
Despliegue: Render (Plan Free)

Variables de entorno:
  SUPABASE_URL                -> URL del proyecto Supabase
  SUPABASE_SERVICE_ROLE_KEY   -> Service Role Key
"""

import os
import io
import re
import base64
import tempfile
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from supabase import create_client, Client
from fpdf import FPDF
from PIL import Image, ImageDraw
from dotenv import load_dotenv

load_dotenv()

# ===========================================================================
# CONFIGURACION
# ===========================================================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

for var, name in [
    (SUPABASE_URL, "SUPABASE_URL"),
    (SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
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
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================================================================
# DEPENDENCIAS DE AUTENTICACION Y AUTORIZACION
# ===========================================================================

async def get_usuario_actual(authorization: str = Header(...)) -> dict:
    """
    Verifica el token JWT usando la API de Supabase (no requiere JWT_SECRET manual).
    Luego consulta la tabla perfiles para obtener el rol del usuario.
    """
    token = authorization.replace("Bearer ", "")
    try:
        # Validar el token contra Supabase Auth (el propio Supabase verifica firma y expiracion)
        user_resp = supabase.auth.get_user(token)
        if not user_resp.user:
            raise HTTPException(401, "Token invalido o expirado.")
    except Exception as e:
        msg = str(e)
        if "expired" in msg.lower() or "JWT" in msg:
            raise HTTPException(401, "Token expirado. Inicia sesion nuevamente.")
        raise HTTPException(401, f"Token invalido: {msg}")

    user_id = user_resp.user.id
    email = user_resp.user.email or ""

    # Obtener perfil desde la tabla perfiles
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
# FUNCIONES AUXILIARES
# ===========================================================================

def ahora_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def format_fecha(iso: str, tz_offset: int = -5) -> str:
    if not iso:
        return "-"
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


def svg_paths_a_png_bytes(svg_string: str, width: int = 400, height: int = 150) -> Optional[io.BytesIO]:
    """Convierte paths SVG a BytesIO PNG (para usar directamente con fpdf2)."""
    if not svg_string or not svg_string.strip():
        return None
    paths = re.findall(r'<path\s[^>]*\bd="([^"]*)"', svg_string)
    if not paths:
        paths = re.findall(r"<path\s[^>]*\bd='([^']*)'", svg_string)
    if not paths:
        return None

    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    for d in paths:
        _dibujar_path(draw, d)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


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


class ReportePDF(FPDF):
    """PDF corporativo del reporte de mantenimiento. Zero-storage: se genera en RAM."""

    def __init__(self, reporte: dict, empresa: str, sede: str, tecnico: str, email_tec: str):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.reporte = reporte
        self.empresa = empresa
        self.sede = sede
        self.tecnico = tecnico
        self.email_tec = email_tec
        # Colores corporativos naranja (#FE6501) y negro
        self.COLOR_PRIMARIO = (254, 101, 1)    # #FE6501
        self.COLOR_FONDO = (255, 238, 224)     # naranja muy claro
        self.COLOR_BORDE = (220, 220, 220)     # gris claro
        self.COLOR_TEXTO = (0, 0, 0)           # negro puro
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        """Encabezado en cada pagina."""
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(*self.COLOR_PRIMARIO)
        self.cell(0, 10, "REPORTE DE MANTENIMIENTO", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 6, "Sistema GMP - Gestion de Mantenimiento Preventivo", align="C", new_x="LMARGIN", new_y="NEXT")
        # Linea separadora naranja
        self.set_draw_color(*self.COLOR_PRIMARIO)
        self.set_line_width(0.6)
        self.line(self.l_margin, self.get_y() + 1, self.w - self.r_margin, self.get_y() + 1)
        self.ln(8)

    def footer(self):
        """Pie de pagina."""
        self.set_y(-15)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(150, 150, 150)
        ahora = datetime.now(timezone.utc)
        fecha_gen = format_fecha(ahora.isoformat())
        self.cell(0, 10, f"Documento generado el {fecha_gen}    |    GMP \u00a9 {ahora.year}    |    Pagina {self.page_no()}/{{nb}}", align="C")

    def seccion_titulo(self, titulo: str):
        """Titulo de seccion con subrayado naranja."""
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*self.COLOR_PRIMARIO)
        self.cell(0, 8, titulo, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(254, 180, 100)  # naranja claro para subrayado
        self.set_line_width(0.5)
        y = self.get_y()
        self.line(self.l_margin, y, self.w - self.r_margin, y)
        self.ln(5)

    def tabla_info(self):
        """Tabla de informacion general con celdas coloreadas."""
        self.seccion_titulo("Informacion General")
        # Ancho util A4: 210 - 10 - 10 = 190mm
        # Distribucion por fila: label1(35) + value1(60) + label2(35) + value2(60) = 190mm
        cols = (35, 60, 35, 60)
        datos = [
            ("ID Reporte", str(self.reporte.get("id", "-")), "Fecha y Hora", format_fecha(self.reporte.get("fecha_hora", ""))),
            ("Empresa", self.empresa, "Sede / Punto", self.sede),
            ("Tecnico", self.tecnico, "Email Tecnico", self.email_tec),
        ]
        for fila in datos:
            self._fila_tabla(fila, cols)
        self.ln(5)

    def _fila_tabla(self, celdas: tuple, anchos: tuple):
        """Dibuja una fila de la tabla con label (fondo claro) + value."""
        h = 8
        for i, (label, value) in enumerate([(celdas[0], celdas[1]), (celdas[2], celdas[3])]):
            # Label
            self.set_fill_color(*self.COLOR_FONDO)
            self.set_text_color(*self.COLOR_TEXTO)
            self.set_font("Helvetica", "B", 8)
            self.cell(anchos[i * 2], h, f"  {label}", border=1, fill=True)
            # Value (truncado a 55 caracteres para que entre en la celda)
            val = str(value)
            if len(val) > 55:
                val = val[:52] + "..."
            self.set_fill_color(255, 255, 255)
            self.set_text_color(*self.COLOR_TEXTO)
            self.set_font("Helvetica", "", 8)
            self.cell(anchos[i * 2 + 1], h, f"  {val}", border=1, fill=True, new_x="RIGHT", new_y="LAST")
        self.ln()

    def seccion_observaciones(self):
        """Observaciones con recuadro."""
        self.seccion_titulo("Observaciones / Hallazgos")
        obs = self.reporte.get("observaciones", "").strip() or "Sin observaciones registradas."
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*self.COLOR_TEXTO)
        self.set_fill_color(252, 248, 245)
        self.set_draw_color(*self.COLOR_BORDE)
        self.set_line_width(0.3)
        ancho = self.w - self.l_margin - self.r_margin
        self.multi_cell(ancho, 5, obs, border=1, fill=True, align="L")
        self.ln(6)

    def seccion_firma(self):
        """Firma del cliente como imagen PNG generada desde el SVG vectorial."""
        self.seccion_titulo("Firma del Cliente")
        firma_raw = self.reporte.get("firma_vector", "").strip()
        if firma_raw:
            png_buf = svg_paths_a_png_bytes(firma_raw)
            if png_buf:
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                    tmp.write(png_buf.read())
                    tmp_path = tmp.name
                try:
                    img_w = 80
                    x = (self.w - img_w) / 2
                    self.image(tmp_path, x=x, w=img_w)
                finally:
                    os.unlink(tmp_path)
        else:
            self.set_font("Helvetica", "I", 10)
            self.set_text_color(150, 150, 150)
            self.cell(0, 30, "Sin firma registrada", align="C", new_x="LMARGIN", new_y="NEXT")
        # Linea de firma
        self.set_draw_color(*self.COLOR_TEXTO)
        self.set_line_width(0.4)
        x_line = (self.w - 60) / 2
        y_line = self.get_y() + 12
        self.line(x_line, y_line, x_line + 60, y_line)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(100, 100, 100)
        self.set_y(y_line + 2)
        self.cell(0, 6, "Firma de conformidad del cliente", align="C")


def generar_pdf_fpdf(reporte: dict, empresa: str, sede: str, tecnico: str, email_tec: str) -> io.BytesIO:
    """Genera el PDF del reporte en RAM usando fpdf2. Zero-storage."""
    pdf = ReportePDF(reporte, empresa, sede, tecnico, email_tec)
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.tabla_info()
    pdf.seccion_observaciones()
    pdf.seccion_firma()
    buf = io.BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return buf


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

    empresa_nombre = r.get("empresas", {}).get("nombre", "-") if isinstance(r.get("empresas"), dict) else "-"
    sede_nombre = r.get("sedes", {}).get("nombre", "-") if isinstance(r.get("sedes"), dict) else "-"
    perfil = r.get("perfiles", {}) if isinstance(r.get("perfiles"), dict) else {}
    tecnico_nombre = perfil.get("nombre_completo", "-")
    tecnico_email = perfil.get("email", "-")

    # Generar PDF programaticamente con fpdf2 (Zero-Storage: todo en RAM)
    buf = generar_pdf_fpdf(r, empresa_nombre, sede_nombre, tecnico_nombre, tecnico_email)

    filename = f"reporte_{reporte_id}.pdf"
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.post("/api/preview-pdf")
async def previsualizar_pdf(data: ReporteCreate, usuario: dict = Depends(get_usuario_actual)):
    """Genera PDF de previsualizacion SIN guardar en BD (Zero-Storage)."""
    empresa_res = supabase.table("empresas").select("nombre").eq("id", data.empresa_id).execute()
    sede_res = supabase.table("sedes").select("nombre").eq("id", data.sede_id).execute()
    empresa_nombre = empresa_res.data[0]["nombre"] if empresa_res.data else "-"
    sede_nombre = sede_res.data[0]["nombre"] if sede_res.data else "-"
    tecnico_nombre = usuario.get("nombre_completo", "-")
    tecnico_email = usuario.get("email", "-")

    preview = {
        "id": "-",
        "fecha_hora": ahora_iso(),
        "observaciones": data.observaciones,
        "firma_vector": data.firma_vector,
    }
    buf = generar_pdf_fpdf(preview, empresa_nombre, sede_nombre, tecnico_nombre, tecnico_email)
    return StreamingResponse(buf, media_type="application/pdf")


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
