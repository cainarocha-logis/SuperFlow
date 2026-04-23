import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  Building2,
  Tag,
  LayoutDashboard,
  History,
  User as UserIcon,
  FileImage as ImageIcon,
  ChevronRight,
  X,
  Settings as SettingsIcon,
  Upload,
  Menu,
  LogOut,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import type { Tables } from '../types/database.types';
import { BranchManagement } from '../components/BranchManagement';
import { ExpenseTypeManagement } from '../components/ExpenseTypeManagement';
import { CostCenterManagement } from '../components/CostCenterManagement';
import { ExpenseModal } from '../components/ExpenseModal';
import { UserManagement } from '../components/UserManagement';
import { ReportsManagement } from '../components/ReportsManagement';
import { formatCurrency, exportToCSV } from '../lib/utils';

type TabType = 'CONFERENCIA' | 'RELATORIOS' | 'FILIAIS' | 'TIPOS' | 'CENTROS' | 'USUARIOS' | 'CONFIG';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('CONFERENCIA');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expenses, setExpenses] = useState<(Tables<'expenses'> & { 
    users: { first_name: string, last_name: string, email: string } | null, 
    branches: { name: string } | null, 
    expense_types: { name: string } | null 
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { logoUrl, refreshSettings } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  const [advFilters, setAdvFilters] = useState({
    branch_id: '',
    period_id: '',
    expense_type_id: ''
  });

  const [branches, setBranches] = useState<Tables<'branches'>[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<Tables<'expense_types'>[]>([]);
  const [costCenters, setCostCenters] = useState<Tables<'cost_centers'>[]>([]);
  const [periods, setPeriods] = useState<Tables<'competency_periods'>[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Tables<'expenses'> | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchExpenses(), fetchReferences()]);
    setLoading(false);
  };

  const fetchExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*, users(first_name, last_name, email), branches(name), expense_types(name)')
      .eq('status', 'ENVIADO')
      .order('created_at', { ascending: true });
    setExpenses(data || []);
  };

  const fetchReferences = async () => {
    const [br, et, cc, p] = await Promise.all([
      supabase.from('branches').select('*').order('name'),
      supabase.from('expense_types').select('*').order('name'),
      supabase.from('cost_centers').select('*').order('name'),
      supabase.from('competency_periods').select('*').order('created_at', { ascending: false })
    ]);
    setBranches(br.data || []);
    setExpenseTypes(et.data || []);
    setCostCenters(cc.data || []);
    setPeriods(p.data || []);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('assets').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('settings').upsert({ key: 'company_logo_url', value: publicUrl });
      if (dbError) throw dbError;

      await refreshSettings();
      alert('Logo atualizada com sucesso!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro no upload';
      alert('Erro no upload: ' + errorMsg);
    }
  };

  const pendingCount = expenses.length;

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = searchTerm === '' ||
      `${e.users?.first_name ?? ''} ${e.users?.last_name ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.expense_types?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (advFilters.branch_id && e.branch_id !== advFilters.branch_id) return false;
    if (advFilters.period_id && e.period_id !== advFilters.period_id) return false;
    if (advFilters.expense_type_id && e.expense_type_id !== advFilters.expense_type_id) return false;

    return true;
  });

  const navButtonStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: 'none',
    backgroundColor: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    color: active ? 'white' : 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer', width: '100%', textAlign: 'left',
    fontWeight: active ? 700 : 500, transition: '0.2s',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', flexDirection: 'column' }}>
      {/* Mobile Header */}
      <header className="mobile-only" style={{ 
        backgroundColor: 'var(--primary-dark)', 
        padding: '1rem', 
        color: 'white', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <Menu size={24} />
          </button>
          <span style={{ fontWeight: 800 }}>SuperFlow Admin</span>
        </div>
        {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: '24px', maxWidth: '80px', objectFit: 'contain' }} />}
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'show' : ''} sidebar-desktop`} style={{ 
          width: '280px', 
          backgroundColor: 'var(--primary-dark)', 
          padding: '2rem 1.5rem', 
          color: 'white', 
          position: 'sticky', 
          top: 0, 
          height: '100vh', 
          overflowY: 'auto',
          transition: '0.3s ease',
          zIndex: 100
        }}>
          {/* Mobile Close Button */}
          <div className="mobile-only" style={{ justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>
        <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: '32px', maxWidth: '120px', objectFit: 'contain' }} />
          ) : (
            <div style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: '0.75rem' }}>
              <LayoutDashboard size={24} color="var(--primary-dark)" />
            </div>
          )}
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>SuperFlow</h1>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={() => setActiveTab('CONFERENCIA')} style={navButtonStyle(activeTab === 'CONFERENCIA')}>
            <History size={20} /> Conferência
            {pendingCount > 0 && (
              <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 900 }}>
                {pendingCount}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('CONFERENCIA')} style={navButtonStyle(activeTab === 'CONFERENCIA')}>
            <LayoutDashboard size={20} /> Conferência
          </button>
          <button onClick={() => setActiveTab('RELATORIOS')} style={navButtonStyle(activeTab === 'RELATORIOS')}>
            <FileSpreadsheet size={20} /> Relatórios
          </button>
          <button onClick={() => setActiveTab('FILIAIS')} style={navButtonStyle(activeTab === 'FILIAIS')}>
            <Building2 size={20} /> Filiais
          </button>
          <button onClick={() => setActiveTab('TIPOS')} style={navButtonStyle(activeTab === 'TIPOS')}>
            <Tag size={20} /> Categorias
          </button>
          <button onClick={() => setActiveTab('CENTROS')} style={navButtonStyle(activeTab === 'CENTROS')}>
            <FileText size={20} /> Centros de Custo
          </button>
          <button onClick={() => setActiveTab('USUARIOS')} style={navButtonStyle(activeTab === 'USUARIOS')}>
            <UserIcon size={20} /> Usuários
          </button>
          <button onClick={() => setActiveTab('CONFIG')} style={navButtonStyle(activeTab === 'CONFIG')}>
            <SettingsIcon size={20} /> Configurações
          </button>
          <div style={{ margin: '1.5rem 0', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          <button onClick={() => navigate('/lancador')} style={navButtonStyle(false)}>
            <ImageIcon size={20} /> Visão do Lançador
          </button>
        </nav>
      </aside>

        <main style={{ flex: 1, padding: '0', overflowX: 'hidden' }}>
          <div className="container-padding">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>
                  {activeTab === 'CONFERENCIA' && 'Conferência de Notas'}
                  {activeTab === 'RELATORIOS' && 'Relatórios e Exportação'}
                  {activeTab === 'CONFIG' && 'Configurações do Sistema'}
                  {activeTab === 'FILIAIS' && 'Gerenciar Filiais'}
                  {activeTab === 'TIPOS' && 'Tipos de Despesa'}
                  {activeTab === 'CENTROS' && 'Centros de Custo'}
                  {activeTab === 'USUARIOS' && 'Gerenciar Usuários'}
                </h2>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #e2e8f0' }}>
                <UserIcon size={18} color="#64748b" />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Admin</span>
              </div>
            </header>

        {activeTab === 'CONFIG' && (
          <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'white', maxWidth: '600px' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={20} /> Logo da Empresa
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '1rem', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                {logoUrl ? <img src={logoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={40} color="#cbd5e1" />}
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>Upload da logo que aparecerá no topo de todas as telas (Recomendado: PNG fundo transparente).</p>
                <button onClick={() => fileRef.current?.click()} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <Upload size={18} /> SELECIONAR ARQUIVO
                </button>
                <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*" onChange={handleLogoUpload} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CONFERENCIA' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'white', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f1f5f9', padding: '0.6rem 1rem', borderRadius: '0.5rem' }}>
                <Search size={18} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%' }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select value={advFilters.branch_id} onChange={e => setAdvFilters(p => ({ ...p, branch_id: e.target.value }))} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
                <option value="">Todas Filiais</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={advFilters.period_id} onChange={e => setAdvFilters(p => ({ ...p, period_id: e.target.value }))} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
                <option value="">Todos Períodos</option>
                {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={advFilters.expense_type_id} onChange={e => setAdvFilters(p => ({ ...p, expense_type_id: e.target.value }))} style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
                <option value="">Todas Categorias</option>
                {expenseTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {(advFilters.branch_id || advFilters.period_id || advFilters.expense_type_id) && (
                <button onClick={() => setAdvFilters({ branch_id: '', period_id: '', expense_type_id: '' })} style={{ border: 'none', background: '#fee2e2', color: '#b91c1c', padding: '0.6rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', backgroundColor: 'white' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Colaborador</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Filial</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Categoria</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Valor</th>
                    <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</td></tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nenhuma despesa encontrada.</td></tr>
                  ) : (
                    filteredExpenses.map(exp => (
                      <tr
                        key={exp.id}
                        onClick={() => setSelectedExpense(exp)}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: '0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{exp.users?.first_name} {exp.users?.last_name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{exp.users?.email}</div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#475569' }}>{exp.branches?.name}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 600 }}>
                            {exp.expense_types?.name}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{formatCurrency(Number(exp.amount))}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', fontWeight: 700, fontSize: '0.8125rem' }}>
                            CONFERIR <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'FILIAIS' && <BranchManagement />}
        {activeTab === 'TIPOS' && <ExpenseTypeManagement />}
        {activeTab === 'CENTROS' && <CostCenterManagement />}
        {activeTab === 'USUARIOS' && <UserManagement />}
        {activeTab === 'RELATORIOS' && <ReportsManagement />}

        <ExpenseModal
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          expense={selectedExpense}
          onSaved={fetchExpenses}
          branches={branches}
          expenseTypes={expenseTypes}
          costCenters={costCenters}
          periods={periods}
          isAdminView={true}
        />
          </div>
        </main>
      </div>
    </div>
  );
};
