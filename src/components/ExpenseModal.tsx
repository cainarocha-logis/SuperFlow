import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Save, Send, AlertCircle, CheckCircle, XCircle, History, Eye, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database.types';
import { formatCurrency, parseBrazilianNumber } from '../lib/utils';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Tables<'expenses'> | null;
  onSaved: () => void;
  branches: Tables<'branches'>[];
  expenseTypes: Tables<'expense_types'>[];
  costCenters: Tables<'cost_centers'>[];
  periods: Tables<'competency_periods'>[];
  isAdminView?: boolean;
  hasNext?: boolean;
  onNext?: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onSaved,
  branches,
  expenseTypes,
  costCenters,
  periods,
  isAdminView = false,
  hasNext = false,
  onNext
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    receipt_date: '',
    branch_id: '',
    expense_type_id: '',
    cost_center_id: '',
    period_id: '',
    observations: '',
    license_plate: '',
    customer_name: '',
    customer_chargeback: false,
    reimbursement_amount: ''
  });

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Tables<'expense_audit_logs'>[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const isRejected = expense?.status === 'REJEITADO';
  const canReplacePhoto = isRejected && !isAdminView;

  const isReadOnly = !!(isAdminView || (expense && ['ENVIADO', 'APROVADO', 'EM_ANALISE'].includes(expense.status)));
  const selectedType = (expenseTypes || []).find((t: any) => t.id === formData.expense_type_id);

  useEffect(() => {
    if (expense && isOpen) {
      setFormData({
        amount: expense.amount ? String(expense.amount).replace('.', ',') : '',
        receipt_date: expense.receipt_date || new Date().toISOString().split('T')[0],
        branch_id: expense.branch_id || (branches?.length === 1 ? branches[0].id : ''),
        expense_type_id: expense.expense_type_id || '',
        cost_center_id: expense.cost_center_id || '',
        period_id: expense.period_id || (() => {
          const today = new Date().toISOString().split('T')[0];
          // Tenta achar o período aberto que engloba hoje
          const current = periods.find(p => p.status === 'ABERTO' && today >= p.start_date && today <= p.end_date);
          // Se não achar por data, pega o primeiro aberto que encontrar
          return current?.id || periods.find(p => p.status === 'ABERTO')?.id || (periods.length > 0 ? periods[0].id : '');
        })(),
        observations: expense.observations || '',
        license_plate: expense.license_plate || '',
        customer_name: expense.customer_name || '',
        customer_chargeback: expense.customer_chargeback || false,
        reimbursement_amount: expense.reimbursement_amount ? String(expense.reimbursement_amount).replace('.', ',') : ''
      });
      fetchImage(expense.id);
      fetchLogs(expense.id);
      setZoom(1);
      setError(null);
    }
  }, [expense, isOpen]);

  const fetchImage = async (expenseId: string) => {
    try {
      const { data: attachments } = await supabase
        .from('expense_attachments')
        .select('storage_path')
        .eq('expense_id', expenseId)
        .limit(1);

      if (attachments && attachments.length > 0) {
        const { data: signedData } = await supabase.storage
          .from('receipts')
          .createSignedUrl(attachments[0].storage_path, 3600);
        if (signedData) setImageUrl(signedData.signedUrl);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const replacePhoto = async (file: File) => {
    if (!expense) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      // Delete existing attachment
      const { data: existingAttachments } = await supabase
        .from('expense_attachments')
        .select('id, storage_path')
        .eq('expense_id', expense.id);

      if (existingAttachments && existingAttachments.length > 0) {
        await supabase.storage.from('receipts').remove(existingAttachments.map(a => a.storage_path));
        await supabase.from('expense_attachments').delete().eq('expense_id', expense.id);
      }

      // Upload new file
      const ext = file.name.split('.').pop();
      const fileName = `${expense.user_id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('receipts').upload(fileName, file);
      if (upErr) throw upErr;

      const { error: attErr } = await supabase
        .from('expense_attachments')
        .insert({ expense_id: expense.id, storage_path: fileName, file_type: file.type });
      if (attErr) throw attErr;

      // Refresh image
      await fetchImage(expense.id);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Erro ao substituir foto');
    } finally {
      setUploadingPhoto(false);
    }
  };


  const fetchLogs = async (expenseId: string) => {
    try {
      const { data } = await supabase
        .from('expense_audit_logs')
        .select('*')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: false });
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isReadOnly) return;
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => {
      const newData = { ...prev, [name]: val };
      if (name === 'customer_chargeback' && val === true && !newData.reimbursement_amount) {
        newData.reimbursement_amount = prev.amount;
      }
      return newData;
    });
  };

  const handleApprove = async () => {
    if (!window.confirm('Confirmar aprovação?')) return;
    if (!expense) return;
    setLoading(true);
    try {
      const { error: rpcError } = await supabase.rpc('approve_expense', { p_expense_id: expense.id });
      if (rpcError) throw rpcError;
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Motivo da rejeição:');
    if (!reason) return;
    if (!expense) return;
    setLoading(true);
    try {
      const { error: rpcError } = await supabase.rpc('reject_expense', { p_expense_id: expense.id, p_rejection_reason: reason });
      if (rpcError) throw rpcError;
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveExpenseData = async (targetStatus: 'RASCUNHO' | 'ENVIADO', goToNext = false) => {
    if (isReadOnly) return;
    setLoading(true);
    setError(null);
    try {
      if (!expense) throw new Error('Despesa não encontrada');
      
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          amount: parseBrazilianNumber(formData.amount),
          receipt_date: formData.receipt_date || null,
          branch_id: formData.branch_id || null,
          expense_type_id: formData.expense_type_id || null,
          cost_center_id: formData.cost_center_id || null,
          period_id: formData.period_id || null,
          observations: formData.observations || null,
          license_plate: formData.license_plate || null,
          customer_name: formData.customer_name || null,
          customer_chargeback: formData.customer_chargeback,
          reimbursement_amount: parseBrazilianNumber(formData.reimbursement_amount)
        })
        .eq('id', expense.id);

      if (updateError) throw updateError;

      if (targetStatus === 'ENVIADO') {
        const { error: rpcError } = await supabase.rpc('submit_expense', { p_expense_id: expense.id });
        if (rpcError) throw rpcError;
      }

      onSaved();
      if (goToNext && onNext) {
        onNext();
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !expense) return null;

  const logActionColor = (action: string) => {
    if (action === 'APROVAÇÃO') return '#10b981';
    if (action === 'REJEIÇÃO') return '#ef4444';
    return '#3b82f6';
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
      <div style={{ backgroundColor: 'var(--surface)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
            {isReadOnly ? (isAdminView ? 'Conferência' : 'Consulta de Despesa') : (expense.status === 'REJEITADO' ? 'Corrigir Despesa' : 'Lançamento')}
          </h2>
          {isReadOnly && !isAdminView && (
            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={12} /> APENAS LEITURA
            </span>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, borderBottom: '1px solid #fee2e2' }}>
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      <div className="modal-content-wrapper">
        <div className="modal-image-area" style={{ flex: '1.2', backgroundColor: '#1e293b', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          {imageUrl
            ? <img src={imageUrl} alt="Comprovante" style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s', maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            : <p style={{ color: '#94a3b8' }}>Sem imagem</p>
          }

          {/* Replace photo button — only for REJEITADO */}
          {canReplacePhoto && (
            <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)' }}>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  backgroundColor: uploadingPhoto ? '#94a3b8' : '#ef4444',
                  color: 'white', border: 'none', borderRadius: '2rem',
                  padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '0.8rem',
                  cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)', whiteSpace: 'nowrap'
                }}
              >
                <Camera size={16} />
                {uploadingPhoto ? 'Enviando...' : 'Substituir Foto'}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await replacePhoto(file);
                  e.target.value = '';
                }}
              />
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.9)', padding: '0.25rem', borderRadius: '2rem' }}>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer' }}><ZoomOut size={20} /></button>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer' }}><ZoomIn size={20} /></button>
          </div>
        </div>

        <div className="modal-form-area" style={{ flex: '1', backgroundColor: 'var(--surface)', overflowY: 'auto', padding: '1.5rem', boxShadow: '-4px 0 10px rgba(0,0,0,0.05)', zIndex: 5 }}>

          <div style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              <History size={14} /> Histórico da Nota
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {logs.length > 0 ? logs.map((log, i) => {
                const actionName = log.new_status === 'APROVADO' ? 'APROVAÇÃO' : 
                                 log.new_status === 'REJEITADO' ? 'REJEIÇÃO' : 
                                 log.new_status === 'ENVIADO' ? 'ENVIO' : 'ATUALIZAÇÃO';
                return (
                  <div key={log.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                    {i < logs.length - 1 && <div style={{ position: 'absolute', left: '7px', top: '15px', bottom: '-15px', width: '1px', backgroundColor: '#cbd5e1' }} />}
                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: logActionColor(actionName), zIndex: 2, marginTop: '3px', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0, color: '#334155' }}>{actionName}</p>
                      {log.rejection_reason && <p style={{ fontSize: '0.75rem', margin: '2px 0', color: '#64748b' }}>{log.rejection_reason}</p>}
                      <p style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(log.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                );
              }) : <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nenhum histórico disponível</p>}
            </div>
          </div>

          <div style={{ pointerEvents: isReadOnly ? 'none' : 'auto', opacity: isReadOnly ? 0.9 : 1 }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Valor Principal (R$){!isReadOnly && ' *'}</label>
                <input type="text" name="amount" value={formData.amount} onChange={handleChange} className="input-field" disabled={isReadOnly} placeholder="0,00" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label">Data da Nota{!isReadOnly && ' *'}</label>
                <input type="date" name="receipt_date" value={formData.receipt_date} onChange={handleChange} className="input-field" disabled={isReadOnly} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Categoria{!isReadOnly && ' *'}</label>
                <select name="expense_type_id" value={formData.expense_type_id} onChange={handleChange} className="input-field" disabled={isReadOnly}>
                  <option value="">Selecione...</option>
                  {(expenseTypes || []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {selectedType?.requires_license_plate && (
                <div style={{ flex: 1 }}>
                  <label className="input-label">Placa *</label>
                  <input type="text" name="license_plate" value={formData.license_plate} onChange={handleChange} className="input-field" disabled={isReadOnly} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Filial{!isReadOnly && ' *'}</label>
                <select name="branch_id" value={formData.branch_id} onChange={handleChange} className="input-field" disabled={isReadOnly}>
                  <option value="">Selecione...</option>
                  {(branches || []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label">Período{!isReadOnly && ' *'}</label>
                <select 
                  name="period_id" 
                  value={formData.period_id} 
                  onChange={handleChange} 
                  className="input-field" 
                  disabled={true} 
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b', fontWeight: 700 }}
                >
                  <option value="">Selecione...</option>
                  {(periods || []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.status === 'ABERTO' ? '(ATUAL)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: 'var(--radius-md)', border: '1px solid #bae6fd' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <label style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.875rem' }}>Repassar ao Cliente?</label>
                <input type="checkbox" name="customer_chargeback" checked={formData.customer_chargeback} onChange={handleChange} disabled={isReadOnly} style={{ width: '20px', height: '20px' }} />
              </div>
              {formData.customer_chargeback && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 2 }}>
                    <label className="input-label">Cliente *</label>
                    <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} className="input-field" disabled={isReadOnly} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="input-label">Valor Repasse *</label>
                    <input type="text" name="reimbursement_amount" value={formData.reimbursement_amount} onChange={handleChange} className="input-field" disabled={isReadOnly} placeholder="0,00" />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">Centro de Custo</label>
              <select name="cost_center_id" value={formData.cost_center_id} onChange={handleChange} className="input-field" disabled={isReadOnly}>
                <option value="">Selecione...</option>
                {(costCenters || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label className="input-label">Observações</label>
              <textarea name="observations" value={formData.observations} onChange={handleChange} className="input-field" rows={2} disabled={isReadOnly}></textarea>
            </div>
          </div>

          {expense.amount && isAdminView && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#475569' }}>
              Valor: <strong style={{ color: 'var(--primary-dark)', fontSize: '1rem' }}>{formatCurrency(Number(expense.amount))}</strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', paddingBottom: '2rem' }}>
            {isAdminView ? (
              <>
                <button onClick={handleReject} disabled={loading} style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', background: '#fee2e2', color: '#b91c1c', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <XCircle size={18} /> REJEITAR
                </button>
                <button onClick={handleApprove} disabled={loading} style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', background: '#dcfce7', color: '#15803d', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} /> APROVAR
                </button>
              </>
            ) : !isReadOnly ? (
              <>
                <button onClick={() => saveExpenseData('RASCUNHO')} disabled={loading} style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Save size={18} /> Salvar Rascunho
                </button>
                <div style={{ flex: 2, display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => saveExpenseData('ENVIADO')} disabled={loading} className="btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Send size={18} /> {hasNext ? 'Enviar p/ Conferência' : 'Enviar p/ Conferência'}
                  </button>
                  {hasNext && (
                    <button onClick={() => saveExpenseData('ENVIADO', true)} disabled={loading} className="btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#10b981' }}>
                      <Send size={18} /> Enviar e Próximo
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button onClick={onClose} style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--primary-dark)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                FECHAR CONSULTA
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
