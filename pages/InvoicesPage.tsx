
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Plus, Search, Filter, MoreHorizontal, 
  DollarSign, Calendar, Clock, AlertCircle, 
  CheckCircle2, Trash2, ChevronRight,
  ArrowUpRight, Landmark, Zap, X, Briefcase, Activity,
  CheckSquare, Square, Download, Trash
} from 'lucide-react';
import { firestoreService } from '../lib/supabase-data-layer';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { logTelemetry } from '../lib/telemetry';
import { formatMAD } from '../lib/local-adaptation';

const InternalLoader = ({ size = 24, className = "" }) => (
  <svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" 
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    className={`animate-spin ${className}`}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Sent: 'bg-blue-50 text-blue-600 border-blue-100',
    Draft: 'bg-slate-50 text-slate-500 border-slate-100',
    Overdue: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  const translatedStatus = status;
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status] || styles.Draft}`}>
      {translatedStatus}
    </span>
  );
};

const InvoicesPage: React.FC = () => {
  const { orgId, hasPermission } = useAuth();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    project_id: '',
    amount: '',
    due_date: '',
    status: 'Draft'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canWrite = hasPermission('finance', 'write');

  const fetchData = useCallback(async (isSilent = false) => {
    if (!orgId) return;
    if (!isSilent) setLoading(true);
    try {
      const [invData, projData] = await Promise.all([
        firestoreService.getCollection('invoices', orgId, [], 'created_at', 'desc'),
        firestoreService.getCollection('projects', orgId, [])
      ]);

      setInvoices(invData || []);
      setProjects((projData as Project[])?.filter(p => p.status !== 'Completed') || []);
      setSelectedIds(new Set()); 
    } catch (err) {
      console.error("Critical Revenue Scan Error:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();

    if (!orgId) return;

    const unsubscribe = firestoreService.subscribeToCollection(
      'invoices',
      orgId,
      [],
      (data) => setInvoices(data)
    );

    return () => unsubscribe();
  }, [fetchData, orgId]);

  const toggleSelectAll = () => {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkMarkAsPaid = async () => {
    if (!canWrite || selectedIds.size === 0) return;
    
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map(id => 
        firestoreService.updateDocument('invoices', orgId!, id, { status: 'Paid' })
      ));

      setInvoices(prev => prev.map(inv => ids.includes(inv.id) ? { ...inv, status: 'Paid' } : inv));
      
      logTelemetry(
        'AUTOPILOT_APPROVAL',
        `Bulk Status Update: ${ids.length} invoices marked as PAID`,
        {},
        { invoice_ids: ids },
        orgId!
      );
      
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk Status Update Failure:", err);
    }
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    
    const selectedInvoices = invoices.filter(i => selectedIds.has(i.id));
    const headers = ['ID', 'Client', 'Amount', 'Status', 'Due Date'];
    const csvContent = [
      headers.join(','),
      ...selectedInvoices.map(i => [
        i.id,
        `"${i.client_name}"`,
        i.amount,
        i.status,
        i.due_date
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `uny_invoices_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logTelemetry(
      'NEURAL_INTERACTION',
      `Financial Grid Export: ${selectedIds.size} nodes`,
      {},
      { count: selectedIds.size },
      orgId!
    );
  };

  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + (Number((inv as any).amount) || 0), 0);
    const paid = invoices.filter(i => (i as any).status === 'Paid').reduce((sum, inv) => sum + (Number((inv as any).amount) || 0), 0);
    const pending = invoices.filter(i => (i as any).status !== 'Paid').reduce((sum, inv) => sum + (Number((inv as any).amount) || 0), 0);
    return { total, paid, pending };
  }, [invoices]);

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    if (!canWrite) return;
    try {
      await firestoreService.updateDocument('invoices', orgId!, invoiceId, { status: newStatus });
      
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv));
      
      const inv = invoices.find(i => i.id === invoiceId);
      logTelemetry(
        'AUTOPILOT_APPROVAL',
        `Invoice ${invoiceId.slice(0,8)} status updated to ${newStatus}`,
        {},
        { invoice_id: invoiceId, status: newStatus, amount: inv?.amount },
        orgId!
      );
    } catch (err) {
      console.error("Neural Status Update Failure:", err);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    if (!formData.project_id || !formData.amount) {
      setError('Project link and financial magnitude required.');
      return;
    }

    setFormLoading(true);
    setError(null);

    const selectedProject = projects.find(p => p.id === formData.project_id);

    try {
      const docId = await firestoreService.addDocument('invoices', orgId!, {
        project_id: formData.project_id,
        client_name: typeof selectedProject?.client === 'string' ? selectedProject.client : 'Client Node',
        amount: Number(formData.amount),
        status: formData.status,
        due_date: formData.due_date || null,
        created_at: new Date().toISOString()
      });

      setShowModal(false);
      setFormData({ project_id: '', amount: '', due_date: '', status: 'Draft' });
      fetchData();

      logTelemetry(
        'VELOCITY_DRIFT',
        `Revenue Node Committed: ${formatMAD(Number(formData.amount))} for ${selectedProject?.name}`,
        {},
        { invoice_id: docId, amount: formData.amount },
        orgId!
      );
    } catch (err: any) {
      setError(err.message || 'Interruption du protocole de commit.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-12 max-w-[1700px] mx-auto pb-24 relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="p-3 bg-emerald-600/10 rounded-2xl border border-emerald-600/20">
              <FileText size={24} />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              HUB <span className="text-emerald-600">FACTURES</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.5em] ml-16 italic">Orchestration du Nœud de Revenus</p>
        </div>

        {canWrite && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-10 py-5 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 shadow-xl transition-all italic shrink-0"
          >
            <Plus size={16} /> + GENERATE INVOICE
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white p-10 rounded-[48px] border border-slate-50 shadow-sm space-y-4 group hover:shadow-xl transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Landmark size={80} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Volume Total Facturé</p>
            <h3 className="text-4xl font-[950] italic tracking-tighter text-slate-900 uppercase">
              {formatMAD(stats.total, false)}
            </h3>
            <div className="h-1 w-20 bg-blue-500 rounded-full" />
         </div>
         <div className="bg-white p-10 rounded-[48px] border border-slate-50 shadow-sm space-y-4 group hover:shadow-xl transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <CheckCircle2 size={80} className="text-emerald-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Total Encaissé</p>
            <h3 className="text-4xl font-[950] italic tracking-tighter text-emerald-600 uppercase">
              {formatMAD(stats.paid, false)}
            </h3>
            <div className="h-1 w-20 bg-emerald-500 rounded-full" />
         </div>
         <div className="bg-white p-10 rounded-[48px] border border-slate-50 shadow-sm space-y-4 group hover:shadow-xl transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Clock size={80} className="text-amber-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Volume en Attente (Latent)</p>
            <h3 className="text-4xl font-[950] italic tracking-tighter text-amber-500 uppercase">
              {formatMAD(stats.pending, false)}
            </h3>
            <div className="h-1 w-20 bg-amber-500 rounded-full" />
         </div>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-6">
            <InternalLoader size={48} className="text-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronisation du Kernel...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-8">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <FileText size={48} />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black italic uppercase text-slate-800">Aucun node financier détecté</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Initialisez votre première facture pour activer le tracking.</p>
            </div>
            {canWrite && (
              <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-blue-500 transition-all italic"
              >
                + GENERATE INVOICE
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Grille de <span className="text-blue-600">Facturation</span></h3>
                  <div className="px-4 py-1.5 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Derniers Signaux
                  </div>
               </div>
               {canWrite && (
                 <button 
                   onClick={() => setShowModal(true)}
                   className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                 >
                   Générer une Transmission de Invoice
                 </button>
               )}
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-10 py-6 w-12">
                    <button 
                      onClick={toggleSelectAll}
                      className="p-1 text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      {selectedIds.size === invoices.length && invoices.length > 0 ? <CheckSquare size={20} className="text-blue-500" /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-10 py-6">Mission / Client</th>
                  <th className="px-10 py-6">ID Signal</th>
                  <th className="px-10 py-6 text-right">Volume</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6">Date Limite</th>
                  <th className="px-10 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold text-slate-800">
                {invoices.map((inv) => (
                  <tr 
                    key={inv.id} 
                    className={`transition-colors group ${selectedIds.has(inv.id) ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
                    onClick={() => toggleSelect(inv.id)}
                  >
                    <td className="px-10 py-8">
                       <button 
                        onClick={(e) => { e.stopPropagation(); toggleSelect(inv.id); }}
                        className={`transition-colors ${selectedIds.has(inv.id) ? 'text-blue-500' : 'text-slate-200 group-hover:text-slate-400'}`}
                       >
                         {selectedIds.has(inv.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                       </button>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-1">
                        <span className="text-lg italic uppercase tracking-tight block truncate max-w-xs">{inv.client_name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Nœud de Project Lié</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 font-mono text-[10px] text-slate-400">#INV-{inv.id?.slice(0, 8).toUpperCase() || '---'}</td>
                    <td className="px-10 py-8 text-right">
                       <span className="text-xl font-[950] italic tracking-tighter">{formatMAD(Number(inv.amount) || 0)}</span>
                    </td>
                    <td className="px-10 py-8">
                      <select 
                        value={inv.status}
                        disabled={!canWrite}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border transition-all ${canWrite ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${
                          inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          inv.status === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          inv.status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={12} /> {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'À définir'}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={(e) => e.stopPropagation()} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-black transition-all shadow-sm">
                           <MoreHorizontal size={16} />
                         </button>
                         <button onClick={(e) => e.stopPropagation()} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-500 transition-all shadow-sm">
                           <ArrowUpRight size={16} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedIds.size > 0 && canWrite && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[400] w-full max-w-2xl px-6"
          >
            <div className="bg-[#1a1615] text-white p-6 rounded-[32px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-between gap-8">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <Zap size={24} fill="white" />
                  </div>
                  <div>
                    <p className="text-xl font-black italic tracking-tighter uppercase leading-none">{selectedIds.size} NŒUDS SÉLECTIONNÉS</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-1">Mode de Commande Collective</p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <button 
                    onClick={handleBulkMarkAsPaid}
                    className="flex items-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl transition-all shadow-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    <CheckCircle2 size={16} /> Marquer Paid
                  </button>
                  <button 
                    onClick={handleBulkExport}
                    className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
                  >
                    <Download size={16} /> Export CSV
                  </button>
                  <div className="h-10 w-px bg-white/10 mx-2" />
                  <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="p-4 bg-white/5 hover:bg-rose-600 transition-all rounded-2xl text-slate-500 hover:text-white"
                  >
                    <X size={20} />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
                <X size={24} />
              </button>

              <header className="mb-12 space-y-4">
                <div className="flex items-center gap-4 text-emerald-600">
                  <Landmark size={24} />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Provisionnement des Revenus</span>
                </div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
                  INITIALISER <br /> <span className="text-emerald-500">NODE FACTURE</span>
                </h2>
              </header>

              <form onSubmit={handleCreateInvoice} className="space-y-8">
                {error && (
                  <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 italic">
                    <AlertCircle size={18} /> {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nœud de Mission Source</label>
                  <div className="relative group">
                    <Briefcase size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    <select 
                      required
                      value={formData.project_id}
                      onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:bg-white focus:border-emerald-500 font-bold transition-all text-sm italic appearance-none cursor-pointer"
                    >
                      <option value="">Sélectionner Node Mission</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Magnitude (MAD)</label>
                    <div className="relative">
                      <DollarSign size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      <input 
                        type="number" required value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        placeholder="0.00"
                        className="w-full pl-16 pr-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-[950] text-lg italic text-emerald-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Date d'Interception</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      <input 
                        type="date" value={formData.due_date}
                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                        className="w-full pl-16 pr-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-bold text-sm italic text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">État Initial du Protocole</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Draft', 'Sent', 'Paid', 'Overdue'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({...formData, status: s})}
                        className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                          formData.status === s 
                          ? (s === 'Paid' ? 'bg-emerald-500 text-white border-emerald-500' : 
                             s === 'Sent' ? 'bg-blue-600 text-white border-blue-600' :
                             s === 'Overdue' ? 'bg-rose-500 text-white border-rose-500' :
                             'bg-black text-white border-black')
                          : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {s === 'Draft' ? 'Draft' : s === 'Sent' ? 'Sent' : s === 'Paid' ? 'Paid' : 'Overdue'}
                      </button>
                    ))}
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
                    className="py-6 bg-emerald-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 italic"
                  >
                    {formLoading ? <InternalLoader size={18} /> : (
                      <>
                        <Zap size={16} /> COMMITER LA FACTURE
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

export default InvoicesPage;
