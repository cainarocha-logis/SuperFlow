import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Mail, Trash2, Shield, CheckCircle, Edit2, X, Save } from 'lucide-react';
import type { Tables } from '../types/database.types';

export const UserManagement = () => {
  const [emails, setEmails] = useState<Tables<'authorized_emails'>[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<Tables<'branches'>[]>([]);
  const [costCenters, setCostCenters] = useState<Tables<'cost_centers'>[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState({ email: '', first_name: '', last_name: '', role: 'LANCADOR' as Tables<'users'>['role'] });
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [editingUser, setEditingUser] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [authRes, usersRes, branchesRes, ccRes] = await Promise.all([
      supabase.from('authorized_emails').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('*, user_branches(branch_id), user_cost_centers(cost_center_id)').order('first_name'),
      supabase.from('branches').select('*').order('name'),
      supabase.from('cost_centers').select('*').order('name')
    ]);
    
    setEmails(authRes.data || []);
    setUsers(usersRes.data || []);
    setBranches(branchesRes.data || []);
    setCostCenters(ccRes.data || []);
    setLoading(false);
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase.from('authorized_emails').insert([newEmail]);
      if (error) throw error;
      setMessage({ text: 'Usuário autorizado com sucesso! Ele já pode se cadastrar.', type: 'success' });
      setNewEmail({ email: '', first_name: '', last_name: '', role: 'LANCADOR' });
      fetchData();
    } catch (err: any) {
      setMessage({ text: 'Erro ao autorizar: ' + err.message, type: 'error' });
    }
  };

  const handleDeleteInvite = async (email: string) => {
    if (!window.confirm('Remover autorização deste e-mail?')) return;
    await supabase.from('authorized_emails').delete().eq('email', email);
    fetchData();
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      // 1. Update user
      await supabase.from('users').update({
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        role: editingUser.role,
        status: editingUser.status
      }).eq('id', editingUser.id);

      // 2. Update authorized_emails if exists
      await supabase.from('authorized_emails').update({
        role: editingUser.role
      }).eq('email', editingUser.email);

      // 3. Update branches
      await supabase.from('user_branches').delete().eq('user_id', editingUser.id);
      if (editingUser.selectedBranches.length > 0) {
        await supabase.from('user_branches').insert(
          editingUser.selectedBranches.map((b_id: string) => ({ user_id: editingUser.id, branch_id: b_id }))
        );
      }

      // 4. Update cost centers
      await supabase.from('user_cost_centers').delete().eq('user_id', editingUser.id);
      if (editingUser.selectedCCs.length > 0) {
        await supabase.from('user_cost_centers').insert(
          editingUser.selectedCCs.map((cc_id: string) => ({ user_id: editingUser.id, cost_center_id: cc_id }))
        );
      }

      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser({
      ...user,
      selectedBranches: user.user_branches.map((ub: any) => ub.branch_id),
      selectedCCs: user.user_cost_centers.map((ucc: any) => ucc.cost_center_id)
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'white' }}>
        <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={20} color="var(--primary-dark)" /> Convidar Novo Usuário
        </h3>
        
        <form onSubmit={handleAddEmail} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="input-label">E-mail</label>
            <input type="email" className="input-field" required value={newEmail.email} onChange={e => setNewEmail({...newEmail, email: e.target.value.toLowerCase()})} placeholder="exemplo@empresa.com" />
          </div>
          <div>
            <label className="input-label">Nome</label>
            <input type="text" className="input-field" required value={newEmail.first_name} onChange={e => setNewEmail({...newEmail, first_name: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Sobrenome</label>
            <input type="text" className="input-field" required value={newEmail.last_name} onChange={e => setNewEmail({...newEmail, last_name: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Cargo</label>
            <select className="input-field" value={newEmail.role} onChange={e => setNewEmail({...newEmail, role: e.target.value as any})}>
              <option value="LANCADOR">Lançador</option>
              <option value="GERENTE">Gerente</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.875rem' }}>
            AUTORIZAR
          </button>
        </form>

        {message.text && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#15803d' : '#b91c1c', fontSize: '0.875rem', fontWeight: 600 }}>
            {message.text}
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '0', backgroundColor: 'white', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontWeight: 800, margin: 0, fontSize: '1.125rem' }}>Usuários Registrados</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Gerencie acessos e permissões de quem já acessou o sistema.</p>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Usuário</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Cargo</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Acesso Limitado</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</td></tr>
              ) : users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{user.first_name} {user.last_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {user.email}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '1rem', backgroundColor: user.role === 'ADMIN' ? '#fef3c7' : user.role === 'GERENTE' ? '#f3e8ff' : '#e0f2fe', color: user.role === 'ADMIN' ? '#92400e' : user.role === 'GERENTE' ? '#7e22ce' : '#0369a1' }}>
                      <Shield size={10} /> {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {user.status === 'ATIVO' ? (
                      <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Ativo</span>
                    ) : (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>Inativo</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.75rem', color: '#475569' }}>
                    {user.user_branches.length > 0 || user.user_cost_centers.length > 0 ? (
                      <div>
                        {user.user_branches.length} Filial(is) <br/>
                        {user.user_cost_centers.length} Centro(s)
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Acesso Total / Padrão</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => openEditModal(user)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.5rem' }}>
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', backgroundColor: 'white', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontWeight: 800, margin: 0, fontSize: '1.125rem' }}>Convites Pendentes</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {emails.filter(e => !e.registered_at).length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nenhum convite pendente.</td></tr>
              ) : emails.filter(e => !e.registered_at).map(item => (
                <tr key={item.email} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.first_name} {item.last_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.email}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>{item.role}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => handleDeleteInvite(item.email)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO DE USUÁRIO */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Editar Permissões</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Nome</label>
                  <input type="text" className="input-field" value={editingUser.first_name} onChange={e => setEditingUser({...editingUser, first_name: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Sobrenome</label>
                  <input type="text" className="input-field" value={editingUser.last_name} onChange={e => setEditingUser({...editingUser, last_name: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Cargo</label>
                  <select className="input-field" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                    <option value="LANCADOR">Lançador</option>
                    <option value="GERENTE">Gerente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Status da Conta</label>
                  <select className="input-field" value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value})}>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO (Bloqueado)</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>Vínculo de Filiais</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Se nenhuma for selecionada, o usuário tem acesso padrão a todas.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {branches.map(b => (
                    <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                      <input 
                        type="checkbox" 
                        checked={editingUser.selectedBranches.includes(b.id)}
                        onChange={(e) => {
                          const newB = e.target.checked 
                            ? [...editingUser.selectedBranches, b.id]
                            : editingUser.selectedBranches.filter((id: string) => id !== b.id);
                          setEditingUser({...editingUser, selectedBranches: newB});
                        }}
                      />
                      {b.name}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>Vínculo de Centros de Custo</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {costCenters.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                      <input 
                        type="checkbox" 
                        checked={editingUser.selectedCCs.includes(c.id)}
                        onChange={(e) => {
                          const newC = e.target.checked 
                            ? [...editingUser.selectedCCs, c.id]
                            : editingUser.selectedCCs.filter((id: string) => id !== c.id);
                          setEditingUser({...editingUser, selectedCCs: newC});
                        }}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', gap: '1rem' }}>
              <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', backgroundColor: 'white', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleSaveUser} className="btn-primary" style={{ flex: 2, padding: '1rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
