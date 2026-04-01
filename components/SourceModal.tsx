
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, FileText, ShieldCheck } from 'lucide-react';

interface SourceModalProps {
  atom: Record<string, any> | null;
  isOpen: boolean;
  onClose: () => void;
}

const SourceModal: React.FC<SourceModalProps> = ({ atom, isOpen, onClose }) => {
  if (!atom) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-[#1a1615]/90 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }} 
            className="relative w-full max-w-2xl bg-white rounded-[48px] p-12 shadow-2xl border border-white/10 overflow-hidden"
          >
             <button onClick={onClose} className="absolute top-10 right-10 p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
               <X size={24} />
             </button>
             
             <div className="space-y-10">
                <header className="space-y-4">
                   <div className="flex items-center gap-3 text-blue-600">
                      <FileText size={20} />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em]">Source de Données Légales</span>
                   </div>
                   <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">
                     Protocole de Vérification
                   </h2>
                </header>
                
                <div className="space-y-8">
                   <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                         <p className="text-[9px] font-black uppercase text-slate-400 italic leading-none tracking-widest">Information Extraite</p>
                         <div className="px-3 py-1 rounded-full text-[8px] font-black bg-blue-50 text-blue-600 uppercase border border-blue-100">
                            {atom.confidence_score}% Correspondance IA
                         </div>
                      </div>
                      <p className="text-3xl font-black italic text-slate-900 tracking-tighter">{atom.value_text}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase mt-2">{atom.category} // {atom.entity_type}</p>
                   </div>

                   <div className="p-8 bg-white border border-slate-100 rounded-[32px]">
                      <div className="flex items-center justify-between mb-4">
                         <p className="text-[9px] font-black uppercase text-slate-400 italic leading-none tracking-widest">Trace Documentaire</p>
                         <button className="text-[9px] font-black uppercase text-blue-600 hover:underline flex items-center gap-1">
                            Ouvrir l'Archive <ExternalLink size={10} />
                         </button>
                      </div>
                      <p className="text-sm font-bold leading-relaxed text-slate-600 italic uppercase tracking-tighter">
                        "...{atom.extraction_context}..."
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase mt-4">Source : {atom.source_document?.file_name}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase">Extraction : {atom.source_location}</p>
                   </div>
                   
                   <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4">
                      <ShieldCheck size={20} className="text-emerald-600" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-emerald-600 leading-none tracking-widest italic">Statut d'Autorisation</p>
                        <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-tight italic mt-1">
                          {atom.validation_status === 'approved' ? 'Fait vérifié et validé dans la matrice.' : 'En attente d\'autorisation du commandant.'}
                        </p>
                      </div>
                   </div>
                </div>
                
                <button 
                  onClick={onClose}
                  className="w-full py-6 bg-black text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all italic active:scale-95"
                >
                  Fermer l'Aperçu
                </button>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SourceModal;
