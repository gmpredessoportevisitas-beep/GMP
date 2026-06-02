from fastapi import APIRouter, Depends, HTTPException
import httpx

from config import SUPABASE_URL, SUPABASE_ANON_KEY, supabase
from schemas import LoginRequest
from deps import get_usuario_actual

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def login(data: LoginRequest):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                },
                json={"email": data.email, "password": data.password},
            )
        if resp.status_code != 200:
            raise HTTPException(401, "Email o contrasena incorrectos.")
        auth_data = resp.json()
        token = auth_data["access_token"]
        user_id = auth_data["user"]["id"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al autenticar: {str(e)}")

    result = supabase.table("perfiles").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(403, "Perfil no encontrado. Contacta al administrador.")

    perfil = result.data[0]
    if not perfil.get("activo", False):
        raise HTTPException(403, "Cuenta desactivada.")

    return {"access_token": token, "perfil": perfil}


@router.get("/me")
async def mi_perfil(usuario: dict = Depends(get_usuario_actual)):
    return usuario
