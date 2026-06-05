from typing import Optional
from fastapi import APIRouter, Depends

from config import supabase
from deps import get_usuario_actual

router = APIRouter(prefix="/api/catalogos", tags=["catalogos"])


@router.get("/empresas")
async def catalogos_empresas(usuario: dict = Depends(get_usuario_actual)):
    return supabase.table("empresas").select("id, nombre").order("nombre").execute().data


@router.get("/sedes")
async def catalogos_sedes(empresa_id: Optional[int] = None, usuario: dict = Depends(get_usuario_actual)):
    q = supabase.table("sedes").select("id, nombre, ciudad, empresa_id, direccion").order("nombre")
    if empresa_id:
        q = q.eq("empresa_id", empresa_id)
    return q.execute().data
