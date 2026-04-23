import React, { useState, useEffect } from 'react';
import { LogIn, Truck, Lock, Mail } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export const Login = () => {
  const { user } = useAuth();
  const { logoUrl } = useSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se o usuário já estiver logado, joga para a Dashboard
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      // Quando o AuthContext for construído, ele fará o redirecionamento automático
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao fazer login. Verifique suas credenciais.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-primary" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel-dark animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: '64px', maxWidth: '180px', objectFit: 'contain', marginBottom: '1.5rem', marginInline: 'auto' }} />
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', marginBottom: '1rem' }}>
              <Truck size={32} color="var(--primary-light)" />
            </div>
          )}
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
            Super<span className="text-gradient" style={{ background: 'linear-gradient(135deg, #fff 0%, var(--primary-light) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Flow</span>
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>Controle de Prestação de Contas</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--status-rejected)', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="input-label" htmlFor="email" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }}>
                <Mail size={18} />
              </div>
              <input 
                id="email"
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white' }}
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="password" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }}>
                <Lock size={18} />
              </div>
              <input 
                id="password"
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                Entrando...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogIn size={18} /> Acessar Sistema
              </span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Ainda não tem acesso?</p>
          <Link to="/primeiro-acesso" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: '700', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Primeiro acesso? Clique aqui
          </Link>
        </div>

        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};
