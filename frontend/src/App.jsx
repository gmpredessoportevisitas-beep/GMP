import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import TecnicoView from './components/TecnicoView';
import AdminDashboard from './components/AdminDashboard';

function AppContent() {
  const { session, perfil, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/30">
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session || !perfil) {
    return <Login errorInicial={error} />;
  }

  if (perfil.rol === 'admin') return <AdminDashboard />;

  return <TecnicoView />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
