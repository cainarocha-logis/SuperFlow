import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileSpreadsheet, Search, Download, Calendar, Filter } from 'lucide-react';
import { formatCurrency, exportToCSV } from '../lib/utils';
import type { Tables } from '../types/database.types';

export const ReportsManagement = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'APROVADO',
    period_id: '',
    branch_id: ''
  });
  const [references, setReferences] = useState({
    periods: [] as any[],
    branches: [] as any[]
  });

  useEffect(() => {
    fetchReferences();
    fetchReportData();
  }, [filters]);

  const fetchReferences = async () => {
    const [p, b] = await Promise.all([
      supabase.from('competency_periods').select('*').order('created_at', { ascending: false }),
      supabase.from('branches').select('*').order('name')
    ]);
    setReferences({ periods: p.data || [], branches: b.data || [] });
  };

  const fetchReportData = async () => {
    setLoading(true);
    let query = supabase
      .from('expenses')
      .select('*, users(first_name, last_name, email), branches(name), expense_types(name), competency_periods(name), cost_centers(name)')
      .eq('status', filters.status as any);

    if (filters.period_id) query = query.eq('period_id', filters.period_id);
    if (filters.branch_id) query = query.eq('branch_id', filters.branch_id);

    const { data } = await query.order('created_at', { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  };

  const handleExport = () => {
    if (expenses.length === 0) return;

    const exportData = expenses.map(exp => ({
      'ID': exp.id,
      'Data': new Date(exp.receipt_date).toLocaleDateString('pt-BR'),
      'Colaborador': `${exp.users?.first_name} ${exp.users?.last_name}`,
      'Email': exp.users?.email,
      'Filial': exp.branches?.name,
      'Categoria': exp.expense_types?.name,
      'Centro de Custo': exp.cost_centers?.name,
      'Periodo': exp.competency_periods?.name,
      'Valor': exp.amount,
      'Status': exp.status,
      'Obs': exp.observations || ''
    }));

    exportToCSV(exportData, `Relatorio_SuperFlow_${filters.status}_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} color="var(--primary-dark)" /> Filtros de Exportação
          </h3>
          <button 
            onClick={handleExport} 
            disabled={expenses.length === 0 || loading}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', borderRadius: '2rem' }}
          >
            <FileSpreadsheet size={18} /> EXPORTAR EXCEL
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="input-label">Status</label>
            <select 
              className="input-field" 
              value={filters.status}
              onChange={e => setFilters({...filters, status: e.target.value})}
            >
              <option value="APROVADO">Conferidas (Aprovadas)</option>
              <option value="REJEITADO">Rejeitadas</option>
              <option value="ENVIADO">Em Conferência</option>
            </select>
          </div>
          <div>
            <label className="input-label">Período</label>
            <select 
              className="input-field" 
              value={filters.period_id}
              onChange={e => setFilters({...filters, period_id: e.target.value})}
            >
              <option value="">Todos os Períodos</option>
              {references.periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Filial</label>
            <select 
              className="input-field" 
              value={filters.branch_id}
              onChange={e => setFilters({...filters, branch_id: e.target.value})}
            >
              <option value="">Todas as Filiais</option>
              {references.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', backgroundColor: 'white', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b' }}>
            {expenses.length} registros encontrados
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Data</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Colaborador</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Categoria</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nenhum dado para os filtros selecionados.</td></tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', fontSize: '0.8125rem' }}>{new Date(exp.receipt_date).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{exp.users?.first_name} {exp.users?.last_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{exp.users?.email}</div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8125rem' }}>{exp.expense_types?.name}</td>
                    <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{formatCurrency(exp.amount)}</td>
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
