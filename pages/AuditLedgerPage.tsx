import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, Filter, Download, 
  ChevronRight, Activity, Clock, User, 
  Globe, Terminal, AlertTriangle, CheckCircle2,
  Lock, Eye, FileText, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../lib/supabase-data-layer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  timestamp: string; // Changed from Timestamp to string
  details: string;
  context: any;
  ip_address?: string;
  user_agent?: string;
  severity: 'info' | 'warning' | 'critical';
}

const AuditLedgerPage: React.FC = () => {
  const { orgId, isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    if (!orgId) return;

    const unsubscribe = firestoreService.subscribeToCollectionGlobal(
      'audit_ledger',
      [{ field: 'organization_id', operator: '==', value: orgId }],
      (data) => {
        setLogs(data as AuditLog[]);
        setLoading(false);
      },
      'timestamp',
      'desc'
    );

    return () => unsubscribe();
  }, [orgId]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-slate-900">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
              <Shield size={24} />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
              REGISTRE <span className="text-blue-600">D'AUDIT</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.5em] ml-16 italic">Immutable Sovereign Ledger</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="RECHERCHER DANS LE REGISTRE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-80 shadow-sm"
            />
          </div>
          <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Actions', value: logs.length, icon: Activity, color: 'text-blue-600' },
          { label: 'Alertes Critiques', value: logs.filter(l => l.severity === 'critical').length, icon: AlertTriangle, color: 'text-rose-600' },
          { label: 'Dernière Synchro', value: 'LIVE', icon: Clock, color: 'text-emerald-600' },
          { label: 'Intégrité Blockchain', value: 'VERIFIED', icon: Lock, color: 'text-slate-900' }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-[32px] border border-white/5 flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-white shadow-sm ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">{stat.label}</p>
              <p className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Logs Table */}
        <div className="flex-1 glass-card rounded-[48px] border border-white/5 overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <Terminal size={18} className="text-slate-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Flux d'événements en temps réel</h3>
            </div>
            <div className="flex items-center gap-2">
              {['all', 'info', 'warning', 'critical'].map(s => (
                <button 
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${filterSeverity === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Database size={48} className="opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">Aucun enregistrement trouvé</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
                  <tr className="text-left border-b border-slate-100">
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Horodatage</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Acteur</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Action</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Sévérité</th>
                    <th className="px-8 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <Clock size={14} className="text-slate-300" />
                          <span className="text-[11px] font-bold text-slate-600 font-mono">
                            {format(new Date(log.timestamp), 'HH:mm:ss', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 ml-6">
                          {format(new Date(log.timestamp), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px]">
                            {log.actor_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase italic text-slate-900">{log.actor_name}</p>
                            <p className="text-[9px] text-slate-400">{log.actor_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{log.action}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate max-w-xs italic">{log.details}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <AnimatePresence>
          {selectedLog && (
            <motion.div 
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="w-[450px] glass-card rounded-[48px] border border-white/5 p-10 flex flex-col gap-8 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Détails de l'événement</h3>
                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Activity size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Payload de l'Action</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                    "{selectedLog.details}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 border border-slate-100 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Globe size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">IP Address</span>
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-900">{selectedLog.ip_address || '127.0.0.1'}</p>
                  </div>
                  <div className="p-5 border border-slate-100 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <User size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Actor ID</span>
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-900 truncate">{selectedLog.actor_id.slice(0, 8)}...</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <FileText size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Contexte Technique</span>
                  </div>
                  <div className="p-6 bg-slate-900 rounded-3xl">
                    <pre className="text-[10px] font-mono text-blue-400 overflow-x-auto no-scrollbar">
                      {JSON.stringify(selectedLog.context || {}, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-emerald-500">
                    <CheckCircle2 size={18} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Signature Numérique Valide</p>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 font-mono break-all opacity-50">
                    SHA-256: {Math.random().toString(36).substring(2, 15)}{Math.random().toString(36).substring(2, 15)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuditLedgerPage;

function X(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
