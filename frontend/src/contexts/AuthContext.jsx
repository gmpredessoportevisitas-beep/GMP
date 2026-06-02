import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarPerfil = useCallback(async (s) => {
    if (!s?.access_token) {
      setPerfil(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${s.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPerfil(data);
        setError('');
      } else {
        // Token valido en Supabase pero backend no lo acepto
        // Posible causa: perfil no existe en tabla "perfiles" o backend caido
        if (res.status === 403) {
          setError('Tu usuario no tiene un perfil asignado. Contacta al administrador.');
        } else {
          setError('No se pudo conectar con el servidor. Verifica que el backend este corriendo.');
        }
        setPerfil(null);
      }
    } catch {
      setError('No se pudo conectar con el servidor (¿esta corriendo backend en ' + API_URL + '?)');
      setPerfil(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      if (session) cargarPerfil(session);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) cargarPerfil(session);
      else { setPerfil(null); setLoading(false); setError(''); }
    });

    return () => { cancelled = true; listener.subscription.unsubscribe(); };
  }, [cargarPerfil]);

  async function login(email, password) {
    setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) throw err;
    return data;
  }

  async function logout() {
    await supabase.auth.signOut();
    setPerfil(null);
    setSession(null);
    setError('');
  }

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  }

  return (
    <AuthContext.Provider value={{ session, perfil, loading, error, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
