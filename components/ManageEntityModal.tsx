
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Database, Activity, Settings, Shield, 
  HardDrive, Lock, Save, CheckCircle2, Loader2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ManageEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: {
    id: string;
    name: string;
    status: string;
    sector?: string;
    email?: string;
    config?: Record<string, any>;
  };
}

const ManageEntityModal: React.FC<ManageEntityModalProps> = ({ isOpen, onClose, org }) => {
  const [activeTab, setActiveTab] = useState<'Health' | 'Audit' | 'Config'>('Health');
  const [auditLogs, setAuditLogs] = useState<Record<string, any>[]>([]);
  const [config, setConfig] = useState(org.config || {
    storage_limit: 5,
    modules: {
      finance: true,
      hr: true,
      legal: true,
      projects: true
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'Audit') {
      const fetchLogs = async () => {
        const { data } = await supabase
          .from('telemetry_logs')
          .select('*')
          .eq('org_id', org.id)
          .order('timestamp', { ascending: false })
          .limit(20);
        
        if (data) setAuditLogs(data);
      };

      fetchLogs();

      const channel = supabase.channel(`audit_logs_${org.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'telemetry_logs',
          filter: `org_id=eq.${org.id}`
        }, (payload) => {
          setAuditLogs(prev => [payload.new, ...prev].slice(0, 20));
        }).subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, activeTab, org.id]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await supabase
        .from('organizations')
        .update({ metadata: config })
        .eq('id', org.id);
      onClose();
    } catch (err) {
      console.error("Config Save Error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-[#050505]/90 backdrop-blur-xl" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl h-[85vh] bg-[#0a0a0a] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Database size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-[950] italic uppercase tracking-tighter text-white">
                Gestion <span className="text-blue-500">{org.name}</span>
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-1">
                ID: {org.id} • {org.sector || 'Secteur Non Défini'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-2xl transition-all text-zinc-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-8">
          {[
            { id: 'Health', label: 'Data Health', icon: HardDrive },
            { id: 'Audit', label: 'Audit Log', icon: Activity },
            { id: 'Config', label: 'Override Config', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'Health' | 'Audit' | 'Config')}
              className={`flex items-center gap-3 px-8 py-6 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'Health' && (
              <motion.div 
                key="health"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12"
              >
                <div className="space-y-8">
                  <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 italic">Espace Disque (Firebase Storage)</h4>
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-4xl font-[950] italic tracking-tighter text-white">1.2 <span className="text-xl opacity-50">GB</span></span>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Limite: {config.storage_limit} GB</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '24%' }}
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 italic">Index de Sécurité</h4>
                    <div className="flex items-center gap-8">
                      <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center relative">
                        <span className="text-2xl font-black italic tracking-tighter text-emerald-500">94%</span>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="276" strokeDashoffset="16" className="text-emerald-500" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black italic uppercase tracking-tight text-white">Protocole N4 Active</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Chiffrement de bout en bout validé.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-blue-600 rounded-[40px] text-white space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Shield size={200} />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <h3 className="text-3xl font-[950] italic uppercase tracking-tighter leading-none">Souveraineté <br />Numérique</h3>
                    <p className="text-sm font-bold opacity-80 leading-relaxed uppercase tracking-tight">
                      Cette entité est hébergée sur des serveurs conformes aux normes de souveraineté marocaine (CNDP).
                    </p>
                    <div className="pt-8">
                      <button className="px-8 py-4 bg-white text-blue-600 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
                        Générer Certificat Conformité
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Audit' && (
              <motion.div 
                key="audit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Flux d'Activité Réel</h3>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Live Stream</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-[24px] border border-white/5 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-500 transition-colors">
                          <Activity size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black italic uppercase tracking-tight text-white">{log.metric_label}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            {new Date(log.timestamp).toLocaleString()} • {log.payload?.component || 'System'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">SUCCESS</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center text-zinc-600 italic uppercase tracking-widest font-black">
                      Aucun log détecté pour cette période.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'Config' && (
              <motion.div 
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12 max-w-3xl"
              >
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-4">Quota de Stockage (GB)</label>
                    <input 
                      type="number" 
                      value={config.storage_limit}
                      onChange={(e) => setConfig({ ...config, storage_limit: parseInt(e.target.value) })}
                      className="w-full px-8 py-6 rounded-[32px] bg-white/5 border-2 border-transparent focus:border-blue-500/20 outline-none transition-all font-black text-2xl italic uppercase tracking-tight text-white" 
                    />
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-4">Activation des Modules</label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.keys(config.modules).map((module) => (
                        <button
                          key={module}
                          onClick={() => setConfig({
                            ...config,
                            modules: { ...config.modules, [module]: !config.modules[module] }
                          })}
                          className={`p-6 rounded-[24px] border-2 transition-all flex items-center justify-between ${
                            config.modules[module] 
                              ? 'bg-blue-600/10 border-blue-600/20 text-blue-500' 
                              : 'bg-white/5 border-transparent text-zinc-500'
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest italic">{module}</span>
                          {config.modules[module] ? <CheckCircle2 size={16} /> : <Lock size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="w-full py-8 bg-blue-600 text-white rounded-[40px] font-black text-sm uppercase tracking-[0.5em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/20 italic flex items-center justify-center gap-4"
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    Appliquer les Changements
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ManageEntityModal;
