
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// Comment: Added missing ArrowRight and FileText to lucide-react imports
import { 
  Users, UserPlus, Search, Filter, MoreHorizontal, 
  Mail, X, AlertCircle, CheckCircle2, Loader2, 
  Trash2, Briefcase, ChevronRight, Calendar, 
  SortAsc, SortDesc, Zap, Activity, Info, TrendingUp,
  Download, BrainCircuit, Sparkles, MessageSquare,
  BarChart3, Globe, ShieldCheck, Heart, ArrowRight, FileText
} from 'lucide-react';
import { firestoreService } from '../lib/firestore-service';
import { useAuth } from '../context/AuthContext';
import { Client, Project } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { formatMAD } from '../lib/local-adaptation';

// --- SUB-COMPONENTS ---

const SentimentBadge = ({ score = 80 }: { score?: number }) => {
  const isPositive = score >= 80;
  const isNeutral = score >= 50 && score < 80;
  
  return (
    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
      isPositive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
      isNeutral ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-emerald-500' : isNeutral ? 'bg-blue-500' : 'bg-rose-500'}`} />
      {isPositive ? 'Optimal' : isNeutral ? 'Stable' : 'Critique'} ({score})
    </div>
  );
};

const MetricMini = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{label}</p>
    <p className={`text-sm font-black italic uppercase ${color}`}>{value}</p>
  </div>
);

const HealthScore = ({ score = 85 }: { score?: number }) => {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };
  
  return (
    <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            className="text-slate-200"
            strokeDasharray="100, 100"
            strokeWidth="3"
            stroke="currentColor"
            fill="transparent"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={getColor(score)}
            strokeDasharray={`${score}, 100`}
            strokeWidth="3"
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-black italic ${getColor(score)}`}>{score}</span>
        </div>
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Health Score</p>
        <p className="text-xs font-black italic uppercase text-slate-900">Niveau de Confiance</p>
      </div>
    </div>
  );
};

const ImpersonationTool = ({ clientId }: { clientId: string }) => {
  const { isUnyAdmin } = useAuth();
  if (!isUnyAdmin) return null;

  return (
    <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] space-y-4">
      <div className="flex items-center gap-3 text-amber-600">
        <ShieldCheck size={18} />
        <span className="text-[10px] font-black uppercase tracking-widest">Super Admin Protocol</span>
      </div>
      <p className="text-[10px] font-bold text-amber-700 leading-relaxed italic uppercase">
        Accès direct au nœud client pour maintenance ou support critique.
      </p>
      <button 
        onClick={() => alert(`Initialisation du protocole d'impersonation pour: ${clientId}`)}
        className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all italic"
      >
        Impersonner l'Entité
      </button>
    </div>
  );
};

// --- MAIN PAGE ---

