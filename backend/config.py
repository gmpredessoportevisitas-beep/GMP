import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://app.gmpredes.online").rstrip("/")

for var, name in [
    (SUPABASE_URL, "SUPABASE_URL"),
    (SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
    (SUPABASE_ANON_KEY, "SUPABASE_ANON_KEY"),
]:
    if not var:
        raise RuntimeError(f"Variable de entorno {name} es obligatoria.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
