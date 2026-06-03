import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import TecnicoView from './components/TecnicoView';
import AdminDashboard from './components/AdminDashboard';
import AnimatedWifiIcon from './assets/icons/AnimatedWifiIcon';

function AppContent() {
  const { perfil, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <AnimatedWifiIcon/>
      </div>
    );
  }

  if (!perfil) {
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
