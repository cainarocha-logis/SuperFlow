import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserCheck, Mail, Lock, ArrowLeft, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';

export const FirstAccess = () => {
  const navigate = useNavigate();
  const { logoUrl } = useSettings();
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      // 1. Verificar se o e-mail está na lista autorizada
      const { data: authData, error: authError } = await supabase
        .from('authorized_emails')
        .select('*')
        .eq('email', formData.email.toLowerCase())
        .single();

      if (authError || !authData) {
        throw new Error('E-mail não autorizado. Entre em contato com o administrador.');
      }

      if (authData.registered_at) {
        throw new Error('Este usuário já possui acesso cadastrado.');
      }

      // 2. Criar a conta no Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: formData.password,
        options: {
          data: {
            first_name: authData.first_name,
            last_name: authData.last_name,
            role: authData.role
          }
        }
      });

      if (signUpError) throw signUpError;

      // 3. Atualizar a tabela de autorização
      await supabase
        .from('authorized_emails')
        .update({ registered_at: new Date().toISOString() })
        .eq('email', formData.email.toLowerCase());

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gradient-primary" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="glass-panel-dark animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <UserCheck size={32} color="#15803d" />
          </div>
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>Conta Criada!</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>
            Seu acesso foi configurado com sucesso. Agora você já pode entrar no sistema.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'block', textDecoration: 'none' }}>
            IR PARA O LOGIN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-primary" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel-dark animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: '50px', marginBottom: '1rem' }} />}
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' }}>Primeiro Acesso</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>Ative sua conta e defina sua senha</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="input-label" style={{ color: 'white' }}>E-mail Cadastrado</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input 
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                required 
                placeholder="seu.email@empresa.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="input-label" style={{ color: 'white' }}>Criar Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                required 
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="input-label" style={{ color: 'white' }}>Confirmar Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                required 
                placeholder="Repita a senha"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Processando...' : 'ATIVAR CONTA'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
};
