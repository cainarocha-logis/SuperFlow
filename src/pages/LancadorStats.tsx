import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  PieChart,
  HandCoins,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { ExpenseModal } from '../components/ExpenseModal';
import { formatCurrency } from '../lib/utils';

export const LancadorStats = () => {
  const { user } = useAuth();
  const { logoUrl } = useSettings();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [branches, setBranches] = useState<any[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  useEffect(() => {
    fetchInitialData();
    fetchReferences();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data: pData } = await supabase
        .from('competency_periods')
        .select('*')
        .order('start_date', { ascending: false });
      setPeriods(pData || []);
      if (pData && pData.length > 0) setSelectedPeriods([pData[0].id]);

      const { data: eData } = await supabase
        .from('expenses')
        .select('*, expense_types(name), branches(name)')
        .eq('user_id', user!.id);
      setExpenses(eData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferences = async () => {
    const [brRes, etRes, ccRes] = await Promise.all([
      supabase.from('branches').select('*'),
      supabase.from('expense_types').select('*'),
      supabase.from('cost_centers').select('*')
    ]);
    setBranches(brRes.data || []);
    setExpenseTypes(etRes.data || []);
    setCostCenters(ccRes.data || []);
  };

  const togglePeriod = (id: string) => {
    setSelectedPeriods(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const filteredExpenses = selectedPeriods.length > 0
    ? expenses.filter(e => selectedPeriods.includes(e.period_id))
    : expenses;

  const approvedList = filteredExpenses.filter(e => e.status === 'APROVADO').slice(0, 5);

  const stats = {
    approved: filteredExpenses.filter(e => e.status === 'APROVADO').reduce((sum, e) => sum + Number(e.amount || 0), 0),
    pending: filteredExpenses.filter(e => e.status === 'ENVIADO' || e.status === 'EM_ANALISE').reduce((sum, e) => sum + Number(e.amount || 0), 0),
    rejected: filteredExpenses.filter(e => e.status === 'REJEITADO').reduce((sum, e) => sum + Number(e.amount || 0), 0),
    reimbursement: filteredExpenses.filter(e => e.customer_chargeback).reduce((sum, e) => sum + Number(e.reimbursement_amount || 0), 0),
    total: filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  };

  const categoryStats = filteredExpenses.reduce((acc: Record<string, number>, e) => {
    const name = e.expense_types?.name || 'Não definido';
    acc[name] = (acc[name] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '2rem' }}>
      <div style={{ background: 'var(--primary-dark)', padding: '1.25rem 1.5rem', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/lancador')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: '32px', maxWidth: '120px', objectFit: 'contain' }} />
          ) : (
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Estatísticas</h1>
          )}
        </div>
      </div>

      <main style={{ maxWidth: '1000px', margin: '1.5rem auto', padding: '0 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', marginBottom: '2rem', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
          {periods.map(p => (
            <button key={p.id} onClick={() => togglePeriod(p.id)} style={{
              whiteSpace: 'nowrap', padding: '0.625rem 1.25rem', borderRadius: '2rem', border: '1px solid',
              borderColor: selectedPeriods.includes(p.id) ? 'var(--primary-dark)' : '#e2e8f0',
              backgroundColor: selectedPeriods.includes(p.id) ? 'var(--primary-dark)' : 'white',
              color: selectedPeriods.includes(p.id) ? 'white' : '#64748b',
              fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer'
            }}>{p.name}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard title="Aprovado" amount={stats.approved} icon={<CheckCircle2 color="#10b981" />} color="#10b981" />
          <StatCard title="Repasse" amount={stats.reimbursement} icon={<HandCoins color="#3b82f6" />} color="#3b82f6" highlight />
          <StatCard title="Em Análise" amount={stats.pending} icon={<Clock color="#f59e0b" />} color="#f59e0b" />
          <StatCard title="Rejeitado" amount={stats.rejected} icon={<XCircle color="#ef4444" />} color="#ef4444" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'white' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <PieChart size={20} color="var(--primary-dark)" /> Gastos por Categoria
            </h3>
            {sortedCategories.map(([name, val]) => (
              <ProgressBar key={name} label={name} value={val} total={stats.total} color="var(--primary-light)" />
            ))}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'white' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <CheckCircle2 size={20} color="#10b981" /> Notas Aprovadas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {approvedList.length > 0 ? approvedList.map(e => (
                <div key={e.id} onClick={() => setSelectedExpense(e)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '1rem', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer', transition: '0.2s' }}>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{formatCurrency(Number(e.amount))}</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{e.expense_types?.name}</p>
                  </div>
                  <ChevronRight size={18} color="#cbd5e1" />
                </div>
              )) : <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>Nenhuma nota aprovada.</p>}
            </div>
          </div>
        </div>
      </main>

      <ExpenseModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onSaved={fetchInitialData}
        branches={branches}
        expenseTypes={expenseTypes}
        costCenters={costCenters}
        periods={periods}
      />
      <style>{`.spinner { width: 30px; height: 30px; border: 3px solid var(--primary-light); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

interface StatCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}

const StatCard = ({ title, amount, icon, highlight }: StatCardProps) => (
  <div style={{ backgroundColor: highlight ? '#f0f9ff' : 'white', padding: '1.5rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: highlight ? '2px solid #0ea5e9' : '1px solid #f1f5f9' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{title}</span>
      {icon}
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: highlight ? '#0369a1' : '#1e293b' }}>{formatCurrency(amount)}</div>
  </div>
);

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

const ProgressBar = ({ label, value, total, color }: ProgressBarProps) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
        <span style={{ fontWeight: 700, color: '#475569' }}>{label}</span>
        <span style={{ fontWeight: 800, color: '#1e293b' }}>{formatCurrency(value)}</span>
      </div>
      <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: color, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </div>
    </div>
  );
};
