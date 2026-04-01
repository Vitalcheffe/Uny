/**
 * ⚡ UNY PROTOCOL: COMPANIES MASTER CONTROL (V1)
 * Description: Dashboard central pour la gestion des organisations multi-tenant.
 * Style "Orange Business" / Industrial Dark.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Activity, 
  Search, 
  Filter, 
  MoreVertical, 
  Power, 
  Zap, 
  Database,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import UserManagement from '../../components/admin/UserManagement';

interface Organization {
  id: string;
  name: string;
  ice_number: string;
  is_active: boolean;
  subscription_status: string;
  ai_request_limit: number;
  storage_limit_gb: number;
  created_at: string;
  employee_count?: number;
}

const CompaniesMaster: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      // Fetch orgs + profile count (employees)
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          profiles:profiles(count)
        `);

      if (error) throw error;

      const formattedOrgs = data.map((org: any) => ({
        ...org,
        employee_count: org.profiles?.[0]?.count || 0
      }));

      setOrgs(formattedOrgs);
    } catch (err: any) {
      toast.error(`Erreur de synchronisation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrgStatus = async (org: Organization) => {
    try {
      const { error } = await (supabase as any)
        .from('organizations')
        .update({ is_active: !org.is_active })
        .eq('id', org.id);

      if (error) throw error;

      toast.success(`Organisation ${org.is_active ? 'suspendue' : 'activée'} avec succès.`);
      fetchOrgs();
    } catch (err: any) {
      toast.error(`Failure du basculement: ${err.message}`);
    }
  };

  const updateQuotas = async (org: Organization, aiLimit: number, storageLimit: number) => {
    try {
      const { error } = await (supabase as any)
        .from('organizations')
        .update({ 
          ai_request_limit: aiLimit,
          storage_limit_gb: storageLimit 
        })
        .eq('id', org.id);

      if (error) throw error;

      toast.success('Quotas mis à jour.');
      setIsQuotaModalOpen(false);
      fetchOrgs();
    } catch (err: any) {
      toast.error(`Erreur quota: ${err.message}`);
    }
  };

  const filteredOrgs = orgs.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.ice_number.includes(searchTerm)
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            Companies <span className="text-orange-500">Master</span>
          </h1>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.4em]">
            Multi-Tenant Control Plane v9.2
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              type="text" 
              placeholder="Search by Name or ICE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:border-orange-500/50 outline-none w-64 transition-all"
            />
          </div>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all">
            <Filter size={18} className="text-white/40" />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Orgs', value: orgs.filter(o => o.is_active).length, icon: Building2, color: 'text-orange-500' },
          { label: 'Total Employees', value: orgs.reduce((acc, o) => acc + (o.employee_count || 0), 0), icon: Users, color: 'text-blue-500' },
          { label: 'System Load', value: '0.42ms', icon: Activity, color: 'text-emerald-500' },
          { label: 'Security Status', value: 'Nameinal', icon: ShieldCheck, color: 'text-indigo-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[32px] flex items-center gap-4 shadow-xl">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/20">{stat.label}</p>
              <p className="text-2xl font-black italic tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-bottom border-white/5 bg-white/[0.02]">
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30">Organization</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30">ICE Number</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30">Status</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30">Employees</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30">Quotas</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-20 text-center">
                  <Activity className="animate-spin text-orange-500 mx-auto" size={32} />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mt-4">Syncing with Core...</p>
                </td>
              </tr>
            ) : filteredOrgs.map((org) => (
              <tr key={org.id} className="hover:bg-white/[0.01] transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-500 font-black italic">
                      {org.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight">{org.name}</p>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">ID: {org.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className="font-mono text-xs text-white/40">{org.ice_number}</span>
                </td>
                <td className="p-6">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    org.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${org.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {org.is_active ? 'Active' : 'Suspended'}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-white/20" />
                    <span className="text-sm font-bold">{org.employee_count}</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-white/40">
                      <Zap size={10} className="text-orange-500" />
                      <span>{org.ai_request_limit} REQS</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-white/40">
                      <Database size={10} className="text-blue-500" />
                      <span>{org.storage_limit_gb} GB</span>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => { setSelectedOrg(org); setIsQuotaModalOpen(true); }}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
                      title="Manage Quotas"
                    >
                      <Zap size={16} />
                    </button>
                    <button 
                      onClick={() => setSelectedOrg(selectedOrg?.id === org.id ? null : org)}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-blue-500 transition-all"
                      title="Manage Users"
                    >
                      <Users size={16} />
                    </button>
                    <button 
                      onClick={() => toggleOrgStatus(org)}
                      className={`p-2 rounded-lg transition-all ${
                        org.is_active ? 'hover:bg-rose-500/10 text-rose-500' : 'hover:bg-emerald-500/10 text-emerald-500'
                      }`}
                      title={org.is_active ? 'Suspend' : 'Activate'}
                    >
                      <Power size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Management Section (Expandable) */}
      <AnimatePresence>
        {selectedOrg && !isQuotaModalOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">
                    Identity <span className="text-blue-500">Management</span>
                  </h3>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                    Managing employees for: {selectedOrg.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrg(null)}
                className="text-xs font-black uppercase tracking-widest text-white/20 hover:text-white"
              >
                Close Protocol
              </button>
            </div>
            
            <UserManagement organizationId={selectedOrg.id} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quota Modal */}
      <AnimatePresence>
        {isQuotaModalOpen && selectedOrg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[48px] shadow-2xl space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  Quota <span className="text-orange-500">Override</span>
                </h3>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                  Adjusting limits for {selectedOrg.name}
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">AI Request Limit</label>
                  <input 
                    type="number" 
                    defaultValue={selectedOrg.ai_request_limit}
                    id="ai-limit"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-orange-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Storage Limit (GB)</label>
                  <input 
                    type="number" 
                    defaultValue={selectedOrg.storage_limit_gb}
                    id="storage-limit"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsQuotaModalOpen(false)}
                  className="flex-1 p-4 rounded-2xl bg-white/5 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const ai = parseInt((document.getElementById('ai-limit') as HTMLInputElement).value);
                    const storage = parseInt((document.getElementById('storage-limit') as HTMLInputElement).value);
                    updateQuotas(selectedOrg, ai, storage);
                  }}
                  className="flex-1 p-4 rounded-2xl bg-orange-600 text-white text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20"
                >
                  Apply Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompaniesMaster;
