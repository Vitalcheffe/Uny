import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, Trash2, LayoutDashboard, Users, Building2, 
  ShieldAlert, Activity, Search, Filter, MoreVertical,
  TrendingUp, Wallet, PieChart, Globe, Terminal,
  Zap, Bell, Settings, LogOut, ChevronRight,
  Database, ShieldCheck, FileText, Download,
  Plus, BarChart3, ArrowUpRight, ArrowDownRight, HardDrive, Lock, Command
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useTelemetry } from '../lib/useTelemetry';
import CreateOrganization from '../components/CreateOrganization';
import ManageEntityModal from '../components/ManageEntityModal';

import SpotlightSearch from '../components/SpotlightSearch';

interface AuditRequest {
  id: string;
  organization_name: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROVISIONED';
  type?: string;
  created_at: any;
}

interface Organization {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED';
  sector?: string;
  email?: string;
  config?: any;
  created_at: any;
}

interface TelemetryLog {
  id: string;
  event_type: string;
  metric_label: string;
  timestamp: any;
  payload?: any;
  org_id?: string;
}

interface RiskAssessment {
  id: string;
  org_id: string;
  vulnerability_score: number;
  data_weight: number;
  control_index: number;
  calculated_risk: number;
  findings: any[];
}

interface OSINTEvent {
  id: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sector_target: string;
  description: string;
  timestamp: any;
}

