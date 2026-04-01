
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, BrainCircuit, AlertTriangle } from 'lucide-react';
// Fix: Use module cast to resolve missing useNavigate export error in some environments
import * as Router from 'react-router-dom';
const { useNavigate } = Router as any;

const SubscriptionPrompt: React.FC = () => {
  const { profile, orgId } = useAuth();
  const navigate = useNavigate();
  const [moatIndex, setMoatIndex] = useState(0);
  const [synapseCount, setSynapseCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [daysLeft, setDaysLeft] = useState(14);

  useEffect(() => {
    const checkStatus = async () => {
      if (!orgId || !profile) return;
      
      const [
        { count: connCount },
        { count: docCount }
      ] = await Promise.all([
        supabase.from('connections').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      ]);
      
      const docs = docCount || 1;
      const conns = connCount || 0;
      setSynapseCount(conns);
      setMoatIndex(Math.round((conns / docs) * 100));

      const createdDate = new Date(profile.created_at || Date.now());
      const diffDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, 14 - diffDays);
      setDaysLeft(remaining);

      // Le prompt apparaît dès qu'il y a de la valeur (moatIndex > 50) ou que le temps presse
      if (remaining <= 5 || conns >= 10) {
        setVisible(true);
      }
    };
    checkStatus();
  }, [orgId, profile]);

  if (!visible) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="bg-[#1a1615] border-2 border-amber-500/30 p-8 mb-10 rounded-[40px] shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
         <BrainCircuit size={240} className="text-white" />
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
        <div className="flex items-center gap-6">
           <div className="p-4 bg-amber-500 text-black rounded-3xl shadow-xl shadow-amber-500/20 animate-pulse">
              <AlertTriangle size={28} />
           </div>
           <div className="space-y-1">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                ⚠️ PÉRIODE D'ESSAI : <span className="text-amber-500">{daysLeft} JOURS RESTANTS</span>
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-2xl">
                Votre <span className="text-white font-black italic">MOAT INDEX</span> est de <span className="text-amber-500">{moatIndex}%</span>. 
                Delete votre compte = <span className="text-rose-500 underline">PERDRE DÉFINITIVEMENT</span> les <span className="text-white">{synapseCount} connexions intelligentes</span> créées par l'IA entre vos projets, clients et factures.
              </p>
           </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
           <button 
             onClick={() => navigate('/admin/settings')}
             className="flex-1 md:flex-none px-10 py-5 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-2xl italic"
           >
              PRÉSERVER MON INTELLIGENCE
           </button>
           <button 
             onClick={() => setVisible(false)} 
             className="p-4 text-slate-600 hover:text-white transition-colors bg-white/5 rounded-full"
           >
              <X size={20} />
           </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SubscriptionPrompt;