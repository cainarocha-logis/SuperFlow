import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  Calendar,
  Filter,
  BarChart3,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import type { Tables } from '../types/database.types';

interface ManagerDashboardProps {
  profile: {
    id: string;
    role: 'ADMIN' | 'LANCADOR' | 'GERENTE' | string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ profile }) => {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<Tables<'competency_periods'>[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [branches, setBranches] = useState<Tables<'branches'>[]>([]);
  const [costCenters, setCostCenters] = useState<Tables<'cost_centers'>[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalPending: 0,
    totalApproved: 0,
    activeSubordinates: 0,
    spendingByBranch: [] as { name: string; amount: number }[],
    spendingByCC: [] as { name: string; amount: number }[],
    spendingByCategory: [] as { name: string; amount: number }[],
    topSpenders: [] as { name: string; amount: number; count: number }[]
  });

  useEffect(() => {
    fetchInitialData();
  }, [profile]);

  useEffect(() => {
    if (selectedPeriod || periods.length > 0) {
      calculateStats();
    }
  }, [selectedPeriod, expenses]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch periods
      const { data: pData } = await supabase
        .from('competency_periods')
        .select('*')
        .order('start_date', { ascending: false });
      setPeriods(pData || []);
      if (pData?.length) setSelectedPeriod(pData[0].id);

      // 2. Fetch data based on role
      let query = supabase
        .from('expenses')
        .select('*, users(first_name, last_name, email), branches(name), cost_centers(name), expense_types(name)');

      // If Manager, filter by their allowed branches/CCs
      if (profile?.role === 'GERENTE') {
        const [ubRes, uccRes] = await Promise.all([
          supabase.from('user_branches').select('branch_id').eq('user_id', profile.id),
          supabase.from('user_cost_centers').select('cost_center_id').eq('user_id', profile.id)
        ]);

        const allowedBranches = ubRes.data?.map(b => b.branch_id) || [];
        const allowedCCs = uccRes.data?.map(c => c.cost_center_id) || [];

        if (allowedBranches.length > 0) query = query.in('branch_id', allowedBranches);
        if (allowedCCs.length > 0) query = query.in('cost_center_id', allowedCCs);
      }

      const { data: eData } = await query;
      setExpenses(eData || []);

      const { data: bData } = await supabase.from('branches').select('*');
      const { data: cData } = await supabase.from('cost_centers').select('*');
      setBranches(bData || []);
      setCostCenters(cData || []);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const filtered = selectedPeriod 
      ? expenses.filter(e => e.period_id === selectedPeriod)
      : expenses;

    const totalSpent = filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalApproved = filtered.filter(e => e.status === 'APROVADO').reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalPending = filtered.filter(e => e.status === 'ENVIADO' || e.status === 'EM_ANALISE').reduce((sum, e) => sum + Number(e.amount || 0), 0);
    
    // Subordinates (unique users)
    const uniqueUsers = new Set(filtered.map(e => e.user_id));
    const activeSubordinates = uniqueUsers.size;

    // Spending by Branch
    const branchMap: Record<string, number> = {};
    filtered.forEach(e => {
      const name = e.branches?.name || 'Sem Filial';
      branchMap[name] = (branchMap[name] || 0) + Number(e.amount || 0);
    });
    const spendingByBranch = Object.entries(branchMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Spending by Cost Center
    const ccMap: Record<string, number> = {};
    filtered.forEach(e => {
      const name = e.cost_centers?.name || 'Sem Centro de Custo';
      ccMap[name] = (ccMap[name] || 0) + Number(e.amount || 0);
    });
    const spendingByCC = Object.entries(ccMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Spending by Category
    const catMap: Record<string, number> = {};
    filtered.forEach(e => {
      const name = e.expense_types?.name || 'Outros';
      catMap[name] = (catMap[name] || 0) + Number(e.amount || 0);
    });
    const spendingByCategory = Object.entries(catMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Top Spenders
    const userStats: Record<string, { amount: number; count: number }> = {};
    filtered.forEach(e => {
      const name = e.users ? `${e.users.first_name} ${e.users.last_name}` : 'Usuário Desconhecido';
      if (!userStats[name]) userStats[name] = { amount: 0, count: 0 };
      userStats[name].amount += Number(e.amount || 0);
      userStats[name].count += 1;
    });
    const topSpenders = Object.entries(userStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    setStats({
      totalSpent,
      totalPending,
      totalApproved,
      activeSubordinates,
      spendingByBranch,
      spendingByCC,
      spendingByCategory,
      topSpenders
    });
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados estratégicos...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Filters Header */}
      <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: 'rgba(7, 89, 133, 0.1)', color: 'var(--primary-dark)', padding: '0.5rem', borderRadius: '0.75rem' }}>
            <Calendar size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Visão Geral</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Análise de desempenho e custos</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={selectedPeriod} 
            onChange={e => setSelectedPeriod(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">Todos os Períodos</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard 
          title="Gasto Total" 
          value={stats.totalSpent} 
          icon={<Wallet size={24} />} 
          color="#0369a1" 
          trend={12} 
          isCurrency 
        />
        <KpiCard 
          title="Aguardando Conferência" 
          value={stats.totalPending} 
          icon={<BarChart3 size={24} />} 
          color="#f59e0b" 
          trend={-5}
          isCurrency
        />
        <KpiCard 
          title="Colaboradores Ativos" 
          value={stats.activeSubordinates} 
          icon={<Users size={24} />} 
          color="#10b981" 
          trend={3}
        />
        <KpiCard 
          title="Centro de Custos" 
          value={stats.spendingByCC.length} 
          icon={<Building2 size={24} />} 
          color="#7c3aed" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Breakdown by Cost Center */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={20} color="var(--primary-dark)" /> Custos por Centro
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>TOTAL POR CC</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {stats.spendingByCC.length > 0 ? stats.spendingByCC.map((cc, idx) => (
              <VisualProgressBar 
                key={cc.name} 
                label={cc.name} 
                amount={cc.amount} 
                total={stats.totalSpent} 
                color={idx === 0 ? '#0369a1' : '#38bdf8'} 
              />
            )) : <EmptyState text="Nenhum dado de centro de custo" />}
          </div>
        </div>

        {/* Top Spenders (Subordinates) */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="#10b981" /> Maiores Gastos por Pessoa
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>TOP 5</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.topSpenders.length > 0 ? stats.topSpenders.map((user, idx) => (
              <div key={user.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: idx === 0 ? '#f0f9ff' : '#f8fafc', borderRadius: '1rem', border: idx === 0 ? '1px solid #bae6fd' : '1px solid #f1f5f9' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: idx === 0 ? '#0369a1' : '#e2e8f0', color: idx === 0 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem' }}>
                  {user.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.count} notas enviadas</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, color: '#0f172a' }}>{formatCurrency(user.amount)}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981' }}>
                    {((user.amount / stats.totalSpent) * 100).toFixed(1)}% do total
                  </div>
                </div>
              </div>
            )) : <EmptyState text="Nenhum dado de colaboradores" />}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Spending by Branch */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'white' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="var(--primary-dark)" /> Gastos por Filial
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.spendingByBranch.map(b => (
              <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>{b.name}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e293b' }}>{formatCurrency(b.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spending by Category */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'white' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={18} color="var(--primary-dark)" /> Gastos por Categoria
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.spendingByCategory.map(cat => (
              <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>{cat.name}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e293b' }}>{formatCurrency(cat.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon, color, trend, isCurrency }: any) => (
  <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ backgroundColor: `${color}15`, color, padding: '0.6rem', borderRadius: '0.75rem' }}>
        {icon}
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: trend > 0 ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: 700, backgroundColor: trend > 0 ? '#dcfce7' : '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '0.25rem' }}>{title}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>
      {isCurrency ? formatCurrency(value) : value}
    </div>
  </div>
);

const VisualProgressBar = ({ label, amount, total, color }: any) => {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>{label}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(amount)}</span>
      </div>
      <div style={{ height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${percentage}%`, 
            backgroundColor: color, 
            borderRadius: '5px',
            transition: 'width 1s ease-out'
          }} 
        />
      </div>
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px dashed #e2e8f0' }}>
    {text}
  </div>
);
