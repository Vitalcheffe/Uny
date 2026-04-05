import React, { useState, useEffect } from 'react';
import { Building2, MoreVertical, X, BarChart3, Users, CreditCard, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Company {
  id: string;
  name: string;
  plan: string;
  users_count: number;
  tokens_this_month: number;
  last_active: string;
  revenue: number;
  status: 'active' | 'suspended';
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  status: 'paid' | 'pending' | 'failed';
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'aperçu' | 'tokens' | 'utilisateurs' | 'paiements'>('aperçu');
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [companyTransactions, setCompanyTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyDetails(selectedCompany.id);
    }
  }, [selectedCompany]);

  const fetchCompanyDetails = async (orgId: string) => {
    // Fetch users for this organization
    const { data: usersData } = await (supabase
      .from('profiles' as any)
      .select('*')
      .eq('organization_id', orgId) as any);
    
    if (usersData) {
      setCompanyUsers(usersData.map((p: any) => ({
        id: p.id,
        full_name: p.full_name || 'Sans nom',
        email: p.email || '',
        role: p.role || 'Membre',
        created_at: p.created_at
      })));
    }
    
    // TODO: Fetch real transactions when you have a payments table
    setCompanyTransactions([]);
  };

  const fetchCompanies = async () => {
    setLoading(true);
    console.log('[CompaniesPage] Fetching organizations...');
    
    const { data, error } = await (supabase
      .from('organizations' as any)
      .select('*')
      .order('created_at', { ascending: false }) as any);
    
    console.log('[CompaniesPage] Organizations response:', { count: data?.length, error });
    
    if (error) {
      console.error('[CompaniesPage] Error fetching organizations:', error);
      setError(error.message);
    }
    
    if (data && data.length > 0) {
      // Fetch user count for each organization
      const companiesWithCounts = await Promise.all(data.map(async (org: any) => {
        const { count } = await (supabase
          .from('profiles' as any)
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id) as any);
        
        return {
          id: org.id,
          name: org.name,
          plan: org.plan || 'Free',
          users_count: count || 0,
          tokens_this_month: org.tokens_used_this_month || 0,
          last_active: org.updated_at || org.created_at,
          revenue: org.total_revenue || 0,
          // All orgs without status column are considered active (they have a plan)
          status: org.plan ? 'active' : 'suspended',
          created_at: org.created_at
        };
      }));
      
      console.log('[CompaniesPage] Processed companies:', companiesWithCounts.length);
      setCompanies(companiesWithCounts);
    } else {
      console.log('[CompaniesPage] No organizations found');
      setCompanies([]);
    }
    setLoading(false);
  };

  const openDrawer = (company: Company) => {
    setSelectedCompany(company);
    setDrawerOpen(true);
    setActiveTab('aperçu');
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedCompany(null);
  };

  const toggleStatus = async () => {
    if (!selectedCompany) return;
    const newStatus = selectedCompany.status === 'active' ? 'suspended' : 'active';
    
    const { error } = await (supabase
      .from('organizations' as any)
      .update({ active: newStatus })
      .eq('id', selectedCompany.id) as any);

    if (!error) {
      setSelectedCompany({ ...selectedCompany, status: newStatus });
      setCompanies(companies.map(c => 
        c.id === selectedCompany.id ? { ...c, status: newStatus } : c
      ));
    }
  };

  // TODO: Fetch real token usage data when you have a tokens table
  const tokenUsageData = selectedCompany ? [
    { day: '1', tokens: selectedCompany.tokens_this_month || 0 }
  ] : [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Erreur: {error}
        </div>
      )}
      
      {/* Table */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-16px shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : companies.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Building2 className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">Aucune entreprise</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Entreprise</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Plan</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Utilisateurs</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Tokens ce mois</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Dernier actif</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Revenu</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Statut</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {companies.map((company) => (
                <tr 
                  key={company.id} 
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => openDrawer(company)}
                >
                  <td className="px-4 py-3 font-medium text-[#0A0A1A]">{company.name}</td>
                  <td className="px-4 py-3 text-slate-600">{company.plan}</td>
                  <td className="px-4 py-3 text-slate-600">{company.users_count}</td>
                  <td className="px-4 py-3 text-slate-600">{company.tokens_this_month.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(company.last_active)}</td>
                  <td className="px-4 py-3 text-slate-600">{company.revenue}€</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {company.status === 'active' ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      className="p-2 hover:bg-slate-100 rounded-lg"
                      onClick={(e) => { e.stopPropagation(); openDrawer(company); }}
                    >
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && selectedCompany && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closeDrawer}
          />
          <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0A0A1A]">{selectedCompany.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedCompany.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedCompany.status === 'active' ? 'Actif' : 'Suspendu'}
                  </span>
                </div>
              </div>
              <button onClick={closeDrawer} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#E2E8F0] px-6">
              <div className="flex gap-6">
                {(['aperçu', 'tokens', 'utilisateurs', 'paiements'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab 
                        ? 'border-[#2563EB] text-[#2563EB]' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'aperçu' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                      <p className="text-sm text-slate-500">Plan</p>
                      <p className="font-medium text-[#0A0A1A]">{selectedCompany.plan}</p>
                    </div>
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                      <p className="text-sm text-slate-500">Revenu total</p>
                      <p className="font-medium text-[#0A0A1A]">{selectedCompany.revenue}€</p>
                    </div>
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                      <p className="text-sm text-slate-500">Créé le</p>
                      <p className="font-medium text-[#0A0A1A]">{formatDate(selectedCompany.created_at)}</p>
                    </div>
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                      <p className="text-sm text-slate-500">Dernier actif</p>
                      <p className="font-medium text-[#0A0A1A]">{formatDate(selectedCompany.last_active)}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tokens' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-[#0A0A1A]">Utilisation des tokens (30 derniers jours)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tokenUsageData}>
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="tokens" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'utilisateurs' && (
                <div className="space-y-3">
                  {companyUsers.map((user) => (
                    <div key={user.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#0A0A1A]">{user.full_name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">{user.role}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'paiements' && (
                <div className="space-y-3">
                  {companyTransactions.map((tx) => (
                    <div key={tx.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#0A0A1A]">{tx.description}</p>
                        <p className="text-sm text-slate-500">{formatDate(tx.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[#0A0A1A]">{tx.amount}€</p>
                        <span className="text-xs text-green-600">{tx.status === 'paid' ? 'Payé' : tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#E2E8F0]">
              <button
                onClick={toggleStatus}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  selectedCompany.status === 'active'
                    ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                    : 'bg-[#10B981] text-white hover:bg-[#059669]'
                }`}
              >
                {selectedCompany.status === 'active' ? 'Suspendre' : 'Activer'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}