const ClientsPage: React.FC = () => {
  const { orgId, profile, isUnyAdmin } = useAuth();
  
  // Data States
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // KPI States
  const [activeSynapses, setActiveSynapses] = useState<number>(0);
  const [integrityScore, setIntegrityScore] = useState<string>('N/A');
  const [expansionRisk, setExpansionRisk] = useState<string>('N/A');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'ltv' | 'sentiment'>('name');

  // AI Logic States
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<any | null>(null);

  // 1. FETCH DATA (Multi-tenant)
  const fetchClients = useCallback(async (isSilent = false) => {
    if (!orgId) return;
    if (!isSilent) setLoading(true);
    try {
      const data = await firestoreService.getCollection('clients', orgId, [], 'name', 'asc');
      setClients(data as Client[] || []);
      
      // Fetch Risk Assessments for Integrity Score
      const risks = await firestoreService.getCollection('risk_assessments', orgId);
      if (risks && risks.length > 0) {
        const avgRisk = risks.reduce((acc: number, curr: any) => acc + (curr.calculated_risk || 0), 0) / risks.length;
        // Integrity is inverse of risk (assuming risk is 0-100)
        const integrity = Math.max(0, 100 - avgRisk);
        setIntegrityScore(`${integrity.toFixed(1)}%`);
      } else {
        setIntegrityScore('N/A');
      }

      // Calculate Expansion Risk based on LTV / Client count
      if (data && data.length > 0) {
        const totalLtv = data.reduce((acc: number, curr: any) => acc + (curr.revenue_attribution || 0), 0);
        const avgLtv = totalLtv / data.length;
        if (avgLtv > 50000) setExpansionRisk('Élevé');
        else if (avgLtv > 10000) setExpansionRisk('Modéré');
        else setExpansionRisk('Faible');
      } else {
        setExpansionRisk('N/A');
      }

    } catch (err) {
      console.error("CRM Sync Fault:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchClients();
    if (!orgId) return;

    // 2. REALTIME SYNAPSE
    const unsubscribeClients = firestoreService.subscribeToCollection(
      'clients',
      orgId,
      [],
      (data) => setClients(data as Client[])
    );

    // Subscribe to telemetry logs for active synapses (last 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const unsubscribeTelemetry = firestoreService.subscribeToCollection(
      'telemetry_logs',
      orgId,
      [{ field: 'created_at', operator: '>=', value: yesterday.toISOString() }],
      (data) => {
        setActiveSynapses(data ? data.length : 0);
      }
    );

    return () => {
      unsubscribeClients();
      unsubscribeTelemetry();
    };
  }, [fetchClients, orgId]);

  // 3. AI RELATIONSHIP FORENSICS
  const analyzeRelationship = async (client: Client) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;
    setAnalyzingId(client.id);
    setAiReport(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        UNY SENTINEL: RELATIONSHIP ANALYSIS PROTOCOL
        TARGET: ${client.name}
        METADATA: ${JSON.stringify(client.metadata || {})}
        STATUS: ${client.status}
        LTV: ${formatMAD(client.revenue_attribution || 0)}
        
        Analyze the strategic health of this client node. 
        Identify churn risks and upsell opportunities.
        Return structured JSON with:
        - risk_score (0-100)
        - health_summary (1 paragraph)
        - tactical_advice (3 bullet points)
        - recommended_action (1 string)
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              risk_score: { type: Type.NUMBER },
              health_summary: { type: Type.STRING },
              tactical_advice: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommended_action: { type: Type.STRING }
            }
          }
        }
      });

      setAiReport(JSON.parse(response.text || "{}"));
    } catch (err) {
      console.error("AI Forensic Error:", err);
    } finally {
      setAnalyzingId(null);
    }
  };

  // 4. CSV EXPORT
  const exportRegistry = () => {
    const headers = ["ID", "Name", "Email", "Status", "LTV", "Sentiment"];
    const csvContent = [
      headers.join(","),
      ...clients.map(c => [
        c.id,
        `"${c.name}"`,
        c.email || "N/A",
        c.status,
        c.revenue_attribution || 0,
        c.sentiment_score || 80
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `uny_registry_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. FILTERING LOGIC
  const filteredClients = useMemo(() => {
    return clients
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'ltv') return (b.revenue_attribution || 0) - (a.revenue_attribution || 0);
        if (sortBy === 'sentiment') return (b.sentiment_score || 80) - (a.sentiment_score || 80);
        return 0;
      });
  }, [clients, searchTerm, statusFilter, sortBy]);

  return (
    <div className="space-y-10 pb-32 max-w-[1700px] mx-auto">
      
      {/* 1. HEADER & GLOBAL CONTROLS */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20">
              <Users size={24} />
            </div>
            <h1 className="text-4xl font-[950] italic uppercase tracking-tighter text-slate-900 leading-none">
              Registre <span className="text-blue-600">des Clients</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.5em] ml-16 italic">Mémoire Relationnelle d'Entreprise</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
           <div className="relative flex-1 min-w-[300px] group">
              <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Rechercher des Nœuds d'Identité..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-100 shadow-sm rounded-full py-5 pl-16 pr-8 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold italic"
              />
           </div>
           
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="bg-[#1A1615] text-white px-10 py-5 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl italic"
           >
              <UserPlus size={18} /> Provisionner un Nœud
           </button>
           
           <button 
             onClick={exportRegistry}
             className="p-5 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all shadow-sm"
           >
              <Download size={20} />
           </button>
        </div>
      </div>

      {/* 2. KPI STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Nœuds Totaux', value: clients.length, icon: Globe, color: 'text-slate-900' },
          { label: 'Synapses Actives', value: activeSynapses, icon: Activity, color: 'text-blue-500' },
          { label: 'Taux d\'Intégrité', value: integrityScore, icon: ShieldCheck, color: 'text-emerald-500' },
          { label: 'Risque d\'Expansion', value: expansionRisk, icon: Zap, color: 'text-amber-500' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm flex items-center gap-6">
             <div className={`p-4 bg-slate-50 rounded-2xl ${kpi.color}`}>
                <kpi.icon size={20} />
             </div>
             <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">{kpi.label}</p>
                <p className="text-2xl font-black italic tracking-tighter text-slate-900">{kpi.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* 3. FILTERS BAR */}
      <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-3">
            <Filter size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matrice de Tri :</span>
            {['name', 'ltv', 'sentiment'].map((s) => (
              <button 
                key={s} 
                onClick={() => setSortBy(s as any)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === s ? 'bg-black text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                {s === 'name' ? 'nom' : s === 'ltv' ? 'valeur' : 'sentiment'}
              </button>
            ))}
         </div>
         <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Protocole :</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Tous les Nœuds</option>
              <option value="active">Missions Actives</option>
              <option value="lead">Prospects Cibles</option>
              <option value="inactive">Secteur Dormant</option>
            </select>
         </div>
      </div>

      {/* 4. CLIENT GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {[1,2,3,4].map(i => <div key={i} className="h-80 bg-white/50 animate-pulse border border-slate-100 rounded-[48px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {filteredClients.map((client, idx) => (
            <motion.div 
              key={client.id}
              layoutId={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedClient(client)}
              className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
            >
               {/* Detail Indicators */}
               <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={32} className="text-blue-500" />
               </div>

               <div className="flex items-center gap-8 mb-10">
                  <div className="w-24 h-24 bg-slate-900 text-white rounded-[32px] flex items-center justify-center text-4xl font-black italic shadow-2xl group-hover:rotate-6 transition-transform">
                     {client.name[0]}
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-3xl font-[950] italic uppercase tracking-tighter text-slate-900 leading-none group-hover:text-blue-600 transition-colors">
                        {client.name}
                     </h3>
                     <div className="flex items-center gap-4">
                        <SentimentBadge score={client.sentiment_score || 82} />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{client.metadata?.industry || 'Secteur Général'}</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-8 py-8 border-y border-slate-50">
                  <MetricMini label="Valeur à Vie" value={formatMAD(client.revenue_attribution || 0, false)} color="text-emerald-600" />
                  <MetricMini label="Nœuds Actifs" value="04" color="text-blue-500" />
                  <MetricMini label="Statut" value={client.status} color="text-slate-900" />
               </div>

               <div className="pt-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Mail size={14} className="text-slate-300" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{client.email || 'AUCUN_LIEN_COM'}</span>
                  </div>
                  <div className="flex -space-x-3">
                     {[1,2,3].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black">OP</div>
                     ))}
                  </div>
               </div>
            </motion.div>
          ))}
          
          {clients.length === 0 && !loading ? (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-8">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                 <Users size={40} className="text-slate-300" />
               </div>
               <div className="space-y-2">
                 <p className="text-2xl font-black uppercase tracking-tighter text-slate-900">Aucun Nœud Client Détecté</p>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Le registre est actuellement vide.</p>
               </div>
               <button 
                 onClick={() => setIsAddModalOpen(true)}
                 className="bg-blue-600 text-white px-10 py-5 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl italic"
               >
                  <UserPlus size={18} /> Provisionner un Nœud
               </button>
            </div>
          ) : filteredClients.length === 0 && !loading ? (
            <div className="col-span-full py-40 text-center space-y-8 opacity-20 italic">
               <Users size={80} className="mx-auto" />
               <p className="text-2xl font-black uppercase tracking-tighter">Zéro Nœud Détecté dans la Plage de Filtre</p>
            </div>
          ) : null}
        </div>
      )}

      {/* 5. DETAIL DRAWER (360° VUE) */}
      <AnimatePresence>
        {selectedClient && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedClient(null); setAiReport(null); }}
              className="fixed inset-0 bg-[#1A1615]/80 backdrop-blur-md z-[500]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-2xl bg-white shadow-2xl z-[501] p-12 md:p-16 overflow-y-auto no-scrollbar"
            >
              <button 
                onClick={() => { setSelectedClient(null); setAiReport(null); }}
                className="absolute top-10 right-10 p-4 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="space-y-10">
                 <header className="flex items-center gap-10">
                    <div className="w-32 h-32 bg-slate-900 text-white rounded-[40px] flex items-center justify-center text-6xl font-black italic shadow-2xl">
                       {selectedClient.name[0]}
                    </div>
                    <div className="space-y-4">
                       <h2 className="text-5xl font-[950] italic uppercase tracking-tighter text-slate-900 leading-none">{selectedClient.name}</h2>
                       <div className="flex gap-4">
                          <SentimentBadge score={selectedClient.sentiment_score || 80} />
                          <div className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">{selectedClient.status}</div>
                       </div>
                    </div>
                 </header>

                 {/* 360° METRICS GRID */}
                 <div className="grid grid-cols-2 gap-6">
                    <HealthScore score={88} />
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col justify-center">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Risk Assessment</p>
                       <p className="text-sm font-black italic uppercase text-slate-900">{selectedClient.sentiment_score || 82}% Intégrité</p>
                    </div>
                 </div>

                 {/* IMPERSONATION TOOL (SUPER ADMIN ONLY) */}
                 <ImpersonationTool clientId={selectedClient.id} />

                 {/* AI FORENSICS SECTION */}
                 <section className="bg-[#1A1615] rounded-[48px] p-10 text-white space-y-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                       <BrainCircuit size={120} />
                    </div>
                    <div className="relative z-10 space-y-6">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-blue-400">
                             <Sparkles size={20} />
                             <span className="text-[11px] font-black uppercase tracking-[0.5em]">Intelligence Légale</span>
                          </div>
                          {aiReport && (
                            <div className="px-4 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest">
                               Indice de Risque : {aiReport.risk_score}%
                            </div>
                          )}
                       </div>

                       {aiReport ? (
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <p className="text-lg font-bold italic text-slate-300 leading-relaxed uppercase tracking-tighter">"{aiReport.health_summary}"</p>
                            <div className="space-y-4">
                               <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Calibration Tactique :</p>
                               <ul className="space-y-3">
                                  {aiReport.tactical_advice.map((adv: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-xs font-bold text-slate-400">
                                       <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 shrink-0" />
                                       {adv}
                                    </li>
                                  ))}
                               </ul>
                            </div>
                            <div className="p-6 bg-blue-600 rounded-3xl border border-blue-400 flex items-center justify-between">
                               <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-200 mb-1">Logique de Nœud Recommandée</p>
                                  <p className="text-sm font-black italic uppercase">{aiReport.recommended_action}</p>
                               </div>
                               <Zap size={24} fill="white" />
                            </div>
                         </motion.div>
                       ) : (
                         <div className="py-12 flex flex-col items-center justify-center text-center space-y-8">
                            <div className="w-20 h-20 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center">
                               {analyzingId === selectedClient.id ? <Loader2 className="animate-spin text-blue-500" size={32} /> : <BrainCircuit size={32} className="text-slate-600" />}
                            </div>
                            <div className="space-y-3">
                               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Lien Neuronal Hors Ligne</p>
                               <button 
                                 onClick={() => analyzeRelationship(selectedClient)}
                                 disabled={analyzingId !== null}
                                 className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl italic flex items-center gap-4"
                               >
                                 {analyzingId ? 'Interception des Données...' : 'Analyser la Relation'}
                                 <ArrowRight size={16} />
                               </button>
                            </div>
                         </div>
                       )}
                    </div>
                 </section>

                 {/* NODES LOG */}
                 <section className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Historique de l'Entité Connectée</h4>
                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aucun historique disponible</p>
                    </div>
                 </section>
              </div>

              <div className="mt-16 pt-8 border-t border-slate-100 flex gap-4">
                 <button className="flex-1 py-6 bg-[#1A1615] text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl italic flex items-center justify-center gap-4">
                    <Mail size={18} /> Transmission Directe
                 </button>
                 <button 
                   onClick={async () => {
                     if (window.confirm("Révoquer définitivement l'identité du nœud client ?")) {
                        await firestoreService.deleteDocument('clients', orgId!, selectedClient!.id);
                        setSelectedClient(null);
                        fetchClients();
                     }
                   }}
                   className="p-6 bg-rose-50 text-rose-500 rounded-3xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-inner"
                 >
                    <Trash2 size={24} />
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 6. PROVISION MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-[#1A1615]/80 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-xl bg-white rounded-[64px] p-16 shadow-2xl border border-white overflow-hidden"
            >
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-10 right-10 text-slate-400 hover:text-black">
                <X size={24} />
              </button>

              <header className="mb-12 space-y-4">
                <div className="flex items-center gap-4 text-blue-600">
                  <UserPlus size={28} />
                  <span className="text-[10px] font-black uppercase tracking-[0.6em]">Initialisation de l'Entité</span>
                </div>
                <h2 className="text-5xl font-[950] italic uppercase tracking-tighter leading-none text-slate-900">
                  Provisionner <br /> <span className="text-blue-600">le Nœud Client</span>
                </h2>
              </header>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const email = formData.get('email') as string;
                const industry = formData.get('industry') as string;

                try {
                  await firestoreService.addDocument('clients', orgId!, {
                    name,
                    email,
                    status: 'ACTIVE',
                    sentiment_score: 80,
                    metadata: { industry },
                    created_at: new Date().toISOString()
                  });
                  setIsAddModalOpen(false);
                  fetchClients();
                } catch (err) {
                   console.error(err);
                }
              }} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Désignation Sociale</label>
                  <input name="name" required placeholder="e.g. ALPHA NEBULA CORP" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-blue-500/20 font-black text-xl italic uppercase transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Destination Neuronale (Email)</label>
                  <input name="email" type="email" placeholder="CIBLE@RESEAU.IO" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-blue-500/20 font-bold italic transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Hub Sectoriel</label>
                  <input name="industry" placeholder="TECHNOLOGIE / ÉNERGIE / FINANCE" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-blue-500/20 font-bold italic uppercase tracking-tight transition-all" />
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full py-7 bg-blue-600 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-700 transition-all italic active:scale-95">
                    Autoriser le Protocole du Nœud
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

export default ClientsPage;
