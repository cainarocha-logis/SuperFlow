import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const BranchManagement = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBranches = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('branches')
      .select('*')
      .order('name', { ascending: true });
    setBranches(data || []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.from('branches').insert({ name: newName.trim().toUpperCase(), status: 'ATIVO' });
      if (error) throw error;
      setNewName('');
      fetchBranches();
    } catch (err: any) {
      setErrorMsg('Erro detalhado: ' + (err.message || JSON.stringify(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await supabase.from('branches').update({ name: editName.trim().toUpperCase() }).eq('id', id);
    setEditingId(null);
    fetchBranches();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta filial?')) return;
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) {
      alert('Não foi possível excluir. O item pode estar sendo usado em alguma nota.');
    } else {
      fetchBranches();
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'white' }}>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Nome da Filial (Ex: Matriz, Filial 01...)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          disabled={isSubmitting}
        />
        <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '0 2rem' }} disabled={isSubmitting}>
          {isSubmitting ? 'SALVANDO...' : <><Plus size={18} /> ADICIONAR</>}
        </button>
      </form>

      {errorMsg && (
        <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? <p>Carregando...</p> : branches.map(branch => (
          <div key={branch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            {editingId === branch.id ? (
              <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                />
                <button onClick={() => handleUpdate(branch.id)} className="btn-primary" style={{ padding: '0.5rem' }}><Check size={18} /></button>
                <button onClick={() => setEditingId(null)} style={{ background: '#64748b', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'white' }}><X size={18} /></button>
              </div>
            ) : (
              <>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{branch.name}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => { setEditingId(branch.id); setEditName(branch.name); }}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.5rem' }}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(branch.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
