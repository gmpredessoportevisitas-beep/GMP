import io
import re
import base64
import os
from datetime import datetime, timezone, timedelta
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import mm
from reportlab.lib import colors as rl_colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Table, TableStyle,
                                 Image, Spacer)
from reportlab.platypus.flowables import HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PILImage, ImageDraw
from config_assets import LOGO_BASE64
from reportlab.lib.utils import ImageReader


def ahora_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def fecha_local_a_utc(fecha_str: str, inicio: bool = True, tz_offset: int = -5) -> str:
    if not fecha_str:
        return fecha_str
    delta = timedelta(hours=abs(tz_offset))
    dt = datetime.strptime(fecha_str, "%Y-%m-%d")
    if inicio:
        dt_local = dt.replace(hour=0, minute=0, second=0, tzinfo=timezone(-delta))
    else:
        dt_local = dt.replace(hour=23, minute=59, second=59, tzinfo=timezone(-delta))
    return dt_local.astimezone(timezone.utc).isoformat()


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
    img = PILImage.new("RGB", (width, height), "white")
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
    img = PILImage.new("RGB", (width, height), "white")
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


_FONTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_ITALIC = "Helvetica-Oblique"
_UNICODE_AVAILABLE = False

_ttf_regular = os.path.join(_FONTS_DIR, "DejaVuSans.ttf")
_ttf_bold = os.path.join(_FONTS_DIR, "DejaVuSans-Bold.ttf")
if os.path.exists(_ttf_regular):
    try:
        pdfmetrics.registerFont(TTFont("DejaVuSans", _ttf_regular))
        if os.path.exists(_ttf_bold):
            pdfmetrics.registerFont(TTFont("DejaVuSansBold", _ttf_bold))
        else:
            pdfmetrics.registerFont(TTFont("DejaVuSansBold", _ttf_regular))
        FONT_REGULAR = "DejaVuSans"
        FONT_BOLD = "DejaVuSansBold"
        FONT_ITALIC = "DejaVuSans"
        _UNICODE_AVAILABLE = True
    except Exception:
        pass

COLOR_PRIMARY = rl_colors.HexColor("#131313")
COLOR_SECONDARY = rl_colors.HexColor("#D1D5DB")
COLOR_FOOTER = rl_colors.HexColor("#969696")
COLOR_GRID = rl_colors.Color(0.85, 0.85, 0.85)
COLOR_WHITE = rl_colors.white

VERSION = "1.0"


def _ascii_safe(text: str) -> str:
    if _UNICODE_AVAILABLE:
        return text
    return text.encode("ascii", "ignore").decode("ascii")


