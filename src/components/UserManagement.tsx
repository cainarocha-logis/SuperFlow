import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Mail, Trash2, Shield, CheckCircle } from 'lucide-react';
import type { Tables } from '../types/database.types';

export const UserManagement = () => {
  const [emails, setEmails] = useState<Tables<'authorized_emails'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState({ email: '', first_name: '', last_name: '', role: 'LANCADOR' as Tables<'authorized_emails'>['role'] });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('authorized_emails')
      .select('*')
      .order('created_at', { ascending: false });
    setEmails(data || []);
    setLoading(false);
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase
        .from('authorized_emails')
        .insert([newEmail]);

      if (error) throw error;

      setMessage({ text: 'Usuário autorizado com sucesso!', type: 'success' });
      setNewEmail({ email: '', first_name: '', last_name: '', role: 'LANCADOR' });
      fetchEmails();
    } catch (err: any) {
      setMessage({ text: 'Erro ao autorizar: ' + err.message, type: 'error' });
    }
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm('Remover autorização deste e-mail?')) return;
    await supabase.from('authorized_emails').delete().eq('email', email);
    fetchEmails();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'white' }}>
        <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={20} color="var(--primary-dark)" /> Autorizar Novo Usuário
        </h3>
        
        <form onSubmit={handleAddEmail} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="input-label">E-mail</label>
            <input 
              type="email" 
              className="input-field" 
              required 
              value={newEmail.email}
              onChange={e => setNewEmail({...newEmail, email: e.target.value.toLowerCase()})}
              placeholder="exemplo@empresa.com"
            />
          </div>
          <div>
            <label className="input-label">Nome</label>
            <input 
              type="text" 
              className="input-field" 
              required 
              value={newEmail.first_name}
              onChange={e => setNewEmail({...newEmail, first_name: e.target.value})}
            />
          </div>
          <div>
            <label className="input-label">Sobrenome</label>
            <input 
              type="text" 
              className="input-field" 
              required 
              value={newEmail.last_name}
              onChange={e => setNewEmail({...newEmail, last_name: e.target.value})}
            />
          </div>
          <div>
            <label className="input-label">Cargo</label>
            <select 
              className="input-field" 
              value={newEmail.role}
              onChange={e => setNewEmail({...newEmail, role: e.target.value as Tables<'authorized_emails'>['role']})}
            >
              <option value="LANCADOR">Lançador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.875rem' }}>
            AUTORIZAR
          </button>
        </form>

        {message.text && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#15803d' : '#b91c1c',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            {message.text}
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '0', backgroundColor: 'white', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontWeight: 800, margin: 0, fontSize: '1.125rem' }}>E-mails Autorizados</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Usuários nesta lista podem criar senha no primeiro acesso.</p>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Usuário</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Cargo</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</td></tr>
              ) : emails.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nenhum usuário autorizado.</td></tr>
              ) : (
                emails.map(item => (
                  <tr key={item.email} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.first_name} {item.last_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} /> {item.email}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        padding: '0.25rem 0.6rem', 
                        borderRadius: '1rem',
                        backgroundColor: item.role === 'ADMIN' ? '#fef3c7' : '#e0f2fe',
                        color: item.role === 'ADMIN' ? '#92400e' : '#0369a1'
                      }}>
                        <Shield size={10} /> {item.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {item.registered_at ? (
                        <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Ativo
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Pendente</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(item.email)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
