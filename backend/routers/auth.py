import json
from urllib.request import Request, urlopen
from urllib.error import URLError

from fastapi import APIRouter, Depends, HTTPException

from config import SUPABASE_URL, SUPABASE_ANON_KEY, supabase
from schemas import LoginRequest
from deps import get_usuario_actual

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(data: LoginRequest):
    if not SUPABASE_ANON_KEY:
        raise HTTPException(500, "SUPABASE_ANON_KEY no configurada en el servidor.")
    try:
        email = f"{data.username.strip()}@gmp.com"
        body = json.dumps({"email": email, "password": data.password}).encode()
        req = Request(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            data=body,
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Content-Type": "application/json",
            },
        )
        resp = urlopen(req)
        auth_data = json.loads(resp.read().decode())
        token = auth_data["access_token"]
        user_id = auth_data["user"]["id"]
    except HTTPException:
        raise
    except URLError:
        raise HTTPException(401, "Usuario o contrasena incorrectos.")
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
