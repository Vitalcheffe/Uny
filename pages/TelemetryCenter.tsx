
import React, { useState, useEffect, useCallback } from 'react';
import { motion as _motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, Activity, ShieldCheck, Database, 
  Cpu, Zap, AlertTriangle, Search, Filter, 
  BarChart3, RefreshCw, Layers, Radio, ExternalLink,
  Globe, ShieldAlert, Sparkles, BrainCircuit, Target,
  ArrowRight, CheckCircle2, ChevronRight, X, MousePointer2,
  Lock, TrendingDown, FileWarning, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { supabase } from '../lib/supabase';
import { TelemetryEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI } from "@google/genai";

const motion = _motion as any;

// --- Sub-components ---

const AnomalyResolutionPanel = ({ anomaly, onClose }: { anomaly: any, onClose: () => void }) => {
  const [resolution, setResolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const generateResolution = useCallback(async () => {
    setLoading(true);
    if (!process.env.API_KEY) {
      setResolution("API_KEY_MISSING: Intelligence node offline.");
      setLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        MODULE DE RÉSOLUTION DE SCAN PROFOND UNY SENTINEL
        ANOMALIE DÉTECTÉE :
        - TYPE: ${anomaly.type}
        - LIBELLÉ: ${anomaly.label}
        - DESCRIPTION: ${anomaly.description}
        - SÉVÉRITÉ: ${anomaly.severity}
        Génère un plan de résolution chirurgical en 3 étapes tactiques.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setResolution(response.text || "Chemin neural indéterminé.");
    } catch (err) {
      setResolution("Échec dans la synapse de résolution.");
    } finally {
      setLoading(false);
    }
  }, [anomaly]);

  useEffect(() => {
    generateResolution();
  }, [generateResolution]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="absolute top-0 right-0 bottom-0 w-full md:w-[450px] bg-[#0c0a09] border-l border-white/10 p-10 z-[100] flex flex-col shadow-[-40px_0_100px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4 text-blue-500">
           <Zap size={20} className="animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-[0.5em]">Logique Légale</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-500 hover:text-white"><X size={20} /></button>
      </div>

      <div className="flex-1 space-y-10 overflow-y-auto no-scrollbar">
        <div className="space-y-4">
           <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border ${
             anomaly.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
           }`}>Priorité {anomaly.severity}</div>
           <h3 className="text-3xl font-[950] italic uppercase tracking-tighter text-white leading-none">{anomaly.label}</h3>
           <p className="text-sm font-bold text-slate-400 leading-relaxed italic">"{anomaly.description}"</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] space-y-6">
           <div className="flex items-center gap-3 text-blue-400">
              <BrainCircuit size={18} />
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Résolution Suggérée</h4>
           </div>
           
           {loading ? (
             <div className="py-12 space-y-4"><div className="h-2 w-full bg-white/5 rounded-full animate-pulse" /></div>
           ) : (
             <p className="text-xs font-bold leading-relaxed text-slate-300 whitespace-pre-line italic">{resolution}</p>
           )}
        </div>
      </div>

      <div className="pt-10 space-y-4">
         <button className="w-full py-6 bg-blue-600 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-4 italic group/btn">
            <span>Autoriser l'Action</span>
            <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
         </button>
      </div>
    </motion.div>
  );
};

const TelemetryCenter: React.FC = () => {
  const { orgId } = useAuth();
  const [logs, setLogs] = useState<TelemetryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);

  useEffect(() => {
    if (logs.length > 0) {
      // Group logs by minute for the chart
      const grouped: Record<string, number> = {};
      logs.forEach(log => {
        if (log.timestamp) {
          const d = new Date(log.timestamp);
          const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          grouped[timeStr] = (grouped[timeStr] || 0) + 1;
        }
      });
      
      const newTimeSeriesData = Object.keys(grouped).map(time => ({
        time,
        value: grouped[time]
      })).reverse().slice(-30); // Keep last 30 points
      
      setTimeSeriesData(newTimeSeriesData);
    } else {
      setTimeSeriesData([]);
    }
  }, [logs]);

  const fetchLogs = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('telemetry_logs')
        .select('*')
        .eq('org_id', orgId)
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setLogs((data as unknown as TelemetryEntry[]) || []);
    } catch (err) { 
      console.error("Telemetry Retrieval Fault:", err); 
    } finally { 
      setLoading(false); 
    }
  }, [orgId]);

  useEffect(() => {
    fetchLogs();
    if (!orgId) return;

    const channel = supabase
      .channel('telemetry_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_logs',
          filter: `org_id=eq.${orgId}`
        },
        (payload) => {
          setLogs(prev => [payload.new as TelemetryEntry, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel);
    };
  }, [fetchLogs, orgId]);

  return (
    <div className="space-y-12 pb-24 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-rose-500">
            <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
              <ShieldAlert size={24} />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">CENTRE <span className="text-rose-500">D'ALERTES</span></h1>
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.5em] ml-16">Détection Globale d'Anomalies v9.0</p>
        </div>
        <button onClick={fetchLogs} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-12">
          {/* High-Frequency Time-Series Chart */}
          <div className="bg-[#1a1615] rounded-[56px] p-10 border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <Activity size={20} className="text-emerald-500" />
                <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Analyse de Fréquence (Live)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">1.2k events/s</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '24px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#1a1615] rounded-[56px] p-10 border border-white/5 shadow-2xl flex flex-col min-h-[400px]">
            <div className="flex items-center gap-4 mb-10">
              <Cpu size={20} className="text-blue-500" />
              <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Flux de Signaux</h3>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Interception de la Grille...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
                  <Database size={48} className="text-slate-500" />
                  <p className="text-xs font-black uppercase tracking-widest text-white">Secteur Calme</p>
                </div>
              ) : (
                logs.map((log, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/10 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${log.event_type.includes('APPROVAL') ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{log.event_type}</span>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm font-bold text-white uppercase italic tracking-tight">{log.metric_label}</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4 text-orange-500">
              <BarChart3 size={24} />
              <h3 className="text-xl font-black italic uppercase tracking-tight">Anomalies Détectées</h3>
            </div>
            <div className="space-y-6">
              <div 
                className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex items-center gap-4 cursor-pointer hover:bg-rose-100 transition-all" 
                onClick={() => setSelectedAnomaly({type: 'FINANCIAL', label: 'Payroll Variance', description: 'Détection d\'une variation de 15% unplanned for current month.', severity: 'CRITICAL'})}
              >
                <FileWarning size={20} className="text-rose-500" />
                <div>
                  <p className="text-xs font-black uppercase text-rose-600">Dérive Financière</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ecart sur bulletin #P09</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAnomaly && <AnomalyResolutionPanel anomaly={selectedAnomaly} onClose={() => setSelectedAnomaly(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default TelemetryCenter;
