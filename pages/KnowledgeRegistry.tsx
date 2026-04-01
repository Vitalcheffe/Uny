
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../lib/supabase-data-layer';
import { aiAnalysisService } from '../services/ai-analysis-service';
import { 
  Brain, Search, CheckCircle, XCircle, 
  FileText, TrendingUp, Users, Calendar,
  DollarSign, AlertCircle, Loader2, X,
  ShieldCheck, Database, ExternalLink, Sparkles,
  Zap, Link as LinkIcon, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const KnowledgeRegistry = () => {
  const { orgId, profile } = useAuth();
  const [atoms, setAtoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedAtom, setSelectedAtom] = useState<any>(null);
  
  const fetchAtoms = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await firestoreService.getCollection('knowledge_atoms', orgId, [], 'extracted_at', 'desc');
      
      // Fetch source documents for each atom (simplified enrichment)
      const enrichedAtoms = await Promise.all((data || []).map(async (atom: any) => {
        if (atom.source_document_id) {
          const doc = await firestoreService.getDocument('documents', orgId, atom.source_document_id);
          return { ...atom, source_document: doc };
        }
        return atom;
      }));

      setAtoms(enrichedAtoms);
    } catch (err) {
      console.error('Registry Access Error:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchAtoms(); }, [fetchAtoms, orgId]);
  
  const validateAtom = async (atomId: string, action: 'approve' | 'reject') => {
    try {
      await firestoreService.updateDocument('knowledge_atoms', orgId!, atomId, {
        validation_status: action === 'approve' ? 'approved' : 'rejected',
        validated_by: profile?.id,
        validated_at: new Date().toISOString()
      });
      fetchAtoms();
      setSelectedAtom(null);
    } catch (err) {
      console.error('Validation Error:', err);
    }
  };

  const handleRunAnalysis = async () => {
    if (!orgId) return;
    setIsAnalyzing(true);
    try {
      await aiAnalysisService.analyzeAllPendingDocuments(orgId);
      // Optionally refresh data if analyses affect the registry view
      await fetchAtoms();
    } catch (error) {
      console.error("Error running AI analysis:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const filteredAtoms = atoms.filter(atom =>
    atom.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    atom.value_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-slate-50 p-12 space-y-12 pb-32">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="p-5 bg-[#1a1615] rounded-[24px] text-white shadow-2xl group-hover:rotate-6 transition-all">
            <Brain size={36} className="text-blue-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-[950] text-slate-900 tracking-tighter leading-none italic uppercase">Archive <span className="text-blue-600">Analytique</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] italic flex items-center gap-3">
              <Database size={12} /> Matrice d'Intelligence Légale // Racine : {orgId}
            </p>
          </div>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className={`px-8 py-4 rounded-[32px] font-black text-[11px] uppercase tracking-[0.4em] italic flex items-center gap-4 transition-all shadow-xl ${
            isAnalyzing 
              ? 'bg-slate-900 text-blue-400 shadow-blue-500/20' 
              : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-blue-500/40'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="relative flex items-center justify-center w-6 h-6">
                <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-blue-400 rounded-full border-t-transparent animate-spin" style={{ filter: 'drop-shadow(0 0 4px rgba(96, 165, 250, 0.8))' }}></div>
              </div>
              <span className="animate-pulse" style={{ textShadow: '0 0 8px rgba(96, 165, 250, 0.5)' }}>Analyse IA en cours...</span>
            </>
          ) : (
            <>
              <Play size={18} /> Lancer l'Analyse IA
            </>
          )}
        </button>
      </header>
      
      <div className="bg-white border border-slate-200 rounded-[48px] p-8 shadow-sm flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Rechercher des Atomes d'Intelligence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:ring-8 focus:ring-blue-500/5 outline-none transition-all font-bold italic"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="py-48 flex flex-col items-center gap-8 opacity-40">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.8em]">Analyse Profonde des Nœuds d'Archive...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredAtoms.map((atom) => (
            <motion.div
              key={atom.id}
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-white border border-slate-200 rounded-[40px] p-10 hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
              onClick={() => setSelectedAtom(atom)}
            >
              <div className="relative z-10 flex flex-col h-full space-y-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                        {atom.category === 'financial' ? <DollarSign size={20} /> : <Users size={20} />}
                     </div>
                     <div>
                        <h3 className="text-2xl font-[950] italic uppercase tracking-tighter text-slate-900 leading-none">{atom.value_text}</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Nœud {atom.category}</p>
                     </div>
                  </div>
                  <div className="px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-black text-slate-400">
                    {atom.confidence_score}% Sync
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-all border border-slate-100">
                         <LinkIcon size={16} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Source de Lignage</p>
                        <p className="text-[10px] font-bold text-slate-500 truncate max-w-[200px] mt-1">{atom.source_document?.file_name}</p>
                      </div>
                   </div>
                   <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                     atom.validation_status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                   }`}>
                     {atom.validation_status === 'approved' ? 'Approuvé' : atom.validation_status === 'rejected' ? 'Rejeté' : 'En attente'}
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL WITH LINEAGE badges */}
      <AnimatePresence>
        {selectedAtom && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAtom(null)} className="absolute inset-0 bg-[#1a1615]/95 backdrop-blur-3xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative w-full max-w-5xl bg-white rounded-[64px] p-16 shadow-2xl overflow-hidden">
               <button onClick={() => setSelectedAtom(null)} className="absolute top-12 right-12 p-4 bg-slate-50 rounded-full hover:bg-slate-100 transition-all text-slate-400 hover:rotate-90">
                 <X size={28} />
               </button>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  <div className="space-y-12">
                     <header className="space-y-6">
                        <div className="flex items-center gap-4 text-blue-600">
                           <Sparkles size={24} className="animate-pulse" />
                           <span className="text-[11px] font-black uppercase tracking-[0.6em]">Nœud de Fait Extrait</span>
                        </div>
                        <h2 className="text-6xl font-[950] italic uppercase tracking-tighter text-slate-900 leading-[0.9]">{selectedAtom.value_text}</h2>
                     </header>

                     <div className="space-y-8">
                        <div className="p-10 bg-slate-50 rounded-[48px] border border-slate-100 relative overflow-hidden">
                           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">Traces de Contexte Neural</p>
                           <p className="text-xl font-bold italic leading-relaxed text-slate-700 uppercase tracking-tighter italic">
                             "...{selectedAtom.extraction_context}..."
                           </p>
                        </div>

                        <div className="flex items-center gap-6 p-8 bg-blue-600 text-white rounded-[40px] shadow-2xl shadow-blue-500/30 group cursor-pointer overflow-hidden relative">
                           <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                           <div className="p-4 bg-white/20 rounded-2xl">
                             <FileText size={24} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Authentification de la Source</p>
                              <p className="text-lg font-black italic tracking-tight truncate uppercase italic">{selectedAtom.source_document?.file_name}</p>
                           </div>
                           <ExternalLink size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-10 flex flex-col justify-between">
                     <div className="space-y-10">
                        <div className="p-10 bg-white border border-slate-200 rounded-[48px] space-y-6 shadow-inner">
                           <div className="flex items-center gap-3 text-slate-900">
                              <ShieldCheck size={20} className="text-emerald-500" />
                              <h4 className="text-[11px] font-black uppercase tracking-[0.4em]">Logique de Raisonnement IA</h4>
                           </div>
                           <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-widest italic">
                             {selectedAtom.ai_reasoning}
                           </p>
                        </div>

                        <div className="bg-slate-900 text-white rounded-[40px] p-10 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={100} /></div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4">Nœud Analytique Structuré (JSON)</p>
                           <pre className="text-[10px] font-mono opacity-80 overflow-x-auto p-4 bg-black/30 rounded-2xl">
                             {JSON.stringify(selectedAtom.value, null, 2)}
                           </pre>
                        </div>
                     </div>

                     <div className="flex gap-6">
                        <button onClick={() => validateAtom(selectedAtom.id, 'approve')} className="flex-1 py-7 bg-emerald-600 text-white rounded-[32px] font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-emerald-500 transition-all italic flex items-center justify-center gap-4">
                           <CheckCircle size={20} /> Autoriser le Fait
                        </button>
                        <button onClick={() => validateAtom(selectedAtom.id, 'reject')} className="px-10 py-7 bg-rose-50 text-rose-600 rounded-[32px] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-rose-600 hover:text-white transition-all italic border border-rose-100">
                           Révoquer
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KnowledgeRegistry;
