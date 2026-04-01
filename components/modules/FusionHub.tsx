
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { eventBus, EVENTS } from '../../lib/eventBus';
import { Landmark, Zap, CheckCircle, Loader2, ArrowRight } from 'lucide-react';

export const FusionHub: React.FC = () => {
  const [amount, setAmount] = useState<string>('125000');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFusion = async () => {
    setLoading(true);
    // Simulation d'une validation de facture lourde
    await new Promise(r => setTimeout(r, 1500));
    
    const fusionAmount = parseFloat(amount);
    
    // Émission du signal pour tous les modules (ChaosSimulator, Dashboards)
    eventBus.emit(EVENTS.CASH_UPDATED, 1850000 + fusionAmount);
    eventBus.emit(EVENTS.INVOICE_VALIDATED);
    eventBus.emit(EVENTS.FUSION_COMPLETE, { amount: fusionAmount, source: 'manual' });

    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-5xl font-heading italic titanium-text uppercase tracking-tighter">Fusion Hub</h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.5em] mt-4">Collecteur de Flux Entrants</p>
        </div>
      </div>

      <div className="glass-surgical border-brand-cobalt/20 bg-brand-cobalt/5 p-12 rounded-[4rem] flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden">
        <div className="absolute inset-0 greeble-dots opacity-5" />
        <div className="w-24 h-24 bg-brand-cobalt/10 rounded-[2.5rem] flex items-center justify-center text-brand-cobalt border border-brand-cobalt/20 shadow-2xl">
          <Landmark size={40} />
        </div>

        <div className="space-y-4">
          <h3 className="text-3xl font-heading text-white uppercase italic tracking-tighter">Fusion Alpha <span className="text-brand-cobalt">#INV-2109</span></h3>
          <p className="text-xs text-gray-500 font-black uppercase tracking-widest max-w-sm mx-auto">
            Validez cette injection pour synchroniser le Chaos Simulator et l'Intelligence Neural.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
           <input 
             type="text" 
             value={amount}
             onChange={(e) => setAmount(e.target.value)}
             className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-center text-4xl font-heading text-white italic outline-none focus:border-brand-cobalt transition-all"
           />
           <button 
             onClick={handleFusion}
             disabled={loading}
             className="w-full py-6 bg-brand-cobalt text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl disabled:opacity-50"
           >
             {loading ? <Loader2 className="animate-spin" /> : success ? <CheckCircle /> : <Zap size={18} />}
             {success ? "Flux Synchronisé" : "Lancer la Fusion Flux"}
           </button>
        </div>

        <div className="pt-8 border-t border-white/5 w-full flex items-center justify-center gap-6 text-[8px] font-black text-gray-700 uppercase tracking-widest">
           <span className="flex items-center gap-2"><ArrowRight size={10} /> Chaos Simulator : READY</span>
           <span className="flex items-center gap-2"><ArrowRight size={10} /> Neural Matrix : READY</span>
        </div>
      </div>
    </div>
  );
};
