
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { eventBus, EVENTS } from '../../lib/eventBus';
import { AlertTriangle, TrendingDown, RefreshCcw, Activity, Zap } from 'lucide-react';

export const ChaosSimulator: React.FC = () => {
  const [cashBalance, setCashBalance] = useState(1850000);
  const [impact, setImpact] = useState(15);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    const handleCashUpdate = (newCash: number) => {
      console.log("⚡ [Chaos] Syncing with real cash flow:", newCash);
      setCashBalance(newCash);
    };

    eventBus.on(EVENTS.CASH_UPDATED, handleCashUpdate);
    return () => eventBus.off(EVENTS.CASH_UPDATED, handleCashUpdate);
  }, []);

  const projectedBalance = cashBalance * (1 - impact / 100);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-5xl font-heading italic titanium-text uppercase tracking-tighter">Chaos Simulator</h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.5em] mt-4">Alpha Resilience Stress-Test</p>
        </div>
        <div className="p-4 bg-brand-ruby/10 border border-brand-ruby/30 rounded-2xl flex items-center gap-4">
           <AlertTriangle size={24} className="text-brand-ruby animate-pulse" />
           <span className="text-[10px] font-black text-brand-ruby uppercase tracking-widest">Entropy Alert</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-surgical border-white/5 bg-brand-anthracite/20 p-10 rounded-[3.5rem] space-y-12">
           <div className="space-y-6">
              <div className="flex justify-between text-[14px] font-black text-white uppercase tracking-[0.3em] font-mono">
                 <span>Crisis Magnitude</span>
                 <span className="text-brand-ruby">{impact}%</span>
              </div>
              <input 
                 type="range" min="0" max="80" value={impact}
                 onChange={(e) => setImpact(parseInt(e.target.value))}
                 className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-brand-ruby"
              />
           </div>

           <div className="pt-8 border-t border-white/5">
              <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Current Cashflow (Live)</div>
              <div className="text-5xl font-heading text-white italic">{cashBalance.toLocaleString()} <span className="text-lg text-gray-700">USD</span></div>
           </div>

           <button 
             onClick={() => { setSimulating(true); setTimeout(() => setSimulating(false), 2000); }}
             className="w-full py-6 bg-brand-ruby text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-4 hover:bg-white hover:text-brand-obsidian transition-all shadow-2xl"
           >
             {simulating ? <RefreshCcw className="animate-spin" /> : <Zap size={18} />}
             Execute Breach Projection
           </button>
        </div>

        <div className="glass-surgical border-brand-ruby/20 bg-brand-ruby/5 p-10 rounded-[3.5rem] flex flex-col justify-between relative overflow-hidden">
           <div className="scan-laser opacity-10 bg-brand-ruby" />
           <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-ruby mb-12 flex items-center gap-4">
                 <TrendingDown size={22} /> Post-Shock State (PROJECTION)
              </h3>
              <div className="text-7xl font-heading text-white italic mb-4">
                {projectedBalance.toLocaleString()} <span className="text-xl text-brand-ruby">USD</span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                 Estimated Loss: <span className="text-brand-ruby">{(cashBalance - projectedBalance).toLocaleString()} USD</span>
              </p>
           </div>

           <div className="p-8 border border-white/5 bg-black/40 rounded-3xl mt-12">
              <div className="text-[10px] font-black text-brand-emerald uppercase tracking-widest mb-4 flex items-center gap-3">
                 <Activity size={14} /> Sentinel Recommendation
              </div>
              <p className="text-[9px] text-gray-500 uppercase font-black leading-relaxed italic">
                 Liquidity ratio falling below critical threshold. 
                 Suggest "Alpha Fusion" to close gap before T+30.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
