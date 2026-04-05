import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuditRequest {
  id: string;
  company_name: string;
  email: string;
  sector: string;
  size: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditRequest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    setLoading(true);
    
    // Fetch all audit requests
    const { data: allData } = await (supabase
      .from('audit_requests' as any)
      .select('status') as any);
    
    // Fetch pending requests
    const { data: pendingData } = await (supabase
      .from('audit_requests' as any)
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }) as any);
    
    if (allData) {
      setStats({
        total: allData.length,
        pending: pendingData?.length || 0,
        approved: allData.filter((a: any) => a.status === 'approved').length,
        rejected: allData.filter((a: any) => a.status === 'rejected').length
      });
    }
    
    if (pendingData) {
      setAudits(pendingData);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    // First get the audit request details
    const { data: auditRequest } = await (supabase
      .from('audit_requests' as any)
      .select('*')
      .eq('id', id)
      .single() as any);
    
    if (!auditRequest) {
      setToast({ message: 'Demande introuvable', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    // Create organization from the audit request
    const { error: orgError } = await (supabase
      .from('organizations' as any)
      .insert({
        name: auditRequest.company_name,
        subscription_tier: 'Free',
        subscription_status: 'active',
        created_at: new Date().toISOString()
      }) as any);
    
    if (orgError) {
      console.error('Error creating organization:', orgError);
    }
    
    // Update audit request status
    const { error } = await (supabase
      .from('audit_requests' as any)
      .update({ status: 'approved' })
      .eq('id', id) as any);

    if (!error) {
      await fetchAudits();
      setToast({ message: `Demande approuvée - Entreprise "${auditRequest.company_name}" créée!`, type: 'success' });
    } else {
      setToast({ message: 'Erreur lors de l\'approbation', type: 'error' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const handleReject = async (id: string) => {
    const { error } = await (supabase
      .from('audit_requests' as any)
      .update({ status: 'rejected' })
      .eq('id', id) as any);

    if (!error) {
      await fetchAudits();
      setToast({ message: 'Demande rejetée', type: 'success' });
    } else {
      setToast({ message: 'Erreur lors du rejet', type: 'error' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-[#10B981] text-white' : 'bg-[#EF4444] text-white'
        }`}>
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <p className="text-sm text-slate-500">Total demandes</p>
          <p className="text-2xl font-semibold text-[#0A0A1A]">{stats.total}</p>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <p className="text-sm text-slate-500">En attente</p>
          <p className="text-2xl font-semibold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <p className="text-sm text-slate-500">Approuvées</p>
          <p className="text-2xl font-semibold text-[#10B981]">{stats.approved}</p>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <p className="text-sm text-slate-500">Rejetées</p>
          <p className="text-2xl font-semibold text-[#EF4444]">{stats.rejected}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : audits.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <ClipboardCheck className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">Aucune demande en attente</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Entreprise</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Secteur</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Taille</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Statut</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {audits.map((audit) => (
                <tr key={audit.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-[#0A0A1A]">{audit.company_name}</td>
                  <td className="px-4 py-3 text-slate-600">{audit.email}</td>
                  <td className="px-4 py-3 text-slate-600">{audit.sector}</td>
                  <td className="px-4 py-3 text-slate-600">{audit.size}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(audit.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      audit.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      audit.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {audit.status === 'pending' ? 'En attente' : 
                       audit.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => handleApprove(audit.id)}
                      className="px-3 py-1.5 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => handleReject(audit.id)}
                      className="px-3 py-1.5 bg-[#EF4444] text-white rounded-lg text-sm font-medium hover:bg-[#DC2626] transition-colors"
                    >
                      Rejeter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}