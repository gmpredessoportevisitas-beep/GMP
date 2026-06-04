import io
import re
import base64
import tempfile
import os
from datetime import datetime, timezone, timedelta  
from typing import Optional

from fpdf import FPDF
from PIL import Image, ImageDraw


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
    if not svg_string or not svg_string.strip():
        return ""
    paths = _extraer_paths(svg_string)
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
    if not svg_string or not svg_string.strip():
        return None
    paths = _extraer_paths(svg_string)
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


def _extraer_paths(svg_string: str) -> list[str]:
    paths = re.findall(r'<path\s[^>]*\bd="([^"]*)"', svg_string)
    if not paths:
        paths = re.findall(r"<path\s[^>]*\bd='([^']*)'", svg_string)
    return paths


def _dibujar_path(draw: ImageDraw.ImageDraw, d: str) -> None:
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
            i += 2


class ReportePDF(FPDF):
    def __init__(self, reporte: dict, empresa: str, sede: str, tecnico: str, email_tec: str):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.reporte = reporte
        self.empresa = empresa
        self.sede = sede
        self.tecnico = tecnico
        self.email_tec = email_tec
        self.COLOR_PRIMARIO = (254, 101, 1)
        self.COLOR_FONDO = (255, 238, 224)
        self.COLOR_BORDE = (220, 220, 220)
        self.COLOR_TEXTO = (0, 0, 0)
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(*self.COLOR_PRIMARIO)
        self.cell(0, 10, "Reporte de Visitas", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 6, "Sistema GMP - Reporte de Visitas", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*self.COLOR_PRIMARIO)
        self.set_line_width(0.6)
        self.line(self.l_margin, self.get_y() + 1, self.w - self.r_margin, self.get_y() + 1)
        self.ln(8)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(150, 150, 150)
        ahora = datetime.now(timezone.utc)
        fecha_gen = format_fecha(ahora.isoformat())
        self.cell(0, 10, f"Documento generado el {fecha_gen}    |    GMP \u00a9 {ahora.year}    |    Pagina {self.page_no()}/{{nb}}", align="C")

    def seccion_titulo(self, titulo: str):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*self.COLOR_PRIMARIO)
        self.cell(0, 8, titulo, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(254, 180, 100)
        self.set_line_width(0.5)
        y = self.get_y()
        self.line(self.l_margin, y, self.w - self.r_margin, y)
        self.ln(5)

    def tabla_info(self):
        self.seccion_titulo("Informacion General")
        cols = (35, 60, 35, 60)
        motivo = self.reporte.get("motivo_visita", "").capitalize() or "-"
        if self.reporte.get("motivo_visita") == "otro" and self.reporte.get("motivo_visita_otro", "").strip():
            motivo = f"Otro: {self.reporte.get('motivo_visita_otro')}"
            motivo = motivo.encode('ascii', 'ignore').decode('ascii')
        materiales = "Si" if self.reporte.get("uso_materiales") else "No"
        nombre_asesor = self.reporte.get("nombre_asesor", "-").encode('ascii', 'ignore').decode('ascii')
        telefono_asesor = self.reporte.get("telefono_asesor", "-").encode('ascii', 'ignore').decode('ascii')
        datos = [
            ("ID Reporte", str(self.reporte.get("id", "-")), "Fecha y Hora", format_fecha(self.reporte.get("fecha_hora", ""))),
            ("Empresa", self.empresa, "Sede / Punto", self.sede),
            ("Tecnico", self.tecnico, "Email Tecnico", self.email_tec),
            ("Asesor", nombre_asesor, "Tel. Asesor", telefono_asesor),
            ("Motivo Visita", motivo, "Uso Materiales", materiales),
        ]
        for fila in datos:
            self._fila_tabla(fila, cols)
        self.ln(5)

    def seccion_materiales(self):
        if self.reporte.get("uso_materiales") and self.reporte.get("materiales_detalle", "").strip():
            self.seccion_titulo("Materiales Utilizados")
            detalle = self.reporte.get("materiales_detalle", "").strip()
            detalle = detalle.encode('ascii', 'ignore').decode('ascii')
            self.set_font("Helvetica", "", 9)
            self.set_text_color(*self.COLOR_TEXTO)
            self.set_fill_color(252, 248, 245)
            self.set_draw_color(*self.COLOR_BORDE)
            self.set_line_width(0.3)
            ancho = self.w - self.l_margin - self.r_margin
            self.multi_cell(ancho, 5, detalle, border=1, fill=True, align="L")
            self.ln(6)

    def _fila_tabla(self, celdas: tuple, anchos: tuple):
        h = 8
        for i, (label, value) in enumerate([(celdas[0], celdas[1]), (celdas[2], celdas[3])]):
            self.set_fill_color(*self.COLOR_FONDO)
            self.set_text_color(*self.COLOR_TEXTO)
            self.set_font("Helvetica", "B", 8)
            self.cell(anchos[i * 2], h, f"  {label}", border=1, fill=True)
            val = str(value)
            if len(val) > 55:
                val = val[:52] + "..."
            self.set_fill_color(255, 255, 255)
            self.set_text_color(*self.COLOR_TEXTO)
            self.set_font("Helvetica", "", 8)
            self.cell(anchos[i * 2 + 1], h, f"  {val}", border=1, fill=True, new_x="RIGHT", new_y="LAST")
        self.ln()

    def seccion_hallazgos(self):
        self.seccion_titulo("Hallazgos")
        obs = self.reporte.get("hallazgos", "").strip() or "Sin hallazgos registrados."
        obs = obs.encode('ascii', 'ignore').decode('ascii')
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*self.COLOR_TEXTO)
        self.set_fill_color(252, 248, 245)
        self.set_draw_color(*self.COLOR_BORDE)
        self.set_line_width(0.3)
        ancho = self.w - self.l_margin - self.r_margin
        self.multi_cell(ancho, 5, obs, border=1, fill=True, align="L")
        self.ln(6)

    def seccion_firma(self):
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
    pdf = ReportePDF(reporte, empresa, sede, tecnico, email_tec)
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.tabla_info()
    pdf.seccion_materiales()
    pdf.seccion_hallazgos()
    pdf.seccion_firma()
    buf = io.BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return buf
