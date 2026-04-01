/**
 * ⚡ UNY PROTOCOL: GLOBAL AUDIT TRAIL VISUALIZER (V12.7)
 * Description: Centre de surveillance en temps réel du audit_requests & Paddle.
 * Réservé au SUPER_ADMIN. Visualisation des pics d'activité et intrusions.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Activity, 
  Database, 
  AlertCircle, 
  TrendingUp, 
  Search, 
  Terminal,
  Clock,
  Zap,
  RefreshCw,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart,
  Bar
} from 'recharts';
import { toast } from 'sonner';
import { organizationService } from '../../services/organizationService';

interface AuditRequest {
  id: string;
  company_name: string;
  email: string;
  status: string;
  created_at: string;
  type: string;
}

interface PaddleStats {
  mrr: number;
  pending: number;
  failed: number;
}

const GlobalAudit: React.FC = () => {
  const [requests, setRequests] = useState<AuditRequest[]>([]);
  const [paddleStats, setPaddleStats] = useState<PaddleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchPaddleStats();
    
    // Realtime subscription for audit requests
    const channel = supabase
      .channel('audit_requests_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_requests' }, (payload) => {
        console.log('⚡ [Audit] New request detected:', payload.new);
        setRequests(prev => [payload.new as AuditRequest, ...prev].slice(0, 100));
        toast.info(`Nouvelle demande d'audit: ${payload.new.company_name}`);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await (supabase as any)
        .from('audit_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setRequests((data as any[]) || []);
    } catch (err: any) {
      console.error(`❌ [Audit] Fetch fault: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaddleStats = async () => {
    try {
      const res = await fetch('/api/paddle/stats');
      if (res.ok) {
        const data = await res.json();
        setPaddleStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch Paddle stats:', err);
    }
  };

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      setLoading(true);
      
      // Get request data first
      const { data: request, error: fetchError } = await supabase
        .from('audit_requests')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;

      // Update status
      const { error } = await (supabase as any)
        .from('audit_requests')
        .update({ status: action })
        .eq('id', id);
        
      if (error) throw error;
      
      if (action === 'APPROVED') {
        // Trigger Spawning Logic
        await organizationService.spawnOrganization(request);
        toast.success("Audit approuvé. Spawning de l'organisation terminé.");
      } else {
        toast.info("Audit refusé.");
      }
      
      fetchRequests();
    } catch (err: any) {
      toast.error("Erreur lors de l'action.");
    } finally {
      setLoading(false);
    }
  };

  // Statistiques temporelles (pics d'activité)
  const temporalStats = Array.from(
    requests.reduce((acc, req) => {
      const date = new Date(req.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      acc.set(date, (acc.get(date) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).map(([time, count]) => ({ time, count })).reverse();

  // Statistiques par statut
  const statusStats = Array.from(
    requests.reduce((acc, req) => {
      acc.set(req.status, (acc.get(req.status) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value }));

  const filteredRequests = requests.filter(req => 
    req.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div style={{ zoom: 0.7 }} className="bg-white min-h-screen p-8 text-slate-900 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
              Master <span className="text-blue-600">Ledger</span>
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em]">
              Admin Clarity Node v12.7
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by Company or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-sm text-slate-900 focus:border-blue-500 outline-none w-64 transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => { fetchRequests(); fetchPaddleStats(); }}
              className="p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all shadow-sm"
            >
              <RefreshCw size={18} className="text-blue-600" />
            </button>
          </div>
        </div>

        {/* Paddle Financial Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 p-8 rounded-[40px] space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paddle MRR</p>
              <p className="text-3xl font-black italic tracking-tighter text-slate-900">
                ${paddleStats?.mrr?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-8 rounded-[40px] space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Transactions</p>
              <p className="text-3xl font-black italic tracking-tighter text-slate-900">
                {paddleStats?.pending || '0'}
              </p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-8 rounded-[40px] space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Failed Transactions</p>
              <p className="text-3xl font-black italic tracking-tighter text-slate-900">
                {paddleStats?.failed || '0'}
              </p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-8 rounded-[40px] space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Database size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Audit Requests</p>
              <p className="text-3xl font-black italic tracking-tighter text-slate-900">
                {requests.length}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activity Peaks */}
          <div className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <TrendingUp size={18} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Activity Peaks (Requests)</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={temporalStats}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Action Distribution */}
          <div className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <Terminal size={18} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Status Distribution</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#94a3b8" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Real-time Feed */}
        <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Live Audit Requests Feed</h3>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Syncing with Node_0x92B</span>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 sticky top-0 z-10">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Company</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <Clock size={12} />
                        {new Date(req.created_at).toLocaleString('fr-FR')}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                          <ShieldCheck size={14} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-tight text-slate-900">{req.company_name}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-mono text-[10px] text-slate-500">{req.email}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {req.type || 'STANDARD'}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleAction(req.id, 'APPROVED')} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-700">Approuver</button>
                          <button onClick={() => handleAction(req.id, 'REJECTED')} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-rose-700">Refuser</button>
                        </div>
                      ) : (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <Zap size={10} />
                          {req.status}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalAudit;
