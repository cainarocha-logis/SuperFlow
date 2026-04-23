import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Login } from './pages/Login';
import { LancadorDashboard } from './pages/LancadorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LancadorStats } from './pages/LancadorStats';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-light)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;

  if (requireAdmin && profile?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const DashboardRouter = () => {
  const { profile } = useAuth();
  if (profile?.role === 'ADMIN') return <AdminDashboard />;
  return <LancadorDashboard />;
};

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/lancador" element={<ProtectedRoute><LancadorDashboard /></ProtectedRoute>} />
            <Route path="/lancador/stats" element={<ProtectedRoute><LancadorStats /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