class ReportePDF:
    def __init__(self, buf: io.BytesIO, reporte: dict, empresa: str,
                 sede: str, sede_direccion: str, tecnico: str, email_tec: str):
        self.reporte = reporte
        self.empresa = empresa
        self.sede = sede
        self.sede_direccion = sede_direccion
        self.tecnico = tecnico
        self.email_tec = email_tec

        self.doc = SimpleDocTemplate(
            buf,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=33 * mm,
            bottomMargin=25 * mm,
            title=f"Reporte {reporte.get('id', '')}",
            author="GMP Redes",
        )

    def _header_footer(self, canvas, doc):
        canvas.saveState()
        page_w, page_h = A4

        logo_w = 27 * mm
        logo_h = 15 * mm
        
        logo_x = 22 * mm 
        logo_y = page_h - 28 * mm 
        canvas.setFillColor(COLOR_PRIMARY)
        canvas.rect(0, page_h - 31 * mm, page_w, 35 * mm, fill=1, stroke=0)

        logo_bytes = base64.b64decode(LOGO_BASE64)
        img_logo = ImageReader(io.BytesIO(logo_bytes))
        canvas.drawImage(img_logo, logo_x, logo_y, width=logo_w, height=logo_h, mask='auto')

        
        canvas.setFont(FONT_BOLD, 18)
        canvas.setFillColor(COLOR_WHITE)
        canvas.drawCentredString(page_w / 2, page_h - 23 * mm, "Reporte de Visitas")

        canvas.setFont(FONT_REGULAR, 9)
        canvas.setFillColor(COLOR_SECONDARY)
        canvas.drawCentredString(page_w / 2, page_h - 29 * mm,
                                 "Sistema de Gestión - Proceso de Gestión Humana")

        alto_footer = 20 * mm 
        canvas.setFillColor(COLOR_PRIMARY)
        canvas.rect(0, 0, page_w, alto_footer, fill=1, stroke=0)

        ahora = datetime.now(timezone.utc)
        fecha_gen = format_fecha(ahora.isoformat())
        canvas.setFont(FONT_REGULAR, 7)
        canvas.setFillColor(COLOR_WHITE) 
        footer_texto = f"Documento generado el {fecha_gen}    |    GMP Redes \u00a9 {ahora.year}    |    Página {doc.page}    |    v{VERSION}"
        y_texto_footer = (alto_footer / 2) - 1 * mm 
        canvas.drawCentredString(page_w / 2, y_texto_footer, footer_texto)
        canvas.restoreState()

    def _section_title(self, title: str):
        return [
            Paragraph(title, ParagraphStyle(
                "SectionTitle", fontName=FONT_BOLD, fontSize=11,
                textColor=COLOR_PRIMARY, spaceBefore=0, spaceAfter=2 * mm,
            )),HRFlowable(width="100%", color=COLOR_PRIMARY, spaceBefore=0, spaceAfter=8)
        ]

    def _label_style(self):
        return ParagraphStyle(
            "CellLabel", fontName=FONT_BOLD, fontSize=8,
            textColor=COLOR_PRIMARY, leading=10,
        )

    def _value_style(self):
        return ParagraphStyle(
            "CellValue", fontName=FONT_REGULAR, fontSize=8,
            textColor=COLOR_PRIMARY, leading=10,
        )

    def _body_style(self):
        return ParagraphStyle(
            "Body", fontName=FONT_REGULAR, fontSize=9,
            textColor=COLOR_PRIMARY, leading=12,
        )

    def _fecha(self):
        label = self._label_style()
        value = self._value_style()

        data = [
            [
                Paragraph("Fecha", label),
                Paragraph(format_fecha(self.reporte.get("fecha_hora", "")), value),
            ]
        ]

        col_widths = [29 * mm, 137 * mm]
        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_GRID),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [COLOR_WHITE, COLOR_WHITE]),
        ]))
        return [table]       

    def _empresa_sede(self):
        label = self._label_style()
        value = self._value_style()

        data = [
            [
                Paragraph("Empresa", label),
                Paragraph(_ascii_safe(self.empresa), value),
                Paragraph("Punto", label),
                Paragraph(_ascii_safe(self.sede).title(), value),
            ]
        ]
        col_widths = [29 * mm, 54 * mm, 29 * mm, 54 * mm]
        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6), 
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_GRID),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [COLOR_WHITE, COLOR_WHITE]),
        
        ]))
        return [table]

    def _direccion(self):
        label = self._label_style()
        value = self._value_style()

        data = [
            [
                Paragraph("Dirección", label),
                Paragraph(_ascii_safe(self.sede_direccion).title(), value),
            ]
        ]
        col_widths = [29 * mm, 137 * mm]
        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_GRID),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [COLOR_WHITE, COLOR_WHITE]),
        ]))
        return [table]

    def _tecnico_y_motivo(self):
        label = self._label_style()
        value = self._value_style()

        data = [
            [
                Paragraph("Tecnico", label),
                Paragraph(_ascii_safe(self.tecnico).title(), value),
                Paragraph("Motivo Visita", label),
                Paragraph(_ascii_safe(self.reporte.get("motivo_visita", "")).title(), value),
            ]
        ]

        col_widths = [29 * mm, 54 * mm, 29 * mm, 54 * mm]
        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_GRID),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [COLOR_WHITE, COLOR_WHITE]),
        ]))
        return [table, Spacer(1, 7 * mm)]

    def _materiales_section(self):
        if not (self.reporte.get("uso_materiales") and self.reporte.get("materiales_detalle", "").strip()):
            return []
        detalle = _ascii_safe(self.reporte.get("materiales_detalle", "").strip())
        return self._section_title("Materiales Utilizados") + [
            Paragraph(detalle, self._body_style()),
            Spacer(1, 14 * mm),
        ]

    def _hallazgos_section(self):
        obs = self.reporte.get("hallazgos", "").strip()
        obs = _ascii_safe(obs) if obs else "Sin hallazgos registrados."
        return self._section_title("Hallazgos") + [
            Paragraph(obs, self._body_style()),
            Spacer(1, 14 * mm),
        ]

    def _firma_section(self):
        elements = self._section_title("Información del Asesor")
        label = self._label_style()
        value = self._value_style()
        data = [
            [
                Paragraph("Nombre del Asesor", label),
                Paragraph(_ascii_safe(self.reporte.get("nombre_asesor", "")).title(), value),
            ],
        ]
        col_widths = [58 * mm, 108 * mm]
        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_GRID),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [COLOR_WHITE, COLOR_WHITE]),
        ]))
        elements.append(table)
        data = [
            [
                Paragraph("Telefono del Asesor", label),
                Paragraph(_ascii_safe(self.reporte.get("telefono_asesor", "")).title(), value),
            ],
        ]
        col_widths = [58 * mm, 108 * mm]
        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_GRID),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [COLOR_WHITE, COLOR_WHITE]),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 8 * mm))
        firma_raw = self.reporte.get("firma_vector", "").strip()
        if firma_raw:
            png_buf = svg_paths_a_png_bytes(firma_raw)
            if png_buf:
                img = Image(png_buf, width=80 * mm, height=30 * mm)
                img.hAlign = "CENTER"
                elements.append(img)
                elements.append(Spacer(1, 4 * mm))
        else:
            elements.append(Paragraph(
                "Sin firma registrada",
                ParagraphStyle("NoSig", fontName=FONT_ITALIC, fontSize=10,
                               textColor=COLOR_FOOTER, alignment=TA_CENTER,
                               spaceAfter=4 * mm),
            ))

        elements.append(HRFlowable(width=60 * mm, thickness=0.4,
                                    color=COLOR_PRIMARY, hAlign='CENTER', spaceAfter=2 * mm))
        elements.append(Paragraph(
            "Firma de conformidad del Asesor",
            ParagraphStyle("SigLabel", fontName=FONT_REGULAR, fontSize=8,
                           textColor=COLOR_SECONDARY, alignment=TA_CENTER),
        ))
        return elements

    def build(self):
        story = (
            self._fecha() +
            self._empresa_sede() +
            self._direccion() +
            self._tecnico_y_motivo() +
            self._materiales_section() +
            self._hallazgos_section() +
            self._firma_section()
        )
        self.doc.build(story, onFirstPage=self._header_footer,
                       onLaterPages=self._header_footer)


def generar_pdf_fpdf(reporte: dict, empresa: str, sede: str,
                     sede_direccion: str, tecnico: str, email_tec: str) -> io.BytesIO:
    pdf = ReportePDF(buf := io.BytesIO(), reporte, empresa, sede,
                     sede_direccion, tecnico, email_tec)
    pdf.build()
    buf.seek(0)
    return buf
