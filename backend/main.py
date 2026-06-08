"""
GMP v2 Backend - API de Reportes con Control de Roles
FastAPI + Supabase + JWT Auth + fpdf2

Alejandro Álvarez Patiño - 2026
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import FRONTEND_URL
from routers import auth, admin, catalogos, reportes, encuestas

app = FastAPI(
    title="GMP v2 - Gestion de Mantenimiento Preventivo",
    version="2.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(catalogos.router)
app.include_router(reportes.router)
app.include_router(encuestas.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
