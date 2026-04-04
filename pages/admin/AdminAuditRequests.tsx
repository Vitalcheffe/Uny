import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Loader2, Building, Mail, Users, AlertCircle, Phone, Briefcase, TrendingUp, DollarSign, Send, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface AuditRequest {
  id: string;
  company_name: string;
  organization_name: string;
  email: string;
  phone?: string;
  job_position?: string;
  team_size?: string;
  industry?: string;
  status: string;
  created_at: string;
}

interface CompanyStats {
  total_requests: number;
  approved: number;
  pending: number;
  rejected: number;
}

export default function AdminAuditRequests() {
  const [requests, setRequests] = useState<AuditRequest[]>([]);
  const [stats, setStats] = useState<CompanyStats>({ total_requests: 0, approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchData();
  }, [selectedTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch requests based on selected tab
      const { data, error } = await supabase
        .from('audit_requests')
        .select('*')
        .eq('status', selectedTab === 'pending' ? 'PENDING' : selectedTab === 'approved' ? 'APPROVED' : 'REJECTED')
        .order('created_at', { ascending: false });

      if (data) setRequests(data);

      // Get stats
      const { data: allData } = await supabase.from('audit_requests').select('status');
      if (allData) {
        setStats({
          total_requests: allData.length,
          approved: allData.filter(d => d.status === 'APPROVED').length,
          pending: allData.filter(d => d.status === 'PENDING').length,
          rejected: allData.filter(d => d.status === 'REJECTED').length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: AuditRequest) => {
    setActionLoading(request.id);
    try {
      const companyName = request.company_name || request.organization_name;
      const response = await fetch('/api/admin/approve-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: request.id, 
          orgName: companyName,
          userEmail: request.email,
          userName: request.company_name
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ ${companyName} approuvée! Lien d'invitation: ${data.inviteUrl}`);
        setRequests(requests.filter(r => r.id !== request.id));
      } else {
        toast.error(data.error || 'Erreur lors de l\'approbation');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (request: AuditRequest, reason?: string) => {
    setActionLoading(request.id);
    try {
      const { error } = await supabase
        .from('audit_requests')
        .update({ status: 'REJECTED', metadata: { reason } })
        .eq('id', request.id);

      if (!error) {
        toast.success(`❌ ${request.company_name} rejectée`);
        setRequests(requests.filter(r => r.id !== request.id));
      } else {
        toast.error('Erreur lors du rejet');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const copyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Lien copié!');
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2"> Gestion des Demandes d'Audit</h1>
        <p className="text-slate-500">Gérez les demandes d'audit et approuvez les nouvelles entreprises</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total_requests}</p>
              <p className="text-sm text-slate-500">Total demandes</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
              <p className="text-sm text-slate-500">En attente</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
              <p className="text-sm text-slate-500">Approuvées</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
              <p className="text-sm text-slate-500">Rejetées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              selectedTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab === 'pending' ? 'En attente' : tab === 'approved' ? 'Approuvées' : 'Rejetées'}
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
              {tab === 'pending' ? stats.pending : tab === 'approved' ? stats.approved : stats.rejected}
            </span>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <Check className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucune demande {selectedTab === 'pending' ? 'en attente' : selectedTab}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entreprise</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Téléphone</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Poste</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Taille</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Secteur</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => (
                <tr key={request.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-4">
                    <p className="font-semibold text-slate-900">{request.company_name || request.organization_name}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-600">{request.email}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-600">{request.phone || '-'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-600">{request.job_position || '-'}</p>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
                      {request.team_size || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-50 rounded-lg text-xs font-medium text-blue-600">
                      {request.industry || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-slate-500">
                      {new Date(request.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    {selectedTab === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={actionLoading === request.id}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          {actionLoading === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Approuver
                        </button>
                        <button
                          onClick={() => handleReject(request)}
                          disabled={actionLoading === request.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          {actionLoading === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Rejeter
                        </button>
                      </div>
                    )}
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