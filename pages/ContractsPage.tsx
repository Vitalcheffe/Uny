
import React, { useState, useEffect, useCallback } from 'react';
import { motion as _motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, FileCheck, Plus, AlertTriangle, 
  ChevronRight, X, Trash2, Calendar, Landmark, 
  Info, Loader2, Briefcase, User, Truck, Clock, Search,
  Timer, Zap
} from 'lucide-react';
import { firestoreService } from '../lib/supabase-data-layer';
import { useAuth } from '../context/AuthContext';
import { formatMAD } from '../lib/local-adaptation';

// Fix: Cast motion to any to resolve property errors
const motion = _motion as any;

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Pending: 'bg-amber-50 text-amber-600 border-amber-100',
    Expired: 'bg-rose-50 text-rose-600 border-rose-100',
    Terminated: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
};

const ContractsPage: React.FC = () => {
  const { orgId } = useAuth();
  
  // Data States
  const [contracts, setContracts] = useState<any[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // UI States
  const [showModal, setShowModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    contract_type: 'Prestation',
    party_name: '',
    party_type: 'client',
    start_date: '',
    end_date: '',
    amount: '',
    notes: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await firestoreService.getCollection(
        'contracts',
        orgId!,
        [],
        'end_date',
        'asc'
      );

      const list = data || [];
      setContracts(list);

      // Alert Logic: 30 days window
      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);

      const expiring = list.filter(c => {
        if (!(c as any).end_date) return false;
        const endDate = new Date((c as any).end_date);
        return endDate >= today && endDate <= in30Days;
      });
      setExpiringContracts(expiring);
    } catch (err) {
      console.error("Vault Access Error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.party_name || !formData.start_date) {
      setError('Les paramètres vitaux (Titre, Partie, Date début) sont requis.');
      return;
    }

    setFormLoading(true);
    setError(null);

    try {
      await firestoreService.addDocument('contracts', orgId!, {
        title: formData.title,
        contract_type: formData.contract_type,
        party_name: formData.party_name,
        party_type: formData.party_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        amount: formData.amount ? Number(formData.amount) : null,
        status: 'Active',
        notes: formData.notes || null,
        created_at: new Date().toISOString()
      });

      setShowModal(false);
      setFormData({ title: '', contract_type: 'Prestation', party_name: '', party_type: 'client', start_date: '', end_date: '', amount: '', notes: '' });
      fetchContracts();
    } catch (err: any) {
      setError(err.message || "Erreur d'écriture dans la blockchain UNY.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous révoquer ce node contractuel ? Cette action est irréversible.')) return;
    try {
      await firestoreService.deleteDocument('contracts', orgId!, id);
      setDrawerOpen(false);
      setSelectedContract(null);
      fetchContracts();
    } catch (err) {
      console.error("Revocation failure:", err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'CDI': return '👔';
      case 'CDD': return '📄';
      case 'Prestation': return '🤝';
      case 'Bail': return '🏢';
      default: return '📋';
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.party_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 max-w-[1700px] mx-auto pb-24 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              CONTRACTS <span className="text-blue-600">VAULT</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.5em] ml-16 italic">Coffre-fort Juridique Souverain</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative group flex-1 md:w-80">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Chercher un node légal..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-full py-4 pl-14 pr-6 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 font-bold italic"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-10 py-5 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 shadow-xl transition-all italic shrink-0"
          >
            <Plus size={16} /> + NOUVEAU CONTRAT
          </button>
        </div>
      </div>

      {/* Expiration Alerts Area */}
      <AnimatePresence>
        {expiringContracts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border border-rose-100 rounded-[40px] p-10 space-y-6 shadow-[0_30px_60px_-15px_rgba(239,68,68,0.1)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-rose-600">
                <AlertTriangle size={24} className="animate-pulse" />
                <h3 className="text-xl font-black italic uppercase tracking-tight">Alertes d'Expiration Imminente</h3>
              </div>
              <span className="px-4 py-1.5 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                {expiringContracts.length} Nodes à Risque
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expiringContracts.map(contract => {
                const today = new Date();
                const endDate = new Date(contract.end_date);
                const startDate = new Date(contract.start_date);
                const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                
                const totalDuration = endDate.getTime() - startDate.getTime();
                const elapsed = today.getTime() - startDate.getTime();
                const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

                return (
                  <div key={contract.id} className="bg-white/80 p-6 rounded-3xl border border-rose-100 space-y-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                         <p className="text-sm font-black uppercase italic tracking-tight text-slate-900 truncate pr-4">{contract.title}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{contract.party_name}</p>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] font-black text-rose-500 italic whitespace-nowrap">{daysLeft} jours</span>
                         <div className="flex gap-0.5 mt-1">
                            {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                         </div>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-rose-100/50 rounded-full overflow-hidden relative">
                       {/* Subtle tech grid background pattern */}
                       <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
                       <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ 
                          width: `${progress}%`,
                        }} 
                        transition={{
                          width: { duration: 2, ease: "circOut" }
                        }}
                        className="h-full bg-gradient-to-r from-rose-400 to-rose-600 relative rounded-full"
                       >
                          <motion.div 
                            animate={{ 
                              opacity: [0.3, 0.8, 0.3],
                              x: ['-100%', '200%']
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          />
                       </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Contracts List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-6">
            <Loader2 className="animate-spin text-slate-200" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Scan du Vault en cours...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-8 bg-white/50 border-2 border-dashed border-slate-200 rounded-[64px]">
             <ShieldCheck size={64} className="text-slate-200" />
             <div className="space-y-2">
                <h3 className="text-xl font-black italic uppercase text-slate-800">Vault de Données Vide</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initialisez votre premier node légal pour activer le tracking de conformité.</p>
             </div>
             <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-blue-500 transition-all italic">
                + INITIALISER CONTRAT
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
             {filteredContracts.map(contract => {
               const hasEndDate = !!contract.end_date;
               let progress = 0;
               let daysLeft = 0;
               let isUrgent = false;

               if (hasEndDate) {
                 const today = new Date();
                 const startDate = new Date(contract.start_date);
                 const endDate = new Date(contract.end_date);
                 const total = endDate.getTime() - startDate.getTime();
                 const elapsed = today.getTime() - startDate.getTime();
                 progress = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                 daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                 isUrgent = daysLeft <= 30;
               }

               return (
                 <motion.div 
                  key={contract.id}
                  layoutId={contract.id}
                  onClick={() => { setSelectedContract(contract); setDrawerOpen(true); }}
                  whileHover={{ y: -4, scale: 1.005 }}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                 >
                    {isUrgent && (
                      <div className="absolute top-0 left-0 h-full w-1 bg-rose-500 animate-pulse" />
                    )}
                    
                    <div className="flex items-center gap-6 mb-4 md:mb-0 min-w-[280px] relative z-10">
                       <div className="w-16 h-16 bg-slate-50 text-2xl flex items-center justify-center rounded-2xl group-hover:rotate-6 transition-transform shadow-inner border border-slate-100 shrink-0">
                          {getTypeIcon(contract.contract_type)}
                       </div>
                       <div className="min-w-0">
                          <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors leading-none mb-2 truncate">{contract.title}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                             {contract.party_name} <span className="mx-2 opacity-30">/</span> {contract.contract_type}
                          </p>
                       </div>
                    </div>

                    <div className="flex flex-col md:items-center gap-2 mb-4 md:mb-0 flex-1 px-8 relative z-10">
                       <div className="w-full flex justify-between items-end mb-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Temporal Range</p>
                          {hasEndDate && (
                            <div className={`flex items-center gap-1.5 ${isUrgent ? 'text-rose-500' : 'text-slate-400'}`}>
                               <Timer size={10} className={isUrgent ? 'animate-spin-slow' : ''} />
                               <span className="text-[9px] font-black uppercase tracking-widest">{daysLeft} jours restants</span>
                            </div>
                          )}
                       </div>
                       
                       <div className="w-full flex items-center gap-3 text-xs font-bold text-slate-600">
                          <span className="whitespace-nowrap">{new Date(contract.start_date).toLocaleDateString('fr-FR')}</span>
                          <ChevronRight size={14} className="text-slate-300 shrink-0" />
                          <span className={`${contract.end_date ? '' : 'text-blue-500'} whitespace-nowrap`}>
                            {contract.end_date ? new Date(contract.end_date).toLocaleDateString('fr-FR') : 'Indéterminée'}
                          </span>
                       </div>

                       {hasEndDate && (
                         <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden relative border border-slate-200/50">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ 
                                width: `${progress}%`,
                                opacity: isUrgent ? [0.7, 1, 0.7] : 1,
                                scaleY: isUrgent ? [1, 1.2, 1] : 1
                              }} 
                              transition={{
                                width: { duration: 1.5, ease: "easeOut" },
                                opacity: isUrgent ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : { duration: 0.3 },
                                scaleY: isUrgent ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : { duration: 0.3 }
                              }}
                              className={`h-full rounded-full relative ${isUrgent ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`} 
                            >
                               {isUrgent && (
                                 <motion.div 
                                    animate={{ x: ['0%', '100%'], opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 w-1/4 bg-white/30 skew-x-12"
                                 />
                               )}
                            </motion.div>
                         </div>
                       )}
                    </div>

                    <div className="flex items-center gap-6 shrink-0 relative z-10">
                       <div className="text-right">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Magnitude</p>
                          <p className="text-xl font-black italic tracking-tighter text-slate-800">
                             {contract.amount ? formatMAD(Number(contract.amount)) : '---'}
                          </p>
                       </div>
                       <StatusBadge status={contract.status} />
                       <div className="p-3 bg-slate-50 rounded-xl text-slate-200 group-hover:text-black group-hover:bg-slate-100 transition-all">
                          <ChevronRight size={18} />
                       </div>
                    </div>
                 </motion.div>
               );
             })}
          </div>
        )}
      </div>

      {/* Details Drawer */}
      <AnimatePresence>
        {drawerOpen && selectedContract && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setDrawerOpen(false); setSelectedContract(null); }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-xl bg-white shadow-2xl z-[201] p-12 flex flex-col overflow-y-auto no-scrollbar"
            >
              <button onClick={() => { setDrawerOpen(false); setSelectedContract(null); }} className="absolute top-10 right-10 p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
                <X size={24} />
              </button>

              <header className="space-y-8 mb-16">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center text-4xl shadow-2xl shrink-0">
                       {getTypeIcon(selectedContract.contract_type)}
                    </div>
                    <div className="space-y-3">
                       <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{selectedContract.title}</h2>
                       <StatusBadge status={selectedContract.status} />
                    </div>
                 </div>
              </header>

              <div className="space-y-10 flex-1">
                 <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Target Party</h4>
                    <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-6">
                       <div className="p-4 bg-white rounded-2xl text-blue-500 shadow-sm">
                          {selectedContract.party_type === 'client' ? <Briefcase size={24} /> : 
                           selectedContract.party_type === 'employee' ? <User size={24} /> : <Truck size={24} />}
                       </div>
                       <div>
                          <p className="text-lg font-black italic tracking-tight text-slate-900">{selectedContract.party_name}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedContract.party_type} Protocol</p>
                       </div>
                    </div>
                 </section>

                 <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Temporal Validity</h4>
                    <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 grid grid-cols-2 gap-8 relative overflow-hidden">
                       <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest italic">Activation</p>
                          <p className="text-lg font-black italic text-slate-800">{new Date(selectedContract.start_date).toLocaleDateString('fr-FR')}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest italic">Termination</p>
                          <p className="text-lg font-black italic text-slate-800">{selectedContract.end_date ? new Date(selectedContract.end_date).toLocaleDateString('fr-FR') : 'Indéterminée'}</p>
                       </div>
                    </div>
                 </section>

                 {selectedContract.amount && (
                   <section className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Financial Magnitude</h4>
                      <div className="p-8 bg-emerald-50/50 rounded-[32px] border border-emerald-100 flex items-center justify-between">
                         <div className="p-4 bg-white rounded-2xl text-emerald-500 shadow-sm border border-emerald-100">
                            <Landmark size={24} />
                         </div>
                         <p className="text-4xl font-[950] italic tracking-tighter text-emerald-600 leading-none">
                           {Number(selectedContract.amount).toLocaleString()} <span className="text-lg uppercase">Mad</span>
                         </p>
                      </div>
                   </section>
                 )}

                 {selectedContract.notes && (
                   <section className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Operational Notes</h4>
                      <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                         <p className="text-xs font-bold text-slate-500 italic leading-relaxed">{selectedContract.notes}</p>
                      </div>
                   </section>
                 )}
              </div>

              <div className="pt-16 flex gap-4">
                 <button 
                  onClick={() => handleDelete(selectedContract.id)}
                  className="flex-1 py-6 bg-rose-50 text-rose-600 border border-rose-100 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-rose-100 transition-all italic"
                 >
                   <Trash2 size={16} /> RÉVOQUER NODE
                 </button>
                 <button className="flex-1 py-6 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl italic">
                   <Clock size={16} /> HISTORIQUE
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-[#1a1615]/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[48px] p-16 shadow-2xl border border-slate-100 overflow-hidden"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-black">
                <X size={24} />
              </button>

              <header className="mb-12 space-y-4">
                <div className="flex items-center gap-4 text-blue-600">
                  <Landmark size={24} />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Vault Provisioning</span>
                </div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
                  INITIALISER <br /> <span className="text-blue-500">NODE CONTRAT</span>
                </h2>
              </header>

              <form onSubmit={handleCreate} className="space-y-8 no-scrollbar max-h-[60vh] overflow-y-auto px-1">
                {error && (
                  <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 italic">
                    <AlertTriangle size={18} /> {error}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Identification du Contract</label>
                    <input 
                      type="text" required value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. Master Services Agreement"
                      className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-bold text-lg italic text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Type de Liaison</label>
                    <select 
                      value={formData.contract_type}
                      onChange={(e) => setFormData({...formData, contract_type: e.target.value})}
                      className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-bold text-sm italic cursor-pointer appearance-none"
                    >
                      <option value="Prestation">Accord de Prestation</option>
                      <option value="CDI">Liaison CDI</option>
                      <option value="CDD">Mission CDD</option>
                      <option value="Bail">Bail Immobilier</option>
                      <option value="Partenariat">Node Partenariat</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Node de la Partie</label>
                    <input 
                      type="text" required value={formData.party_name}
                      onChange={(e) => setFormData({...formData, party_name: e.target.value})}
                      placeholder="e.g. Nexus Global HQ"
                      className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-bold text-lg italic text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Catégorie de Partie</label>
                    <select 
                      value={formData.party_type}
                      onChange={(e) => setFormData({...formData, party_type: e.target.value})}
                      className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-bold text-sm italic cursor-pointer appearance-none"
                    >
                      <option value="client">Client Stratégique</option>
                      <option value="employee">Opérative Interne</option>
                      <option value="supplier">Fournisseur de Nodes</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Activation (Début)</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      <input 
                        type="date" required value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="w-full pl-16 pr-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-bold text-sm italic"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Interception (Fin)</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      <input 
                        type="date" value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        className="w-full pl-16 pr-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-bold text-sm italic"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Volume Financier (Optionnel)</label>
                      <input 
                        type="number" value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        placeholder="0.00"
                        className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-bold text-lg text-slate-800"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Notes de Calibration</label>
                      <textarea 
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="..."
                        className="w-full px-8 py-4 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-bold text-sm h-[58px] resize-none"
                      />
                   </div>
                </div>

                <div className="pt-8 grid grid-cols-2 gap-6">
                  <button 
                    type="button" onClick={() => setShowModal(false)}
                    className="py-6 bg-slate-50 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-slate-100 transition-all italic border border-slate-100"
                  >
                    ANNULER
                  </button>
                  <button 
                    type="submit" disabled={formLoading}
                    className="py-6 bg-blue-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 italic"
                  >
                    {formLoading ? <Loader2 className="animate-spin" size={18} /> : (
                      <>
                        <ShieldCheck size={16} /> COMMITER LE NODE
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContractsPage;
