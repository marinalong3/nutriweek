import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import MenuPage from './pages/MenuPage';
import ShoppingListPage from './pages/ShoppingListPage';
import PlansPage from './pages/PlansPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Carregando...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: 'Poppins, sans-serif', borderRadius: '12px' },
          success: { iconTheme: { primary: '#4CAF50', secondary: '#fff' } }
        }} />
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/cadastro" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/planos" element={<PlansPage />} />

          {/* Privadas */}
          <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/cardapio/:id" element={<PrivateRoute><MenuPage /></PrivateRoute>} />
          <Route path="/lista/:id" element={<PrivateRoute><ShoppingListPage /></PrivateRoute>} />
          <Route path="/perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/favoritos" element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
