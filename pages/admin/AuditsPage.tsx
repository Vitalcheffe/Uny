import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendInvitationEmail } from '../../lib/email-service';

interface AuditRequest {
  id: string;
  company_name: string;
  email: string;
  industry: string;
  team_size: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditRequest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedAudit, setSelectedAudit] = useState<AuditRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    setLoading(true);
    
    // Fetch ALL audit requests (pending, approved, rejected)
    const { data: allRequests } = await (supabase
      .from('audit_requests' as any)
      .select('*')
      .order('created_at', { ascending: false }) as any);
    
    if (allRequests) {
      setStats({
        total: allRequests.length,
        pending: allRequests.filter((a: any) => a.status === 'pending').length,
        approved: allRequests.filter((a: any) => a.status === 'approved').length,
        rejected: allRequests.filter((a: any) => a.status === 'rejected').length
      });
      
      // Show ALL requests in table (not just pending)
      setAudits(allRequests);
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
    
    const orgName = auditRequest.company_name?.trim();
    if (!orgName) {
      setToast({ message: 'Nom d\'entreprise manquant', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    // Check if org already exists
    const { data: existing } = await (supabase
      .from('organizations' as any)
      .select('id')
      .eq('name', orgName)
      .single() as any);
    
    let orgId = existing?.id;
    
    if (!orgId) {
      // Create organization from the audit request
      const { data: newOrg, error: orgError } = await (supabase
        .from('organizations' as any)
        .insert({
          name: orgName,
          plan: 'starter',
          sector: auditRequest.industry || '',
          team_size: auditRequest.team_size || '',
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single() as any);
      
      if (orgError) {
        console.error('Error creating organization:', orgError);
      }
      orgId = newOrg?.id;
    }
    
    // Create invitation for the company owner
    if (orgId && auditRequest.email) {
      const inviteToken = crypto.randomUUID();
      const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      await (supabase
        .from('invitations' as any)
        .insert({
          organization_id: orgId,
          email: auditRequest.email,
          token: inviteToken,
          role: 'OWNER',
          status: 'pending',
          expires_at: inviteExpiry
        }) as any);
      
      const inviteUrl = `${window.location.origin}/invite/${inviteToken}`;
      
      // Send invitation email
      const emailResult = await sendInvitationEmail({
        to: auditRequest.email,
        companyName: orgName,
        inviteLink: inviteUrl,
        expiresAt: new Date(inviteExpiry).toLocaleDateString('fr-FR')
      });
      
      if (emailResult.success) {
        setToast({ message: `Demande approuvée! Email envoyé à ${auditRequest.email}`, type: 'success' });
      } else {
        setToast({ message: `Demande approuvée! Email non envoyé: ${emailResult.error}`, type: 'error' });
      }
    } else {
      setToast({ message: `Demande approuvée - Entreprise "${orgName}" créée!`, type: 'success' });
    }
    
    // Update audit request status
    const { error } = await (supabase
      .from('audit_requests' as any)
      .update({ status: 'approved' })
      .eq('id', id) as any);

    if (!error) {
      await fetchAudits();
    } else {
      setToast({ message: 'Erreur lors de l\'approbation', type: 'error' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const handleReject = async (id: string) => {
    // First get the audit request details
    const { data: auditRequest } = await (supabase
      .from('audit_requests' as any)
      .select('*, company_name')
      .eq('id', id)
      .single() as any);
    
    if (auditRequest?.company_name) {
      // If org exists, suspend it
      await (supabase
        .from('organizations' as any)
        .update({ status: 'suspended' })
        .eq('name', auditRequest.company_name) as any);
    }
    
    // Update audit request status
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

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-[#2563EB] text-white' 
                : 'bg-[#F8FAFC] text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f === 'all' ? 'Toutes' : f === 'pending' ? 'En attente' : f === 'approved' ? 'Approuvées' : 'Rejetées'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : audits.filter(a => filter === 'all' || a.status === filter).length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <ClipboardCheck className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">Aucune demande</p>
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
              {audits.filter(a => filter === 'all' || a.status === filter).map((audit) => (
                <tr key={audit.id} className="hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-[#0A0A1A] cursor-pointer" onClick={() => { setSelectedAudit(audit); setDrawerOpen(true); }}>{audit.company_name}</td>
                  <td className="px-4 py-3 text-slate-600">{audit.email}</td>
                  <td className="px-4 py-3 text-slate-600">{audit.industry}</td>
                  <td className="px-4 py-3 text-slate-600">{audit.team_size}</td>
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
                  <td className="px-4 py-3">
                    {audit.status === 'pending' ? (
                      <div className="flex gap-2">
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
                      </div>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        audit.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {audit.status === 'approved' ? 'Traité' : 'Rejeté'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Drawer */}
      {drawerOpen && selectedAudit && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col">
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#0A0A1A]">{selectedAudit.company_name}</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedAudit.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  selectedAudit.status === 'approved' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedAudit.status === 'pending' ? 'En attente' : 
                   selectedAudit.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                </span>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                <p className="text-sm text-slate-500">📧 Email</p>
                <p className="font-medium text-[#0A0A1A]">{selectedAudit.email}</p>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                <p className="text-sm text-slate-500">📱 Téléphone</p>
                <p className="font-medium text-[#0A0A1A]">{selectedAudit.phone || '-'}</p>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                <p className="text-sm text-slate-500">🏢 Secteur</p>
                <p className="font-medium text-[#0A0A1A]">{selectedAudit.industry || '-'}</p>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                <p className="text-sm text-slate-500">👥 Taille</p>
                <p className="font-medium text-[#0A0A1A]">{selectedAudit.team_size || '-'}</p>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                <p className="text-sm text-slate-500">💼 Poste</p>
                <p className="font-medium text-[#0A0A1A]">{selectedAudit.job_position || '-'}</p>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                <p className="text-sm text-slate-500">📅 Soumis le</p>
                <p className="font-medium text-[#0A0A1A]">{new Date(selectedAudit.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            {selectedAudit.status === 'pending' && (
              <div className="p-6 border-t border-[#E2E8F0] space-y-3">
                <button
                  onClick={() => { handleApprove(selectedAudit.id); setDrawerOpen(false); }}
                  className="w-full py-3 bg-[#10B981] text-white rounded-xl font-medium hover:bg-[#059669]"
                >
                  Approuver
                </button>
                <button
                  onClick={() => { handleReject(selectedAudit.id); setDrawerOpen(false); }}
                  className="w-full py-3 bg-[#EF4444] text-white rounded-xl font-medium hover:bg-[#DC2626]"
                >
                  Rejeter
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}