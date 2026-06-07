import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EncuestaPregunta } from '../../types';
import Logo from '../../assets/logo.svg';

const API = import.meta.env.VITE_API_URL ?? '';

export default function EncuestaPublica() {
  const { token } = useParams<{ token: string }>();
  const [preguntas, setPreguntas] = useState<EncuestaPregunta[]>([]);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState<{ empresa: string; sede: string; fecha: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/encuesta/${token}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Enlace no válido');
        }
        const data = await res.json();
        if (data.completada) {
          setResultado('completada');
          return;
        }
        setInfo({ empresa: data.empresa || '', sede: data.sede || '', fecha: data.fecha || '' });
        setPreguntas(data.preguntas || []);
        const inicial: Record<number, number> = {};
        (data.preguntas || []).forEach((p: EncuestaPregunta) => { inicial[p.id] = 0; });
        setRespuestas(inicial);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const sinResponder = Object.values(respuestas).some(v => v === 0);
    if (sinResponder) {
      setError('Por favor responde todas las preguntas.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const body = {
        observaciones,
        respuestas: Object.entries(respuestas).map(([pid, val]) => ({
          pregunta_id: parseInt(pid),
          valor: val,
        })),
      };
      const res = await fetch(`${API}/api/encuesta/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Error al enviar la encuesta');
      }
      setResultado('exito');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  function setValor(preguntaId: number, valor: number) {
    setRespuestas(prev => ({ ...prev, [preguntaId]: valor }));
  }

  const estrellas = [1, 2, 3, 4, 5];
  const labels = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (resultado === 'completada') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full animate-fade-in border border-gray-100">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Encuesta Completada</h2>
          <p className="text-gray-500 text-sm">Esta encuesta ya fue completada anteriormente.</p>
        </div>
      </div>
    );
  }

  if (resultado === 'exito') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full animate-fade-in border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Gracias por tu Opinion</h2>
          <p className="text-gray-500 text-sm">Tu encuesta ha sido registrada exitosamente.</p>
        </div>
      </div>
    );
  }

  if (error && !preguntas.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full animate-fade-in border border-gray-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 max-w-lg w-full animate-fade-in border border-gray-100">
        <div className="text-center mb-6">
          <img src={Logo} alt="GMP Redes" className="h-8 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800">Encuesta de Satisfaccion</h1>
          {info && (
            <div className="text-sm text-gray-500 mt-1">
              {info.empresa && <span className="font-medium text-gray-600">{info.empresa}</span>}
              {info.empresa && info.sede && <span> — </span>}
              {info.sede && <span>{info.sede}</span>}
              {info.fecha && <span className="block text-xs text-gray-400 mt-0.5">{info.fecha}</span>}
            </div>
          )}
        </div>

        <form onSubmit={enviar} className="space-y-6">
          {preguntas.map((p, idx) => (
            <div key={p.id} className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {idx + 1}. {p.texto}
              </p>
              <div className="flex justify-center gap-1">
                {estrellas.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setValor(p.id, v)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all text-xl ${
                      (respuestas[p.id] ?? 0) >= v
                        ? 'text-yellow-400 scale-110'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                    title={labels[v - 1]}
                  >
                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                ))}
              </div>
              {(respuestas[p.id] ?? 0) > 0 && (
                <p className="text-center text-xs text-gray-500 mt-1">{labels[(respuestas[p.id] ?? 0) - 1]}</p>
              )}
            </div>
          ))}

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Observaciones adicionales
            </label>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
              rows={3} maxLength={2000} placeholder="Comentarios o sugerencias (opcional)..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white resize-none transition-shadow text-sm" />
          </div>

          {error && (
            <div className="p-3 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <button type="submit" disabled={enviando}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all active:scale-[0.97] shadow-md ${
              enviando
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg'
            }`}>
            {enviando ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Enviando...
              </span>
            ) : (
              'Enviar Encuesta'
            )}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">GMP Redes — Sistema de Gestion</p>
      </div>
    </div>
  );
}