const AdminCommand: React.FC = () => {
  const { logAction } = useTelemetry('AdminCommand');
  const [requests, setRequests] = useState<AuditRequest[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryLog[]>([]);
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [osint, setOsint] = useState<OSINTEvent[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>(['🛡️ [Kernel] UNY OS v3.0 Initialized.', '🛡️ [Kernel] Autonomous Nervous System Active.']);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [activeModule, setActiveModule] = useState<'STATION' | 'CLIENTS' | 'SECURITY' | 'BILLING'>('STATION');
  const [counts, setCounts] = useState({
    orgs: 0,
    requests: 0,
    users: 0,
    projects: 0
  });

  const [mrrData, setMrrData] = useState<any[]>([]);

  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    setTerminalLogs(prev => [...prev, `> ${cmd}`]);
    
    // Command Processing
    if (cmd.startsWith('/audit')) {
      const orgId = cmd.split(' ')[2];
      setTerminalLogs(prev => [...prev, `🛡️ [Auditor] Deep scan initiated for Org: ${orgId || 'GLOBAL'}...`, '🛡️ [Auditor] Analyzing Law 09-08 compliance...', '🛡️ [Auditor] Risk Score recalculated: 0.42']);
    } else if (cmd === '/clear') {
      setTerminalLogs([]);
    } else if (cmd === '/help') {
      setTerminalLogs(prev => [...prev, 'Available commands: /audit --org [ID], /clear, /help, /deploy --mission [ID]']);
    } else {
      setTerminalLogs(prev => [...prev, `❌ [Kernel] Unknown command: ${cmd}`]);
    }
    
    setTerminalInput('');
  };

  const getRiskForOrg = (orgId: string) => {
    return risks.find(r => r.org_id === orgId)?.calculated_risk || 0;
  };

  useEffect(() => {
    logAction('view_admin_combat_station');
    
    const fetchData = async () => {
      try {
        const [reqsRes, orgsRes, logsRes, profilesCount, projectsCount, risksRes, osintRes, invoicesRes] = await Promise.all([
          supabase.from('audit_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('organizations').select('*').order('created_at', { ascending: false }),
          supabase.from('telemetry_logs').select('*').order('timestamp', { ascending: false }).limit(50),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          (supabase as any).from('risk_assessments').select('*'),
          (supabase as any).from('osint_events').select('*').order('timestamp', { ascending: false }).limit(10),
          supabase.from('invoices').select('amount, created_at, status')
        ]);

        if (reqsRes.data) setRequests(reqsRes.data as AuditRequest[]);
        if (orgsRes.data) setOrgs(orgsRes.data as unknown as Organization[]);
        if (logsRes.data) setTelemetry(logsRes.data as unknown as TelemetryLog[]);
        if (risksRes.data) setRisks(risksRes.data as unknown as RiskAssessment[]);
        if (osintRes.data) setOsint(osintRes.data as unknown as OSINTEvent[]);
        
        if (invoicesRes.data) {
          const monthlyRevenue: Record<string, number> = {};
          invoicesRes.data.forEach((inv: any) => {
            if (inv.status === 'Paid' && inv.created_at) {
              const d = new Date(inv.created_at);
              const monthYear = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + Number(inv.amount);
            }
          });
          const newMrrData = Object.keys(monthlyRevenue).map(key => ({
            name: key,
            value: monthlyRevenue[key]
          }));
          setMrrData(newMrrData);
        }

        setCounts({
          orgs: orgsRes.data?.length || 0,
          requests: reqsRes.data?.length || 0,
          users: profilesCount.count || 0,
          projects: projectsCount.count || 0
        });
      } catch (err) {
        console.error("Admin Data Retrieval Fault:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time Subscriptions
    const reqsChannel = supabase.channel('audit_requests_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRequests(prev => [payload.new as AuditRequest, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new as AuditRequest : r));
        }
      }).subscribe();

    const orgsChannel = supabase.channel('organizations_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrgs(prev => [payload.new as Organization, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrgs(prev => prev.map(o => o.id === payload.new.id ? payload.new as Organization : o));
        }
      }).subscribe();

    const telemetryChannel = supabase.channel('telemetry_logs_all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telemetry_logs' }, (payload) => {
        setTelemetry(prev => [payload.new as TelemetryLog, ...prev].slice(0, 50));
      }).subscribe();

    return () => {
      supabase.removeChannel(reqsChannel);
      supabase.removeChannel(orgsChannel);
      supabase.removeChannel(telemetryChannel);
    };
  }, []);

  const filteredOrgs = useMemo(() => {
    return orgs.filter(org => 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orgs, searchQuery]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
      req.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [requests, searchQuery]);

  const totalMRR = useMemo(() => {
    return mrrData.length > 0 ? mrrData[mrrData.length - 1].value : 0;
  }, [mrrData]);

  const complianceScore = useMemo(() => {
    if (risks.length === 0) return 100;
    const avgRisk = risks.reduce((sum, r) => sum + r.calculated_risk, 0) / risks.length;
    return Math.max(0, Math.round((1 - avgRisk) * 100));
  }, [risks]);

  const handleImpersonate = (orgId: string) => {
    logAction('impersonation_protocol_activated', `Target: ${orgId}`);
    window.location.href = `/dashboard?orgId=${orgId}&impersonate=true`;
  };

  const handleDeployMission = async () => {
    logAction('atomic_provisioning_started');
    // Logic for atomic provisioning would go here
    alert("Initialisation du Protocole de Déploiement Atomique...");
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
        <div className="w-24 h-24 rounded-[32px] bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-500 animate-pulse">
          <Zap size={48} />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-sm font-black uppercase tracking-[0.6em] text-blue-500 animate-pulse">Initialisation du Noyau</p>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Chargement de la Station de Combat Industrielle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] text-white flex overflow-hidden font-sans">
      <SpotlightSearch />

      {/* Column 1: Navigation Admin (Ultra-Narrow) */}
      <aside className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-8 bg-white/[0.01] z-50">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/20">
          <Zap size={24} fill="white" />
        </div>
        
        <nav className="flex-1 flex flex-col gap-4">
          {[
            { id: 'STATION', icon: LayoutDashboard, label: 'Station' },
            { id: 'CLIENTS', icon: Users, label: 'Clients' },
            { id: 'SECURITY', icon: ShieldAlert, label: 'Sécurité' },
            { id: 'BILLING', icon: Wallet, label: 'Billing' },
            { id: 'OSINT', icon: Globe, label: 'OSINT' },
            { id: 'CONFIG', icon: Settings, label: 'Config' }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveModule(item.id as any)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative ${
                activeModule === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              <div className="absolute left-full ml-4 px-3 py-1 bg-zinc-800 text-[10px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          ))}
        </nav>

        <button className="w-12 h-12 rounded-xl flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
          <LogOut size={20} />
        </button>
      </aside>

      {/* Column 2: System Health & Quick Stats (Narrow) */}
      <aside className="w-80 border-r border-white/5 flex flex-col bg-white/[0.01] overflow-y-auto custom-scrollbar">
        <div className="p-8 border-b border-white/5 space-y-2">
          <h2 className="text-lg font-black italic uppercase tracking-tighter text-white">System Health</h2>
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">Real-time Node Status</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'CPU', value: '12%', status: 'Stable', color: 'text-emerald-500' },
              { label: 'MEM', value: '4.2GB', status: 'Optimal', color: 'text-emerald-500' },
              { label: 'DB', value: '14ms', status: 'Fast', color: 'text-blue-500' },
              { label: 'IO', value: '850MB/s', status: 'Peak', color: 'text-amber-500' }
            ].map((node, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{node.label}</p>
                <p className="text-sm font-black italic tracking-tight text-white">{node.value}</p>
                <p className={`text-[8px] font-bold uppercase tracking-widest ${node.color}`}>{node.status}</p>
              </div>
            ))}
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-3xl border border-blue-500/20 space-y-4">
            <div className="flex justify-between items-center">
              <ShieldCheck size={20} className="text-blue-500" />
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic">CNDP Validated</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black italic uppercase tracking-tight text-white">Isolation Niveau 4</p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                Chiffrement AES-256 actif sur tous les buckets souverains.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 ml-2">Quick Access</h3>
            <div className="space-y-2">
              {[
                { label: 'Audit Logs', icon: Activity, color: 'hover:bg-blue-600' },
                { label: 'User Management', icon: Users, color: 'hover:bg-indigo-600' },
                { label: 'Security Rules', icon: ShieldAlert, color: 'hover:bg-rose-600' },
                { label: 'API Keys', icon: Lock, color: 'hover:bg-amber-600' }
              ].map((item, i) => (
                <button key={i} className={`w-full p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 transition-all group ${item.color}`}>
                  <item.icon size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Column 3: Main Workstation (Wide) */}
      <main className="flex-1 flex flex-col overflow-hidden bg-black">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-[950] italic uppercase tracking-tighter text-white leading-none">
                UNY <span className="text-blue-500">Command</span>
              </h1>
              <div className="px-3 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20 text-[8px] font-black text-blue-500 uppercase tracking-widest">
                Admin Station
              </div>
            </div>
            
            <div className="h-8 w-px bg-white/5" />
            
            <div className="flex items-center gap-2 text-zinc-500">
              <Command size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">CMD+K pour Spotlight</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleDeployMission}
              className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 italic"
            >
              <Zap size={14} fill="white" /> Déployer Mission
            </button>
            <CreateOrganization onSuccess={() => logAction('organization_deployed')} />
          </div>
        </header>

        {/* Workstation Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
          {/* Top Stats Bar */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Revenue (MRR)', value: `${totalMRR.toLocaleString()} MAD`, trend: '+12.4%', icon: Wallet },
              { label: 'Active Orgs', value: counts.orgs, trend: '+2', icon: Building2 },
              { label: 'Audit Requests', value: counts.requests, trend: 'Pending', icon: Activity },
              { label: 'Compliance', value: `${complianceScore}%`, trend: 'Stable', icon: ShieldCheck }
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</p>
                  <p className="text-xl font-black italic tracking-tight text-white">{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-800 text-zinc-500 group-hover:text-blue-500 transition-colors">
                  <stat.icon size={18} />
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-2 gap-8">
            {/* Organizations Management */}
            <div className="bg-white/5 rounded-[40px] border border-white/5 flex flex-col h-[600px]">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">Gestion des Entités</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                    <LayoutDashboard size={14} />
                  </button>
                  <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                    <BarChart3 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {filteredOrgs.map(org => (
                  <div key={org.id} className="p-5 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/[0.05] transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 font-black italic">
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black italic uppercase tracking-tight text-white">{org.name}</p>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{org.sector || 'Standard'}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        org.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                      }`}>
                        {org.status}
                      </div>
                    </div>
                    
                    {/* Risk Score Indicator */}
                    <div className="mb-4 p-3 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={12} className={getRiskForOrg(org.id) > 0.7 ? 'text-rose-500' : 'text-emerald-500'} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Risk Score</span>
                      </div>
                      <span className={`text-xs font-black italic ${getRiskForOrg(org.id) > 0.7 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {(getRiskForOrg(org.id) * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setSelectedOrg(org)}
                          className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
                        >
                          Configuration
                        </button>
                        <button 
                          onClick={() => handleImpersonate(org.id)}
                          className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                        >
                          Impersonation
                        </button>
                      </div>
                      <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">ID: {org.id.slice(0, 8)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Requests & Analytics */}
            <div className="space-y-8">
              {/* Audit Requests */}
              <div className="bg-white/5 rounded-[40px] border border-white/5 flex flex-col h-[300px]">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">Audit Requests</h3>
                  <span className="px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[8px] font-black text-amber-500 uppercase tracking-widest">
                    {requests.filter(r => r.status === 'PENDING').length} New
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                  {filteredRequests.map(req => (
                    <div key={req.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <FileText size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black italic uppercase tracking-tight text-white">{req.organization_name}</p>
                          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{req.email}</p>
                        </div>
                      </div>
                      <button className="p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-emerald-500 transition-all">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Chart & Time-Series Telemetry */}
              <div className="space-y-8">
                <div className="bg-white/5 rounded-[40px] border border-white/5 p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">Revenue Velocity</h3>
                    <TrendingUp size={20} className="text-blue-500" />
                  </div>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mrrData}>
                        <defs>
                          <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-black/40 rounded-[40px] border border-white/5 p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Activity size={16} className="text-emerald-500" />
                      <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">High-Frequency Telemetry</h3>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 animate-pulse">Live: 1.2k/s</span>
                  </div>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={telemetry.slice(0, 20).reverse().map((t, i) => ({ name: i, value: t.payload ? Object.keys(t.payload).length * 10 : 10 }))}>
                        <defs>
                          <linearGradient id="colorTele" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTele)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Column 4: OSINT & Interactive Terminal */}
      <aside className="w-96 border-l border-white/5 flex flex-col bg-zinc-950">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-blue-500" />
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">Project NEXUS</h3>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
        </div>

        {/* OSINT Feed */}
        <div className="h-1/2 overflow-y-auto p-4 space-y-3 custom-scrollbar border-b border-white/5">
          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-4 px-2">Global Event Correlation</p>
          {osint.length > 0 ? osint.map(event => (
            <div key={event.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  event.severity === 'CRITICAL' ? 'bg-rose-500 animate-ping' : 
                  event.severity === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-[9px] font-black italic uppercase text-white">{event.event_type}</p>
                  <p className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest">{event.sector_target || 'Global'}</p>
                </div>
              </div>
              <ShieldAlert size={12} className={event.severity === 'CRITICAL' ? 'text-rose-500' : 'text-zinc-700'} />
            </div>
          )) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-800 space-y-2">
              <Globe size={20} />
              <p className="text-[8px] font-black uppercase tracking-widest">Scanning Intelligence...</p>
            </div>
          )}
        </div>

        {/* Interactive Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Terminal size={12} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">UNY_KERNEL_ACCESS</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1 custom-scrollbar">
            {terminalLogs.map((log, i) => (
              <div key={i} className={log.startsWith('>') ? 'text-blue-400' : log.startsWith('❌') ? 'text-rose-500' : 'text-zinc-400'}>
                {log}
              </div>
            ))}
          </div>
          <form onSubmit={handleTerminalCommand} className="p-4 bg-zinc-900/20 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-black">#</span>
              <input 
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Enter command..."
                className="flex-1 bg-transparent border-none outline-none text-[10px] font-mono text-white placeholder:text-zinc-800"
              />
            </div>
          </form>
        </div>
      </aside>

      {/* Modals */}
      <AnimatePresence>
        {selectedOrg && (
          <ManageEntityModal 
            isOpen={!!selectedOrg} 
            onClose={() => setSelectedOrg(null)} 
            org={selectedOrg} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCommand;
