import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const ExpenseTypeManagement = () => {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchTypes();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTypes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('expense_types')
      .select('*')
      .order('name', { ascending: true });
    setTypes(data || []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.from('expense_types').insert({ name: newName.trim().toUpperCase(), status: 'ATIVO' });
      if (error) throw error;
      setNewName('');
      fetchTypes();
    } catch (err: any) {
      setErrorMsg('Erro detalhado: ' + (err.message || JSON.stringify(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('expense_types')
        .update({ name: editName.trim().toUpperCase() })
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('A alteração não foi aplicada. Verifique se você tem permissão.');
      
      setEditingId(null);
      await fetchTypes();
    } catch (err: any) {
      setErrorMsg('Erro ao atualizar categoria: ' + (err.message || JSON.stringify(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta categoria?')) return;
    const { error } = await supabase.from('expense_types').delete().eq('id', id);
    if (error) {
      alert('Não foi possível excluir. O item pode estar sendo usado em alguma nota.');
    } else {
      fetchTypes();
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Nome da Categoria (Ex: Combustível, Pedágio...)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          disabled={isSubmitting}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleAdd(e as any);
            }
          }}
        />
        <button type="button" onClick={handleAdd} className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '0 2rem' }} disabled={isSubmitting}>
          {isSubmitting ? 'SALVANDO...' : <><Plus size={18} /> ADICIONAR</>}
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? <p>Carregando...</p> : types.map(type => (
          <div key={type.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            {editingId === type.id ? (
              <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                  disabled={isSubmitting}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleUpdate(type.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
                <button onClick={() => handleUpdate(type.id)} className="btn-primary" style={{ padding: '0.5rem' }} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                </button>
                <button onClick={() => setEditingId(null)} style={{ background: '#64748b', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'white' }} disabled={isSubmitting}><X size={18} /></button>
              </div>
            ) : (
              <>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{type.name}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => { setEditingId(type.id); setEditName(type.name); }}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.5rem' }}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(type.id)}
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
