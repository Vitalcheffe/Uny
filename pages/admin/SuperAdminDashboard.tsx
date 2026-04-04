import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Building, Users, FileText, CreditCard, Settings, 
  Check, X, Loader2, TrendingUp, DollarSign,
  Activity, Search, Filter, MoreHorizontal, Copy,
  AlertCircle, CheckCircle, XCircle, Zap, Mail, Phone
} from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  total_orgs: number;
  active_orgs: number;
  pending_audits: number;
  tokens_used: number;
  monthly_revenue: number;
}

interface AuditRequest {
  id: string;
  company_name: string;
  email: string;
  phone?: string;
  job_position?: string;
  team_size?: string;
  industry?: string;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  plan: string;
  team_size: string;
  subscription_status: string;
  created_at: string;
  ai_usage_count: number;
}

interface CompanyDetail {
  company: Company;
  users: any[];
  payments: any[];
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total_orgs: 0,
    active_orgs: 0,
    pending_audits: 0,
    tokens_used: 0,
    monthly_revenue: 0
  });
  const [pendingRequests, setPendingRequests] = useState<AuditRequest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'companies'>('pending');
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pending audits
      const { data: requests } = await supabase
        .from('audit_requests')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      
      if (requests) setPendingRequests(requests);

      // Fetch all companies
      const { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (orgs) setCompanies(orgs);

      // Calculate stats
      const activeOrgs = orgs?.filter(o => o.subscription_status === 'active' || o.subscription_status === 'trialing').length || 0;
      setStats({
        total_orgs: orgs?.length || 0,
        active_orgs: activeOrgs,
        pending_audits: requests?.length || 0,
        tokens_used: orgs?.reduce((sum, o) => sum + (o.ai_usage_count || 0), 0) || 0,
        monthly_revenue: 0 // TODO: calculate from payments
      });
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: AuditRequest) => {
    setActionLoading(request.id);
    try {
      const companyName = request.company_name;
      const response = await fetch('/api/admin/approve-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: request.id, 
          orgName: companyName,
          userEmail: request.email
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ ${companyName} approuvée!`);
        navigator.clipboard.writeText(data.inviteUrl);
        setPendingRequests(prev => prev.filter(r => r.id !== request.id));
        // Refresh companies
        fetchData();
      } else {
        toast.error(data.error || 'Erreur');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (request: AuditRequest) => {
    setActionLoading(request.id);
    try {
      await supabase
        .from('audit_requests')
        .update({ status: 'REJECTED' })
        .eq('id', request.id);

      toast.success(`❌ ${request.company_name} rejectée`);
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (err) {
      toast.error('Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleOrgStatus = async (company: Company) => {
    const newStatus = company.subscription_status === 'active' ? 'suspended' : 'active';
    try {
      await supabase
        .from('organizations')
        .update({ subscription_status: newStatus })
        .eq('id', company.id);
      
      toast.success(`Organisation ${newStatus === 'active' ? 'activée' : 'suspendue'}`);
      fetchData();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Super Admin</h1>
          <p className="text-white/50 text-sm">Gérez votre plateforme</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span>{stats.total_orgs} organisations</span>
          <span>•</span>
          <span>{stats.active_orgs} actives</span>
        </div>
      </div>

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Building className="w-5 h-5 text-blue-500" />
              <span className="text-white/50 text-sm">Total Org.</span>
            </div>
            <p className="text-3xl font-semibold">{stats.total_orgs}</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-white/50 text-sm">Actives</span>
            </div>
            <p className="text-3xl font-semibold">{stats.active_orgs}</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="text-white/50 text-sm">En attente</span>
            </div>
            <p className="text-3xl font-semibold">{stats.pending_audits}</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span className="text-white/50 text-sm">Tokens</span>
            </div>
            <p className="text-3xl font-semibold">{stats.tokens_used.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'pending' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            Demandes ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'companies' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            Entreprises ({companies.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'pending' ? (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center text-white/50">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                <p>Aucune demande en attente</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Entreprise</th>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Contact</th>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Téléphone</th>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Poste</th>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Taille</th>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Secteur</th>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Date</th>
                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((req, i) => (
                    <tr key={req.id} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/5' : ''}`}>
                      <td className="p-4 font-medium">{req.company_name}</td>
                      <td className="p-4 text-white/70">{req.email}</td>
                      <td className="p-4 text-white/70">{req.phone || '-'}</td>
                      <td className="p-4 text-white/70">{req.job_position || '-'}</td>
                      <td className="p-4 text-white/70">{req.team_size || '-'}</td>
                      <td className="p-4 text-white/70">{req.industry || '-'}</td>
                      <td className="p-4 text-white/50 text-sm">
                        {new Date(req.created_at).toLocaleDateString('fr')}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={actionLoading === req.id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium disabled:opacity-50"
                          >
                            {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approuver'}
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={actionLoading === req.id}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium disabled:opacity-50"
                          >
                            Rejeter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <input
                type="text"
                placeholder="Rechercher une entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              />
            </div>

            {filteredCompanies.length === 0 ? (
              <div className="p-12 text-center text-white/50">
                <Building className="w-12 h-12 mx-auto mb-4" />
                <p>Aucune entreprise</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Entreprise</th>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Plan</th>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Statut</th>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Tokens</th>
                    <th className="text-left p-4 text-xs font-medium text-white/50 uppercase">Créée</th>
                    <th className="text-right p-4 text-xs font-medium text-white/50 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company, i) => (
                    <tr key={company.id} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/5' : ''}`}>
                      <td className="p-4 font-medium">{company.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {company.plan || 'starter'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          company.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                          company.subscription_status === 'trialing' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {company.subscription_status || 'inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-white/70">{company.ai_usage_count || 0}</td>
                      <td className="p-4 text-white/50 text-sm">
                        {new Date(company.created_at).toLocaleDateString('fr')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleOrgStatus(company)}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs"
                        >
                          {company.subscription_status === 'active' ? 'Suspendre' : 'Activer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}