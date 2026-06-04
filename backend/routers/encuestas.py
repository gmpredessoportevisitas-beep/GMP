from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from config import supabase
from schemas import EncuestaCreate, EncuestaPreguntaCreate
from deps import get_usuario_actual, solo_admin
from utils import ahora_iso

router = APIRouter(prefix="/api", tags=["encuestas"])


@router.get("/encuesta-preguntas")
async def listar_preguntas():
    result = (supabase.table("encuesta_preguntas")
              .select("*")
              .eq("activa", True)
              .order("orden")
              .execute())
    return result.data


@router.get("/admin/encuesta-preguntas")
async def listar_preguntas_admin(admin: dict = Depends(solo_admin)):
    result = (supabase.table("encuesta_preguntas")
              .select("*")
              .order("orden")
              .execute())
    return result.data


@router.post("/admin/encuesta-preguntas", status_code=201)
async def crear_pregunta(data: EncuestaPreguntaCreate, admin: dict = Depends(solo_admin)):
    row = data.model_dump()
    row["creado_en"] = ahora_iso()
    return supabase.table("encuesta_preguntas").insert(row).execute().data[0]


@router.put("/admin/encuesta-preguntas/{pregunta_id}")
async def editar_pregunta(pregunta_id: int, data: EncuestaPreguntaCreate, admin: dict = Depends(solo_admin)):
    result = supabase.table("encuesta_preguntas").update(data.model_dump()).eq("id", pregunta_id).execute()
    if not result.data:
        raise HTTPException(404, "Pregunta no encontrada")
    return result.data[0]


@router.delete("/admin/encuesta-preguntas/{pregunta_id}")
async def eliminar_pregunta(pregunta_id: int, admin: dict = Depends(solo_admin)):
    supabase.table("encuesta_preguntas").delete().eq("id", pregunta_id).execute()
    return {"ok": True}


@router.post("/reportes/{reporte_id}/encuesta", status_code=201)
async def crear_encuesta(reporte_id: int, data: EncuestaCreate):
    reporte = supabase.table("reportes").select("id").eq("id", reporte_id).execute()
    if not reporte.data:
        raise HTTPException(404, "Reporte no encontrado")

    existente = supabase.table("encuestas_satisfaccion").select("id").eq("reporte_id", reporte_id).execute()
    if existente.data:
        raise HTTPException(400, "Este reporte ya tiene una encuesta registrada")

    encuesta = (supabase.table("encuestas_satisfaccion")
                .insert({
                    "reporte_id": reporte_id,
                    "observaciones": data.observaciones,
                    "creado_en": ahora_iso(),
                })
                .execute())
    encuesta_id = encuesta.data[0]["id"]

    respuestas = []
    for r in data.respuestas:
        pregunta = supabase.table("encuesta_preguntas").select("id").eq("id", r.pregunta_id).eq("activa", True).execute()
        if not pregunta.data:
            continue
        respuestas.append({
            "encuesta_id": encuesta_id,
            "pregunta_id": r.pregunta_id,
            "valor": r.valor,
            "creado_en": ahora_iso(),
        })

    if respuestas:
        supabase.table("encuesta_respuestas").insert(respuestas).execute()

    return {"mensaje": "Encuesta registrada exitosamente", "encuesta_id": encuesta_id}


@router.get("/reportes/{reporte_id}/encuesta")
async def obtener_encuesta(reporte_id: int, usuario: dict = Depends(get_usuario_actual)):
    encuesta = (supabase.table("encuestas_satisfaccion")
                .select("*")
                .eq("reporte_id", reporte_id)
                .execute())
    if not encuesta.data:
        raise HTTPException(404, "Encuesta no encontrada")

    respuestas = (supabase.table("encuesta_respuestas")
                  .select("*, encuesta_preguntas(texto, orden)")
                  .eq("encuesta_id", encuesta.data[0]["id"])
                  .order("pregunta_id")
                  .execute())

    return {
        "encuesta": encuesta.data[0],
        "respuestas": respuestas.data,
    }


@router.get("/encuestas")
async def listar_encuestas(
    limit: int = 100,
    offset: int = 0,
    usuario: dict = Depends(solo_admin),
):
    result = (supabase.table("encuestas_satisfaccion")
              .select("*, reportes(id, fecha_hora, empresas(nombre), sedes(nombre))")
              .order("creado_en", desc=True)
              .range(offset, offset + limit - 1)
              .execute())
    return result.data
