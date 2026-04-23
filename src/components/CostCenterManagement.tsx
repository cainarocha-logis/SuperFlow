import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const thStyle: React.CSSProperties = { padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, textAlign: 'left' };
const tdStyle: React.CSSProperties = { padding: '1rem', fontSize: '0.875rem' };

export const CostCenterManagement = () => {
  const [centers, setCenters] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    const { data, error } = await supabase.from('cost_centers').select('*').order('name');
    if (!error) setCenters(data || []);
  };

  const handleAdd = async () => {
    setError(null);
    if (!newName) return setError('Nome é obrigatório');
    
    try {
      const { error } = await supabase.from('cost_centers').insert([{ name: newName }]);
      if (error) throw error;
      
      setNewName('');
      setIsAdding(false);
      fetchCenters();
    } catch (err: any) {
      setError(err.message);
      alert('Erro ao salvar: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Centros de Custo</h3>
        <button onClick={() => { setIsAdding(true); setError(null); }} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer' }}>
          <Plus size={18} /> Novo Centro
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={thStyle}>Nome</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr style={{ backgroundColor: '#f0f9ff' }}>
                <td style={tdStyle}><input type="text" className="input-field" style={{ padding: '0.5rem' }} value={newName} onChange={e => setNewName(e.target.value)} autoFocus /></td>
                <td style={tdStyle}>ATIVO</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={handleAdd} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}><Check size={18} /></button>
                    <button onClick={() => setIsAdding(false)} style={{ background: '#64748b', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}><X size={18} /></button>
                  </div>
                </td>
              </tr>
            )}
            {centers.map(center => (
              <tr key={center.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>{center.name}</td>
                <td style={tdStyle}>{center.status}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <button onClick={async () => { await supabase.from('cost_centers').delete().eq('id', center.id); fetchCenters(); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
