from fastapi import Cookie, Depends, Header, HTTPException
from config import supabase


async def get_usuario_actual(
    authorization: str = Header(default=""),
    gmp_token: str = Cookie(default=""),
) -> dict:
    token = ""
    if authorization:
        token = authorization.replace("Bearer ", "")
    elif gmp_token:
        token = gmp_token

    if not token:
        raise HTTPException(401, "No autenticado.")

    try:
        user_resp = supabase.auth.get_user(token)
        if not user_resp.user:
            raise HTTPException(401, "Token invalido o expirado.")
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if "expired" in msg.lower() or "JWT" in msg:
            raise HTTPException(401, "Token expirado. Inicia sesion nuevamente.")
        raise HTTPException(401, f"Token invalido: {msg}")

    user_id = user_resp.user.id
    result = supabase.table("perfiles").select("id, nombre_completo, username, email, rol, activo, creado_en").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(403, "Perfil no encontrado. Contacta al administrador.")
    perfil = result.data[0]
    if not perfil.get("activo", False):
        raise HTTPException(403, "Cuenta desactivada.")
    return perfil


def solo_admin(usuario: dict = Depends(get_usuario_actual)) -> dict:
    if usuario.get("rol") != "admin":
        raise HTTPException(403, "Accion reservada a administradores.")
    return usuario