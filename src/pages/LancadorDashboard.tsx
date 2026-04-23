import React, { useEffect, useState, useRef } from 'react';
import {
  Plus,
  XCircle,
  FileImage as ImageIcon,
  BarChart3,
  Tag,
  Calendar,
  Bell,
  Search,
  Settings,
  Menu,
  X,
  LogOut,
  Camera,
  CheckCircle2,
  Loader2,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Tables } from '../types/database.types';
import { useSettings } from '../contexts/SettingsContext';
import { ExpenseModal } from '../components/ExpenseModal';
import { formatCurrency } from '../lib/utils';

type FilterType = 'TODOS' | 'APROVADO' | 'REJEITADO' | 'RASCUNHO';

export const LancadorDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { logoUrl } = useSettings();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ active: false, current: 0, total: 0 });

  const [expenses, setExpenses] = useState<any[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('TODOS');

  const [advFilters, setAdvFilters] = useState({
    branch_id: '',
    period_id: '',
    expense_type_id: ''
  });

  const [branches, setBranches] = useState<any[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Tables<'expenses'> | null>(null);

  useEffect(() => {
    fetchExpenses();
    fetchReferences();
    fetchNotifications();

    const channel = supabase.channel('notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const deleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Não abrir o modal ao clicar em excluir
    if (!window.confirm('Deseja excluir este rascunho?')) return;
    
    try {
      // 1. Buscar anexo para apagar do storage
      const { data: attachments, error: fetchErr } = await supabase.from('expense_attachments').select('storage_path').eq('expense_id', id);
      if (fetchErr) throw fetchErr;

      if (attachments && attachments.length > 0) {
        const { error: storageErr } = await supabase.storage.from('receipts').remove(attachments.map(a => a.storage_path));
        if (storageErr) throw storageErr;
      }
      
      // 2. Apagar do banco
      const { error: deleteErr } = await supabase.from('expenses').delete().eq('id', id);
      if (deleteErr) throw deleteErr;

      fetchExpenses();
    } catch (err: any) {
      console.error('Erro detalhado:', err);
      alert('Erro ao excluir rascunho: ' + (err.message || 'Verifique as permissões do banco.'));
    }
  };

  const fetchExpenses = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*, expense_attachments(storage_path), expense_types(name), branches(name), competency_periods(name), cost_centers(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setExpenses(data || []);
    generateThumbnails(data || []);
    setLoading(false);
  };

  const fetchReferences = async () => {
    const [br, et, p, cc] = await Promise.all([
      supabase.from('branches').select('*').eq('status', 'ATIVO').order('name'),
      supabase.from('expense_types').select('*').eq('status', 'ATIVO').order('name'),
      supabase.from('competency_periods').select('*').order('created_at', { ascending: false }),
      supabase.from('cost_centers').select('*').eq('status', 'ATIVO').order('name')
    ]);
    setBranches(br.data || []);
    setExpenseTypes(et.data || []);
    setPeriods(p.data || []);
    setCostCenters(cc.data || []);
  };

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
  };

  const generateThumbnails = async (list: any[]) => {
    const thumbs: Record<string, string> = {};
    for (const exp of list) {
      if (exp.expense_attachments?.[0]?.storage_path) {
        const { data } = await supabase.storage.from('receipts').createSignedUrl(exp.expense_attachments[0].storage_path, 3600);
        if (data?.signedUrl) thumbs[exp.id] = data.signedUrl;
      }
    }
    setThumbnails(thumbs);
  };

  const handleNotifClick = async (notif: any) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
    fetchNotifications();

    const { data: exp } = await supabase
      .from('expenses')
      .select('*, expense_attachments(storage_path), expense_types(name), branches(name), competency_periods(name), cost_centers(name)')
      .eq('id', notif.expense_id)
      .single();

    if (exp) {
      setSelectedExpense(exp);
      setShowNotifications(false);
    }
  };

  const clearNotifications = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    fetchNotifications();
  };

  const counts: Record<FilterType, number> = {
    TODOS: expenses.length,
    RASCUNHO: expenses.filter(e => e.status === 'RASCUNHO').length,
    APROVADO: expenses.filter(e => e.status === 'APROVADO').length,
    REJEITADO: expenses.filter(e => e.status === 'REJEITADO').length
  };

  const filteredExpenses = expenses.filter(e => {
    if (activeFilter !== 'TODOS' && e.status !== activeFilter) return false;
    if (advFilters.branch_id && e.branch_id !== advFilters.branch_id) return false;
    if (advFilters.period_id && e.period_id !== advFilters.period_id) return false;
    if (advFilters.expense_type_id && e.expense_type_id !== advFilters.expense_type_id) return false;
    return true;
  });

  const headerBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: 'white',
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: '0.2s',
    padding: '0'
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob failed'));
            },
            'image/jpeg',
            0.7
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadProgress({ active: true, current: 0, total: files.length });
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Comprimir a imagem antes do upload
        const compressedBlob = await compressImage(file);
        
        const fileName = `${user?.id}/${Date.now()}_${i}.jpg`; // Usamos .jpg após compressão
        const { error: upErr } = await supabase.storage.from('receipts').upload(fileName, compressedBlob, {
          contentType: 'image/jpeg'
        });
        
        if (upErr) throw upErr;

        const { data: exp, error: insErr } = await supabase.from('expenses').insert({ user_id: user!.id, status: 'RASCUNHO' }).select().single();
        if (insErr) throw insErr;

        await supabase.from('expense_attachments').insert({ expense_id: exp.id, storage_path: fileName, file_type: 'image/jpeg' });
        
        setUploadProgress(prev => ({ ...prev, current: i + 1 }));
      }
      fetchExpenses();
    } catch (err: any) {
      alert('Erro ao enviar notas: ' + err.message);
    } finally {
      setTimeout(() => setUploadProgress({ active: false, current: 0, total: 0 }), 2000);
      e.target.value = '';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--primary-dark)', padding: '0', color: 'white' }}>
      <div className="container-padding" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ height: '32px', maxWidth: '150px', objectFit: 'contain' }} />
            ) : (
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>SuperFlow</h1>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={headerBtnStyle}>
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    minWidth: '20px', height: '20px', backgroundColor: '#ef4444',
                    color: 'white', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                    border: '2px solid var(--primary-dark)'
                  }}>
                    {notifications.length > 10 ? '+10' : notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div style={{ position: 'absolute', top: '130%', right: 0, width: '300px', backgroundColor: 'white', borderRadius: '1.25rem', boxShadow: '0 15px 40px rgba(0,0,0,0.2)', padding: '1rem', color: '#1e293b', border: '1px solid #e2e8f0', zIndex: 100 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800 }}>Notificações</h4>
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Limpar Tudo</button>
                    )}
                  </div>
                  {notifications.length === 0
                    ? <p style={{ fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>Você está em dia! 🎉</p>
                    : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.map(n => (
                          <div key={n.id} onClick={() => handleNotifClick(n)} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', borderLeft: `4px solid ${n.type === 'APPROVE' ? '#10b981' : '#ef4444'}`, cursor: 'pointer' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0, color: '#334155' }}>{n.title}</p>
                            <p style={{ fontSize: '0.7rem', margin: '4px 0', color: '#64748b', lineHeight: 1.4 }}>{n.message}</p>
                            <p style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '4px' }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>

            <button onClick={() => navigate('/lancador/stats')} style={headerBtnStyle} title="Dashboard">
              <BarChart3 size={20} />
            </button>

            {profile?.role === 'ADMIN' && (
              <button onClick={() => navigate('/admin')} style={headerBtnStyle} title="Admin">
                <Settings size={20} />
              </button>
            )}

            <button onClick={signOut} style={{ ...headerBtnStyle, backgroundColor: '#ef4444' }} title="Sair">
              <XCircle size={20} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.15)', padding: '0.25rem', borderRadius: '0.875rem', gap: '0.25rem', marginBottom: '1.25rem' }}>
          {(['TODOS', 'RASCUNHO', 'APROVADO', 'REJEITADO'] as FilterType[]).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: '0.75rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
              backgroundColor: activeFilter === f ? 'white' : 'transparent',
              color: activeFilter === f ? 'var(--primary-dark)' : 'white', transition: '0.2s'
            }}>
              {f.charAt(0) + f.slice(1).toLowerCase()} <span style={{ opacity: 0.5, marginLeft: '2px' }}>({counts[f]})</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          <select value={advFilters.branch_id} onChange={e => setAdvFilters(p => ({ ...p, branch_id: e.target.value }))} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', fontSize: '0.7rem', fontWeight: 700, outline: 'none' }}>
            <option value="" style={{ color: '#000' }}>Filial: Todas</option>
            {branches.map(b => <option key={b.id} value={b.id} style={{ color: '#000' }}>{b.name}</option>)}
          </select>
          <select value={advFilters.period_id} onChange={e => setAdvFilters(p => ({ ...p, period_id: e.target.value }))} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', fontSize: '0.7rem', fontWeight: 700, outline: 'none' }}>
            <option value="" style={{ color: '#000' }}>Período: Todos</option>
            {periods.map(p => <option key={p.id} value={p.id} style={{ color: '#000' }}>{p.name}</option>)}
          </select>
          <select value={advFilters.expense_type_id} onChange={e => setAdvFilters(p => ({ ...p, expense_type_id: e.target.value }))} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', fontSize: '0.7rem', fontWeight: 700, outline: 'none' }}>
            <option value="" style={{ color: '#000' }}>Categoria: Todas</option>
            {expenseTypes.map(t => <option key={t.id} value={t.id} style={{ color: '#000' }}>{t.name}</option>)}
          </select>
        </div>

        <div style={{ paddingBottom: '100px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner"></div></div>
        ) : filteredExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '1.5rem', border: '1px solid #e2e8f0' }}>
            <Search size={48} color="#e2e8f0" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Nenhuma nota encontrada com esses filtros.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredExpenses.map(exp => (
              <div
                key={exp.id}
                onClick={() => setSelectedExpense(exp)}
                className="animate-fade-in"
                style={{
                  backgroundColor: 'white', padding: '1.25rem', borderRadius: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: exp.status === 'REJEITADO' ? '2px solid #fee2e2' : '1px solid #f1f5f9',
                  display: 'flex', gap: '1.25rem', cursor: 'pointer', transition: '0.2s'
                }}
              >
                <div style={{ width: '80px', height: '80px', borderRadius: '1rem', backgroundColor: '#f8fafc', overflow: 'hidden', flexShrink: 0, border: '1px solid #f1f5f9' }}>
                  {thumbnails[exp.id]
                    ? <img src={thumbnails[exp.id]} alt="Miniatura" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={24} color="#cbd5e1" /></div>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 900, padding: '0.25rem 0.6rem', borderRadius: '2rem',
                      backgroundColor: exp.status === 'APROVADO' ? '#dcfce7' : exp.status === 'REJEITADO' ? '#fee2e2' : '#f1f5f9',
                      color: exp.status === 'APROVADO' ? '#15803d' : exp.status === 'REJEITADO' ? '#b91c1c' : '#475569',
                      textTransform: 'uppercase'
                    }}>{exp.status}</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{new Date(exp.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                      {formatCurrency(Number(exp.amount || 0))}
                    </p>
                    {exp.status === 'RASCUNHO' && (
                      <button 
                        onClick={(e) => deleteDraft(exp.id, e)}
                        style={{ background: '#fee2e2', border: 'none', color: '#ef4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', opacity: 0.9 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      <Tag size={12} /> {exp.expense_types?.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      <Calendar size={12} /> {exp.competency_periods?.name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

      <div style={{ position: 'fixed', bottom: '1.5rem', left: '0', right: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 60 }}>
        {uploadProgress.active && (
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '0.75rem 1.5rem', borderRadius: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-dark)', fontWeight: 800, fontSize: '0.875rem' }}>
            {uploadProgress.current < uploadProgress.total ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Enviando {uploadProgress.current + 1} de {uploadProgress.total}...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} color="#10b981" />
                {uploadProgress.total} Nota(s) enviada(s)!
              </>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => fileInputRef.current?.click()} className="btn-primary" style={{ padding: '0 3rem', height: '60px', borderRadius: '3rem', boxShadow: '0 10px 30px rgba(36, 152, 207, 0.4)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '0.5px' }}>
            <Plus size={24} strokeWidth={3} /> ADICIONAR NOTAS
          </button>
        </div>
      </div>

      <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />


      {loading && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="spinner"></div>
        </div>
      )}

      <ExpenseModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onSaved={fetchExpenses}
        branches={branches}
        expenseTypes={expenseTypes}
        costCenters={costCenters}
        periods={periods}
      />
      <style>{`.spinner { width: 30px; height: 30px; border: 3px solid var(--primary-light); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
      .animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}
      </style>
      </div>
    </div>
  );
};

