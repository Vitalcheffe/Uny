import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { eventBus, EVENTS } from '../../lib/eventBus';
import { X, Zap, ShieldCheck, BrainCircuit, TrendingUp, BellRing, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Suggestion {
  id: string;
  message: string;
  action: string;
  route: string;
  type: 'SUCCESS' | 'WARNING' | 'NEURAL' | 'STRATEGIC';
}

const IntelligentNotifications: React.FC = () => {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const showSuggestion = (s: Suggestion) => {
      // Clear existing to trigger entry animation for new ones
      setSuggestion(null);
      setTimeout(() => setSuggestion(s), 150);
    };

    const handleInvoiceValidated = () => {
      showSuggestion({
        id: Date.now().toString(),
        message: "Synchronisation financière terminée. De nouveaux nœuds de revenus sont désormais actifs dans la grille.",
        action: "Simuler l'Impact de Crise",
        route: "/dashboard/finance/chaos",
        type: 'SUCCESS'
      });
    };

    const handleFusionComplete = (data: { amount?: number }) => {
      showSuggestion({
        id: Date.now().toString(),
        message: `Injection de capital de ${data.amount?.toLocaleString()} MAD réussie. Réserves de liquidités optimisées.`,
        action: "Lancer le Scan de Fuite Sentinel",
        route: "/dashboard/sentinel/leak-detector",
        type: 'NEURAL'
      });
    };

    const handleEmployeeAdded = () => {
      showSuggestion({
        id: Date.now().toString(),
        message: "Nouvel agent intégré. Les privilèges d'accès nécessitent une calibration administrative immédiate.",
        action: "Auditer la Matrice des Rôles",
        route: "/dashboard/settings/roles",
        type: 'STRATEGIC'
      });
    };

    eventBus.on(EVENTS.INVOICE_VALIDATED, handleInvoiceValidated);
    eventBus.on(EVENTS.FUSION_COMPLETE, handleFusionComplete);
    eventBus.on(EVENTS.EMPLOYEE_ADDED, handleEmployeeAdded);

    return () => {
      eventBus.off(EVENTS.INVOICE_VALIDATED, handleInvoiceValidated);
      eventBus.off(EVENTS.FUSION_COMPLETE, handleFusionComplete);
      eventBus.off(EVENTS.EMPLOYEE_ADDED, handleEmployeeAdded);
    };
  }, []);

  // Auto-dismiss logic to prevent clutter
  useEffect(() => {
    if (suggestion) {
      const timer = setTimeout(() => setSuggestion(null), 12000);
      return () => clearTimeout(timer);
    }
  }, [suggestion]);

  return (
    <AnimatePresence>
      {suggestion && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: 100, scale: 0.9, filter: 'blur(10px)', transition: { duration: 0.3 } }}
          className="fixed top-32 right-8 z-[250] w-[440px] pointer-events-auto"
        >
          <div className="relative group">
            {/* Neural Aura Effect */}
            <div className={`absolute -inset-2 rounded-[40px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 ${
              suggestion.type === 'SUCCESS' ? 'bg-emerald-50' :
              suggestion.type === 'NEURAL' ? 'bg-blue-600' :
              'bg-amber-500'
            }`} />

            <div className="relative bg-[#1a1615]/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] shadow-2xl overflow-hidden ring-1 ring-white/20">
              {/* Scanning visual effect */}
              <div className="absolute inset-0 scan-laser opacity-[0.15] pointer-events-none" />
              
              <div className="flex items-start gap-6 mb-10">
                <div className={`p-5 rounded-2xl shrink-0 shadow-2xl border transition-transform duration-500 group-hover:scale-110 ${
                  suggestion.type === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                  suggestion.type === 'NEURAL' ? 'bg-blue-600/20 text-blue-400 border-blue-600/20' :
                  'bg-amber-500/20 text-amber-400 border-amber-500/20'
                }`}>
                  {suggestion.type === 'SUCCESS' ? <ShieldCheck size={28} /> : 
                   suggestion.type === 'NEURAL' ? <BrainCircuit size={28} /> : 
                   <TrendingUp size={28} />}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <BellRing size={14} className="text-blue-500 animate-pulse" />
                       <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500">Recommandation Neuronale</p>
                    </div>
                    <button 
                      onClick={() => setSuggestion(null)} 
                      className="text-slate-600 hover:text-white transition-colors bg-white/5 p-1.5 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-lg font-bold text-white leading-relaxed italic pr-4">
                    "{suggestion.message}"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <button
                  onClick={() => {
                    navigate(suggestion.route);
                    setSuggestion(null);
                  }}
                  className="flex-1 py-5 bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-4 shadow-2xl group/btn"
                >
                  {suggestion.action} <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform duration-300" />
                </button>
                <button
                  onClick={() => setSuggestion(null)}
                  className="px-8 py-5 border border-white/5 bg-white/5 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white rounded-2xl transition-all"
                >
                  Ignorer
                </button>
              </div>

              <div className="mt-8 flex items-center justify-between opacity-50">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.5em]">Moteur Proactif Sentinel v4.2</span>
                 </div>
                 <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-0.5 bg-slate-800 rounded-full" />)}
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntelligentNotifications;