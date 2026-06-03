from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


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
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    nombre_completo: str = Field(..., min_length=1, max_length=255)
    rol: str = Field(..., pattern="^(admin|tecnico)$")


class EncuestaRespuestaItem(BaseModel):
    pregunta_id: int
    valor: int = Field(..., ge=1, le=5)


class ReporteCreate(BaseModel):
    empresa_id: int
    sede_id: int
    nombre_asesor: str = Field(default="", max_length=255)
    telefono_asesor: str = Field(default="", max_length=50)
    hallazgos: str = Field(default="", max_length=5000)
    uso_materiales: bool = False
    materiales_detalle: str = Field(default="", max_length=2000)
    motivo_visita: str = Field(default="soporte", max_length=50)
    motivo_visita_otro: str = Field(default="", max_length=255)
    firma_vector: str = Field(default="", max_length=50000)
    encuesta_observaciones: str = Field(default="", max_length=2000)
    encuesta_respuestas: list[EncuestaRespuestaItem] = []


class EncuestaCreate(BaseModel):
    observaciones: str = Field(default="", max_length=2000)
    respuestas: list[EncuestaRespuestaItem]
