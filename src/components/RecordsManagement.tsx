import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Search, Filter, Loader2, X, Eye, FileImage } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import type { Tables } from '../types/database.types';

export const RecordsManagement = ({ onViewRecord }: { onViewRecord: (record: any) => void }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*, users(first_name, last_name, email), branches(name), expense_types(name), expense_attachments(count)')
      .order('created_at', { ascending: false })
      .limit(500);
    setRecords(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa e o comprovante permanentemente? Essa ação não pode ser desfeita.')) return;
    
    try {
      // 1. Apagar anexo do storage
      const { data: attachments } = await supabase.from('expense_attachments').select('storage_path').eq('expense_id', id);
      if (attachments && attachments.length > 0) {
        await supabase.storage.from('receipts').remove(attachments.map(a => a.storage_path));
      }
      
      // 2. Apagar registro
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      
      fetchRecords();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = searchTerm === '' || 
      `${r.users?.first_name ?? ''} ${r.users?.last_name ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.expense_types?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'white', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f1f5f9', padding: '0.6rem 1rem', borderRadius: '0.5rem' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou categoria..."
            style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
          <option value="">Todos os Status</option>
          <option value="RASCUNHO">Rascunho</option>
          <option value="ENVIADO">Enviado</option>
          <option value="EM_ANALISE">Em Análise</option>
          <option value="APROVADO">Aprovado</option>
          <option value="REJEITADO">Rejeitado</option>
        </select>
        {(searchTerm || statusFilter) && (
          <button onClick={() => { setSearchTerm(''); setStatusFilter(''); }} style={{ border: 'none', background: '#fee2e2', color: '#b91c1c', padding: '0.6rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', backgroundColor: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Data / ID</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Colaborador</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Detalhes</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Valor</th>
              <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={24} color="var(--primary-light)" /></td></tr>
            ) : filteredRecords.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nenhum registro encontrado.</td></tr>
            ) : (
              filteredRecords.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.875rem' }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>{r.id.split('-')[0]}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.875rem' }}>{r.users?.first_name} {r.users?.last_name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{r.users?.email}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ color: '#475569', fontWeight: 600 }}>{r.expense_types?.name}</div>
                      {r.expense_attachments && (r.expense_attachments as any)[0]?.count > 0 && (
                        <div title="Possui comprovante anexo" style={{ color: '#0369a1', display: 'flex' }}>
                          <FileImage size={14} />
                        </div>
                      )}
                    </div>
                    <div style={{ color: '#94a3b8' }}>{r.branches?.name}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      backgroundColor: r.status === 'APROVADO' ? '#dcfce7' : r.status === 'REJEITADO' ? '#fee2e2' : '#f1f5f9', 
                      color: r.status === 'APROVADO' ? '#15803d' : r.status === 'REJEITADO' ? '#b91c1c' : '#475569',
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.7rem', 
                      fontWeight: 700 
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                    {formatCurrency(Number(r.amount || 0))}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button 
                      onClick={() => onViewRecord(r)} 
                      style={{ background: '#f1f5f9', border: 'none', color: '#475569', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Consultar Detalhes e Comprovante"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(r.id)} 
                      style={{ background: '#fee2e2', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Excluir Permanentemente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
