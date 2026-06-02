from fastapi import APIRouter, Depends, HTTPException

from config import supabase
from schemas import EmpresaCreate, SedeCreate, UsuarioCreate
from deps import solo_admin
from utils import ahora_iso

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/empresas")
async def listar_empresas(admin: dict = Depends(solo_admin)):
    return supabase.table("empresas").select("*").order("nombre").execute().data


@router.post("/empresas", status_code=201)
async def crear_empresa(data: EmpresaCreate, admin: dict = Depends(solo_admin)):
    row = data.model_dump()
    row["creado_en"] = ahora_iso()
    return supabase.table("empresas").insert(row).execute().data[0]


@router.put("/empresas/{empresa_id}")
async def editar_empresa(empresa_id: int, data: EmpresaCreate, admin: dict = Depends(solo_admin)):
    result = supabase.table("empresas").update(data.model_dump()).eq("id", empresa_id).execute()
    if not result.data:
        raise HTTPException(404, "Empresa no encontrada")
    return result.data[0]


@router.delete("/empresas/{empresa_id}")
async def eliminar_empresa(empresa_id: int, admin: dict = Depends(solo_admin)):
    supabase.table("empresas").delete().eq("id", empresa_id).execute()
    return {"ok": True}


@router.get("/sedes")
async def listar_sedes(admin: dict = Depends(solo_admin)):
    return supabase.table("sedes").select("*, empresas(nombre)").order("nombre").execute().data


@router.post("/sedes", status_code=201)
async def crear_sede(data: SedeCreate, admin: dict = Depends(solo_admin)):
    row = data.model_dump()
    row["creado_en"] = ahora_iso()
    return supabase.table("sedes").insert(row).execute().data[0]


@router.put("/sedes/{sede_id}")
async def editar_sede(sede_id: int, data: SedeCreate, admin: dict = Depends(solo_admin)):
    result = supabase.table("sedes").update(data.model_dump()).eq("id", sede_id).execute()
    if not result.data:
        raise HTTPException(404, "Sede no encontrada")
    return result.data[0]


@router.delete("/sedes/{sede_id}")
async def eliminar_sede(sede_id: int, admin: dict = Depends(solo_admin)):
    supabase.table("sedes").delete().eq("id", sede_id).execute()
    return {"ok": True}


@router.get("/usuarios")
async def listar_usuarios(admin: dict = Depends(solo_admin)):
    return supabase.table("perfiles").select("*").order("nombre_completo").execute().data


@router.post("/usuarios", status_code=201)
async def crear_usuario(data: UsuarioCreate, admin: dict = Depends(solo_admin)):
    auth_resp = supabase.auth.admin.create_user({
        "email": data.email,
        "password": data.password,
        "email_confirm": True,
        "user_metadata": {"nombre_completo": data.nombre_completo, "rol": data.rol},
    })
    if not auth_resp.user:
        raise HTTPException(500, "Error al crear usuario en Auth.")

    user_id = auth_resp.user.id
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


@router.put("/usuarios/{user_id}")
async def editar_usuario(user_id: str, data: UsuarioCreate, admin: dict = Depends(solo_admin)):
    supabase.table("perfiles").update({
        "nombre_completo": data.nombre_completo,
        "rol": data.rol,
    }).eq("id", user_id).execute()
    return {"ok": True}


@router.put("/usuarios/{user_id}/toggle")
async def toggle_usuario(user_id: str, admin: dict = Depends(solo_admin)):
    perfil = supabase.table("perfiles").select("activo").eq("id", user_id).execute()
    if not perfil.data:
        raise HTTPException(404, "Usuario no encontrado")
    nuevo = not perfil.data[0]["activo"]
    supabase.table("perfiles").update({"activo": nuevo}).eq("id", user_id).execute()
    return {"activo": nuevo}
