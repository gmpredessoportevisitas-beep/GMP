import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import TecnicoView from './components/TecnicoView';
import AdminDashboard from './components/AdminDashboard';

function AppContent() {
  const { session, perfil, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session || !perfil) return <Login />;

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
