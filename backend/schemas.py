from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
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
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    nombre_completo: str = Field(..., min_length=1, max_length=255)
    rol: str = Field(..., pattern="^(admin|tecnico)$")


class ReporteCreate(BaseModel):
    empresa_id: int
    sede_id: int
    observaciones: str = Field(default="", max_length=5000)
    firma_vector: str = Field(default="", max_length=50000)
