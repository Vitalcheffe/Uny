import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Loader2, Building, Mail, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AuditRequest {
  id: string;
  organization_name: string;
  company_name: string;
  email: string;
  team_size?: string;
  industry?: string;
  created_at: string;
  status: string;
}

export default function AdminAuditRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_requests')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (data) setRequests(data);
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
        body: JSON.stringify({ requestId: request.id, orgName: companyName }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Entreprise ${request.company_name} approuvée!`);
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

  const handleReject = async (request: AuditRequest) => {
    const reason = prompt('Raison du rejet (optionnel):');
    if (reason === null) return;
    
    setActionLoading(request.id);
    try {
      const response = await fetch('/api/admin/reject-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id, reason }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Demande rejetée`);
        setRequests(requests.filter(r => r.id !== request.id));
      } else {
        toast.error(data.error || 'Erreur lors du rejet');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Building className="text-blue-600" size={32} />
        <h1 className="text-3xl font-black uppercase tracking-tighter">
          Demandes d'Audit
        </h1>
        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
          {requests.length} en attente
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto text-emerald-600 mb-4" size={48} />
          <p className="text-emerald-800 font-semibold">Aucune demande en attente</p>
          <p className="text-emerald-600 text-sm">Les nouvelles demandes apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div 
              key={req.id} 
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Building className="text-slate-400" size={20} />
                    <h3 className="text-xl font-bold">{req.company_name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={16} />
                    <span>{req.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{req.team_size || 'N/A'}</span>
                    </div>
                    <span>•</span>
                    <span>{req.industry || 'N/A'}</span>
                    <span>•</span>
                    <span>{new Date(req.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(req)}
                    disabled={actionLoading === req.id}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === req.id ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Check size={20} />
                    )}
                    Approuver
                  </button>
                  
                  <button
                    onClick={() => handleReject(req)}
                    disabled={actionLoading === req.id}
                    className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 disabled:opacity-50 transition-colors"
                  >
                    <X size={20} />
                    Rejeter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}