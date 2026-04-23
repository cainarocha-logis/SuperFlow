import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
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
    try {
      const { error } = await supabase.from('expense_types').insert({ name: newName.trim().toUpperCase() });
      if (error) throw error;
      setNewName('');
      fetchTypes();
    } catch (err: any) {
      alert('Erro ao adicionar categoria: ' + err.message);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await supabase.from('expense_types').update({ name: editName.trim().toUpperCase() }).eq('id', id);
    setEditingId(null);
    fetchTypes();
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
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Nome da Categoria (Ex: Combustível, Pedágio...)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '0 2rem' }}>
          <Plus size={18} /> ADICIONAR
        </button>
      </form>

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
                />
                <button onClick={() => handleUpdate(type.id)} className="btn-primary" style={{ padding: '0.5rem' }}><Check size={18} /></button>
                <button onClick={() => setEditingId(null)} style={{ background: '#64748b', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'white' }}><X size={18} /></button>
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
