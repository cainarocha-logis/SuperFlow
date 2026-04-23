import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const CostCenterManagement = () => {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cost_centers')
      .select('*')
      .order('name', { ascending: true });
    setCenters(data || []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const { error } = await supabase.from('cost_centers').insert({ name: newName.trim().toUpperCase() });
      if (error) throw error;
      setNewName('');
      fetchCenters();
    } catch (err: any) {
      alert('Erro ao adicionar centro de custo: ' + err.message);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await supabase.from('cost_centers').update({ name: editName.trim().toUpperCase() }).eq('id', id);
    setEditingId(null);
    fetchCenters();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este centro de custo?')) return;
    const { error } = await supabase.from('cost_centers').delete().eq('id', id);
    if (error) {
      alert('Não foi possível excluir. O item pode estar sendo usado em alguma nota.');
    } else {
      fetchCenters();
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'white' }}>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Nome do Centro de Custo (Ex: TI, RH...)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '0 2rem' }}>
          <Plus size={18} /> ADICIONAR
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? <p>Carregando...</p> : centers.map(center => (
          <div key={center.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            {editingId === center.id ? (
              <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                />
                <button onClick={() => handleUpdate(center.id)} className="btn-primary" style={{ padding: '0.5rem' }}><Check size={18} /></button>
                <button onClick={() => setEditingId(null)} style={{ background: '#cbd5e1', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}><X size={18} /></button>
              </div>
            ) : (
              <>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{center.name}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => { setEditingId(center.id); setEditName(center.name); }}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.5rem' }}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(center.id)}
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
