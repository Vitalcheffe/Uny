
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Building, Shield, Bell, Key, Trash2, 
  AlertTriangle, X, Info, Loader2, Save, Cpu,
  Users, Fingerprint, Network, ShieldCheck, Zap
} from 'lucide-react';
import { firestoreService } from '../lib/supabase-data-layer';
import { useAuth } from '../context/AuthContext';

const SettingsPage: React.FC = () => {
  const { orgId, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'General' | 'Roles' | 'Security' | 'Danger'>('General');
  const [moatCount, setMoatCount] = useState(0);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    const fetchMoat = async () => {
      if (!orgId) return;
      try {
        const connections = await firestoreService.getCollection('connections', orgId);
        setMoatCount(connections.length);
      } catch (err) {
        console.error("Settings Moat Fetch Error:", err);
      }
    };
    fetchMoat();
  }, [orgId]);

  return (
    <div className="space-y-12 max-w-[1800px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="p-4 bg-blue-600/10 rounded-[24px] border border-blue-600/20 shadow-xl shadow-blue-500/5">
              <Settings size={28} className="animate-spin-slow" />
            </div>
            <div>
               <h1 className="text-5xl font-[950] italic uppercase tracking-tighter text-slate-900 leading-none">
                 Configuration <span className="text-blue-600">Noyau</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 mt-2">
                 Paramètres Système & Protocoles Logiques
               </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-xl p-2 rounded-full border border-slate-100 shadow-xl">
           {[
             { id: 'General', label: 'Unit', icon: Building },
             { id: 'Roles', label: 'Privileges', icon: Fingerprint },
             { id: 'Security', label: 'Bouclier', icon: Shield },
             { id: 'Danger', label: 'Purge', icon: AlertTriangle, color: 'text-rose-500' }
           ].map(tab => (
             <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-full transition-all duration-500 ${
                activeTab === tab.id 
                  ? 'bg-[#1a1615] text-white shadow-2xl scale-105' 
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
             >
               <tab.icon size={16} className={tab.color} />
               <span className="text-[10px] font-black uppercase tracking-widest italic">{tab.label}</span>
             </button>
           ))}
        </div>
      </div>

      <div className="w-full">
         <AnimatePresence mode="wait">
           {activeTab === 'General' && (
             <motion.div key="gen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 max-w-4xl">
                <div className="bg-white rounded-[56px] p-12 md:p-16 border border-slate-100 shadow-sm space-y-12 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                      <Network size={200} />
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Information de l'Entité</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Marqueurs d'identité pour l'indexation organisationnelle.</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Désignation Sociale</label>
                         <input type="text" defaultValue={profile?.metadata?.company_name} className="w-full px-8 py-6 rounded-[32px] bg-slate-50 border-2 border-slate-50 focus:border-blue-500/20 focus:bg-white outline-none transition-all font-black text-xl italic uppercase tracking-tight" />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Identifiant Fiscal / ICE</label>
                         <input type="text" placeholder="000XXXXXXX" className="w-full px-8 py-6 rounded-[32px] bg-slate-50 border-2 border-slate-50 focus:border-blue-500/20 focus:bg-white outline-none transition-all font-black text-xl italic uppercase tracking-tight" />
                      </div>
                   </div>
                </div>
                <div className="flex justify-end pr-8">
                  <button className="bg-[#1a1615] text-white px-14 py-7 rounded-full font-black text-xs uppercase tracking-[0.4em] flex items-center gap-4 hover:bg-blue-600 transition-all shadow-2xl italic group">
                     <Save size={18} className="group-hover:rotate-12 transition-transform" /> Valider la Calibration
                  </button>
                </div>
             </motion.div>
           )}

           {activeTab === 'Roles' && (
             <motion.div key="roles" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full">
                <div className="p-12 text-center text-slate-400 italic uppercase tracking-widest font-black">
                  Module de privilèges en cours de refactorisation.
                </div>
             </motion.div>
           )}

           {activeTab === 'Security' && (
             <motion.div key="security" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 max-w-4xl">
                <div className="bg-white rounded-[56px] p-16 border border-slate-100 shadow-sm space-y-12">
                   <div className="flex items-center gap-6 text-blue-600">
                      <ShieldCheck size={40} />
                      <h3 className="text-3xl font-[950] italic uppercase tracking-tighter">Protocole Bouclier Neural</h3>
                   </div>
                   <div className="grid grid-cols-1 gap-6">
                      {[
                        { label: 'Multi-Factor Auth (MFA)', status: 'Enabled', desc: 'Requires biometric validation for strategic capital movements.' },
                        { label: 'Protocol Logging', status: 'Optimal', desc: 'Every kernel interaction is permanently recorded in the telemetry stream.' },
                        { label: 'Data Sovereignty', status: 'Locked', desc: 'N4 encrypted handshake protocols for inter-unit communications.' }
                      ].map((item, i) => (
                        <div key={i} className="p-8 bg-slate-50 rounded-[40px] flex items-center justify-between border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                           <div className="space-y-1">
                              <p className="text-lg font-black italic uppercase tracking-tight text-slate-800">{item.label}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.status}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </motion.div>
           )}

           {activeTab === 'Danger' && (
             <motion.div key="danger" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 max-w-4xl">
                <div className="bg-white rounded-[56px] p-16 border-4 border-rose-100 shadow-2xl space-y-12 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                      <Trash2 size={240} className="text-rose-500" />
                   </div>
                   <div className="relative z-10 space-y-8">
                       <div className="flex items-center gap-6 text-rose-500">
                        <AlertTriangle size={48} />
                        <h3 className="text-4xl font-[950] italic uppercase tracking-tighter">Purge d'Urgence</h3>
                      </div>
                      <p className="text-lg font-bold text-slate-500 leading-relaxed uppercase tracking-tight max-w-2xl italic">
                        Le protocole "Révocation Absolue" dissoudra de manière permanente la matrice organisationnelle, effaçant toutes les synapses historiques et les journaux de télémétrie.
                      </p>
                      
                      <div className="p-10 bg-rose-50 rounded-[48px] border border-rose-100 flex items-center gap-8 shadow-inner">
                         <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-rose-500 shadow-2xl border border-rose-100">
                           <Zap size={40} fill="currentColor" />
                         </div>
                         <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-[0.4em] text-rose-600">Avertissement de Risque Cognitif</p>
                            <p className="text-sm font-bold text-rose-400 uppercase tracking-widest leading-relaxed">
                              Cette opération est atomique et irréversible. La récupération est impossible.
                            </p>
                         </div>
                      </div>

                      <button 
                        onClick={() => setDeleteModal(true)}
                        className="w-full py-8 bg-rose-500 text-white rounded-[40px] font-black text-sm uppercase tracking-[0.5em] hover:bg-rose-600 transition-all shadow-2xl shadow-rose-500/20 italic"
                      >
                        Dissoudre la Matrice de l'Organisation
                      </button>
                   </div>
                </div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {/* Moat Deletion Warning Modal */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteModal(false)} className="absolute inset-0 bg-[#1a1615]/95 backdrop-blur-3xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-3xl bg-[#1a1615] rounded-[80px] p-24 border border-white/10 text-white shadow-2xl text-center">
               <div className="space-y-12">
                  <div className="flex justify-center">
                    <div className="w-32 h-32 bg-rose-500/10 rounded-[40px] flex items-center justify-center text-rose-500 border border-rose-500/20 animate-pulse">
                       <Cpu size={64} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-6xl font-[950] italic uppercase tracking-tighter text-rose-500">Brèche de Nœud Détectée</h2>
                    <p className="text-2xl font-bold leading-relaxed italic opacity-80 uppercase tracking-tight">
                      Attention, Commandant. <br />
                      Vous allez détruire <span className="text-rose-500 font-black">{moatCount} CONNEXIONS NEURALES</span> que l'IA a tissé. 
                    </p>
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em] leading-relaxed italic max-w-xl mx-auto">
                    Le sacrifice de l'intelligence collective est définitif. Votre entreprise perdra son avantage cognitif immédiat. Confirmez le protocole d'autodestruction.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                     <button onClick={() => setDeleteModal(false)} className="py-7 bg-emerald-600 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] hover:bg-emerald-500 transition-all shadow-2xl italic">
                        AVORTER LE PROTOCOLE
                     </button>
                     <button className="py-7 bg-white/5 text-slate-500 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] hover:text-rose-500 hover:bg-rose-500/10 transition-all italic border border-white/5">
                        CONFIRMER LA PURGE
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
