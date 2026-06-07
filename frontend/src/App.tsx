import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/ui/Login'
import TecnicoView from './components/tecnico/TecnicoView';
import AdminDashboard from './components/admin/AdminDashboard';
import EncuestaPublica from './components/encuesta/EncuestaPublica';
import AnimatedWifiIcon from './assets/icons/AnimatedWifiIcon';
import { Analytics } from "@vercel/analytics/react"

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
      <Toaster richColors position="top-right" />
      <Analytics />
      <Routes>
        <Route path="/encuesta/:token" element={<EncuestaPublica />} />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </AuthProvider>
  );
}