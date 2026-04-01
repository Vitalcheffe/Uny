
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, TrendingUp, Zap, AlertTriangle, 
  Layers, Activity, Sparkles, RefreshCw, 
  ShieldAlert, FileWarning, PieChart, Globe, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../lib/supabase-data-layer';
import { compareWithHistory, PriceDelta } from '../lib/documentProcessor';
import { formatMAD } from '../lib/local-adaptation';

const XPLevelIndicator = ({ level = 1 }: { level?: number }) => {
  const tiers = [
    { id: 1, label: 'Organiser', desc: 'Silo structurel nominal', color: 'bg-emerald-500' },
    { id: 2, label: 'Connecter', desc: 'Synapses neurales actives', color: 'bg-blue-500' },
    { id: 3, label: 'Prédire', desc: 'Anticipation des décisions', color: 'bg-purple-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tiers.map((t) => (
        <div key={t.id} className={`p-6 rounded-[32px] border transition-all ${level >= t.id ? 'bg-white border-slate-100 shadow-xl' : 'bg-slate-50/50 border-transparent opacity-40'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white ${level >= t.id ? t.color : 'bg-slate-300'}`}>
              Niveau {t.id}
            </span>
            {level >= t.id && <Sparkles size={14} className="text-amber-400" />}
          </div>
          <h4 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">{t.label}</h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.desc}</p>
        </div>
      ))}
    </div>
  );
};

const StrategyHub: React.FC = () => {
  const { orgId, profile } = useAuth();
  
  const [realRevenue, setRealRevenue] = useState<number>(0);
  const [fixedCosts, setFixedCosts] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<PriceDelta[]>([]);

  const [hiringVolume, setHiringVolume] = useState(0);
  const [costIndex, setCostIndex] = useState<number | null>(null);
  const [simulating, setSimulating] = useState(false);

  const fetchFinancialCore = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [invRes, profRes] = await Promise.all([
        firestoreService.getCollection('invoices', orgId, [
          { field: 'status', operator: '==', value: 'Paid' }
        ]),
        firestoreService.getCollection('profiles', orgId)
      ]);

      const totalRev = invRes?.reduce((sum, inv) => sum + (Number((inv as any).amount) || 0), 0) || 0;
      
      const totalSalaries = profRes?.reduce((sum, prof) => {
        const val = (prof as any).salary || ((prof as any).metadata as any)?.salary || 0;
        return sum + Number(val);
      }, 0) || 0;

      setRealRevenue(totalRev);
      setFixedCosts(totalSalaries);

    } catch (err) {
      console.error("Critical Financial Core Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchFinancialCore();
  }, [fetchFinancialCore]);

  const financialKernel = useMemo(() => {
    if (realRevenue === 0 && fixedCosts === 0) return { profit: null, dividends: null, runway: "N/A", expenses: 0, rev: 0 };

    const monthlyCostPerHire = 12000;
    const additionalStaffCost = hiringVolume * monthlyCostPerHire;
    const totalProjectedExpenses = fixedCosts + additionalStaffCost;
    const previsionalProfit = realRevenue - totalProjectedExpenses;
    const estimatedDividends = previsionalProfit > 0 ? previsionalProfit * 0.3 : 0;
    
    const runway = totalProjectedExpenses > 0 ? (realRevenue / (totalProjectedExpenses / 12)).toFixed(1) : "N/A";

    return {
      profit: previsionalProfit,
      dividends: estimatedDividends,
      runway,
      expenses: totalProjectedExpenses,
      rev: realRevenue
    };
  }, [hiringVolume, realRevenue, fixedCosts]);

  const hasData = realRevenue > 0 || fixedCosts > 0;

  return (
    <div className="space-y-12 max-w-[1700px] mx-auto pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-purple-600">
            <div className="p-3 bg-purple-600/10 rounded-2xl border border-purple-600/20">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              HUB <span className="text-purple-600">STRATÉGIQUE</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.5em] ml-16 italic">Cockpit Anti-Erreur</p>
        </div>

        <div className="bg-[#1a1615] px-8 py-4 rounded-[28px] border border-white/10 shadow-2xl flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-purple-400">Intelligence de Commande</span>
              <span className="text-xl font-black text-white italic tracking-tighter leading-none uppercase">
                {hasData ? 'Niveau 2: Connecter' : 'Niveau 1: Organiser'}
              </span>
           </div>
           <div className="w-px h-10 bg-white/10" />
           <div className="flex items-center gap-3 text-slate-600">
              <Database size={18} />
           </div>
        </div>
      </div>

      <XPLevelIndicator level={hasData ? 2 : 1} />

      {!hasData ? (
        <div className="bg-white rounded-[64px] p-24 text-center space-y-10 border border-slate-100 shadow-2xl">
           <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center mx-auto text-slate-200 border border-slate-100">
              <FileWarning size={64} />
           </div>
           <div className="space-y-4">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">En attente d'ingestion</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-xl mx-auto">
                 Le hub stratégique nécessite des signaux financiers réels (Factures Payées) et des coûts opérationnels pour générer des trajectoires prédictives.
              </p>
           </div>
           <button 
             onClick={() => window.location.href='/#/dashboard'}
             className="bg-blue-600 text-white px-12 py-6 rounded-full font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-blue-500 transition-all italic"
           >
              ALLER AU NOYAU DE COMMANDE
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Dashboard Logic UI ... */}
          <div className="lg:col-span-8 bg-white rounded-[56px] p-12 border border-slate-100 shadow-xl space-y-12">
             <h3 className="text-2xl font-black italic uppercase tracking-tighter">Projections <span className="text-blue-600">Temps Réel</span></h3>
             <div className="grid grid-cols-2 gap-8">
                <div className="p-8 bg-emerald-50 rounded-3xl">
                   <p className="text-[10px] font-black uppercase text-emerald-600 mb-2">Bénéfice Net (Actuel)</p>
                   <p className="text-4xl font-[950] italic tracking-tighter text-emerald-700">
                      {formatMAD(Math.round(financialKernel.profit || 0))}
                   </p>
                </div>
                <div className="p-8 bg-slate-900 rounded-3xl text-white">
                   <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Piste de Résilience</p>
                   <p className="text-4xl font-[950] italic tracking-tighter">
                      {financialKernel.runway} Mois
                   </p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyHub;
