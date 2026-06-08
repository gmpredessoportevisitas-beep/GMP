from fastapi import APIRouter, Depends, HTTPException, Response

from config import FRONTEND_URL, supabase, auth_client
from schemas import LoginRequest
from deps import get_usuario_actual

router = APIRouter(prefix="/api/auth", tags=["auth"])

COOKIE_MAX_AGE = 60 * 60 * 24  # 24 horas
COOKIE_NAME = "gmp_token"


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=FRONTEND_URL.startswith("https"),
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


@router.post("/login")
def login(data: LoginRequest, response: Response):
    try:
        email = f"{data.username.strip()}@gmp.com"
        auth_resp = auth_client.sign_in_with_password({
            "email": email,
            "password": data.password,
        })
        token = auth_resp.session.access_token
        user_id = str(auth_resp.user.id)
    except Exception as e:
        msg = str(e).lower()
        if "invalid" in msg or "400" in msg:
            raise HTTPException(401, "Usuario o contrasena incorrectos.")
        raise HTTPException(500, f"Error al autenticar: {str(e)}")

    result = supabase.table("perfiles").select("id, nombre_completo, username, email, rol, activo, creado_en").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(403, "Perfil no encontrado. Contacta al administrador.")

    perfil = result.data[0]
    if not perfil.get("activo", False):
        raise HTTPException(403, "Cuenta desactivada.")

    _set_cookie(response, token)
    return {"perfil": perfil}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me")
async def mi_perfil(usuario: dict = Depends(get_usuario_actual)):
    return usuario