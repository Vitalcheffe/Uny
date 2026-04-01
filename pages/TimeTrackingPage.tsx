
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Play, Pause, Square, ChevronRight, 
  AlertCircle, Loader2, CheckCircle2, History,
  Target, MessageSquare, Briefcase, Zap, Calendar,
  BrainCircuit, Sparkles
} from 'lucide-react';
import { firestoreService } from '../lib/supabase-data-layer';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const TimeTrackingPage: React.FC = () => {
  const { orgId, profile, user } = useAuth();
  
  // Timer States
  const [timerState, setTimerState] = useState<'stopped' | 'running' | 'paused'>('stopped');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [description, setDescription] = useState('');
  const intervalRef = useRef<any>(null);

  // États de Données
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // AI States
  const [suggestedProjectId, setSuggestedProjectId] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Formattage HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Charger les projets
  const fetchProjects = useCallback(async () => {
    if (!orgId) return;
    try {
      const data = await firestoreService.getCollection(
        'projects',
        orgId,
        [
          { field: 'status', operator: 'in', value: ['Ongoing', 'Review', 'Backlog'] }
        ]
      );
      setProjects(data as Project[]);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }, [orgId]);

  // Charger l'historique
  const fetchTimeEntries = useCallback(async () => {
    if (!orgId) return;
    setLoadingHistory(true);
    try {
      const data = await firestoreService.getCollection(
        'time_entries',
        orgId,
        [],
        'ended_at',
        'desc',
        20
      );
      setTimeEntries(data);
    } catch (err) {
      console.error("Error fetching time entries:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchProjects();
    fetchTimeEntries();
  }, [fetchProjects, fetchTimeEntries]);

  // IA: Suggestion de projet
  const handleAISuggestion = useCallback(async (desc: string) => {
    if (!desc || desc.length < 5 || projects.length === 0 || selectedProjectId) return;
    
    setIsSuggesting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        UNY TEMPORAL ORACLE v1.0
        
        TASK: Map the task description to the most likely mission node.
        
        DESCRIPTION: "${desc}"
        
        AVAILABLE MISSION NODES:
        ${projects.map(p => `- ID: ${p.id}, NAME: ${p.name}`).join('\n')}

        OBJECTIVE: Identify which project ID best matches this description. 
        If no confident match (>70%), return null.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              project_id: { type: Type.STRING, nullable: true },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      if (result.project_id && result.confidence > 0.7) {
        setSuggestedProjectId(result.project_id);
      } else {
        setSuggestedProjectId(null);
      }
    } catch (err) {
      console.warn("AI Oracle Standby.");
    } finally {
      setIsSuggesting(false);
    }
  }, [projects, selectedProjectId]);

  // Debounce IA suggestion
  useEffect(() => {
    const timer = setTimeout(() => {
      if (description) handleAISuggestion(description);
    }, 1000);
    return () => clearTimeout(timer);
  }, [description, handleAISuggestion]);

  // Timer Controls
  const handleStart = () => {
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  const handlePause = () => {
    setTimerState('paused');
    clearInterval(intervalRef.current);
  };

  const handleResume = () => {
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  const handleStop = async () => {
    clearInterval(intervalRef.current);
    const finalSeconds = elapsedSeconds;
    setTimerState('stopped');

    if (finalSeconds > 2) { // Minimum 2 secondes pour enregistrer
      try {
        await firestoreService.addDocument('time_entries', orgId!, {
          user_id: user?.id,
          project_id: selectedProjectId || null,
          project_name: selectedProjectName || 'Unassigned',
          duration_seconds: finalSeconds,
          description: description || '',
          started_at: new Date(Date.now() - finalSeconds * 1000).toISOString(),
          ended_at: new Date().toISOString()
        });

        fetchTimeEntries();
      } catch (err) {
        console.error("Erreur de sauvegarde temporelle:", err);
      }
    }

    setElapsedSeconds(0);
    setDescription('');
    setSelectedProjectId('');
    setSelectedProjectName('');
    setSuggestedProjectId(null);
  };

  const applySuggestion = () => {
    if (suggestedProjectId) {
      const p = projects.find(proj => proj.id === suggestedProjectId);
      if (p) {
        setSelectedProjectId(p.id);
        setSelectedProjectName(p.name);
        setSuggestedProjectId(null);
      }
    }
  };

  // Cleanup
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20">
              <Clock size={24} />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              SUIVI DU <span className="text-blue-600">TEMPS</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.5em] ml-16 italic">Operational Tactical Timer</p>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="bg-[#1a1615] rounded-[64px] p-16 text-white relative overflow-hidden shadow-2xl border border-white/5">
        {/* Glow effect */}
        <div className={`absolute top-0 right-0 w-96 h-96 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 transition-colors duration-1000 ${
          timerState === 'running' ? 'bg-emerald-500' : timerState === 'paused' ? 'bg-amber-500' : 'bg-blue-500'
        }`} />

        <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
          {/* Large Clock Display */}
          <div className="space-y-6 text-center lg:text-left shrink-0">
             <div className="flex items-center justify-center lg:justify-start gap-3 text-blue-400">
                <Zap size={14} className={timerState === 'running' ? 'animate-pulse' : ''} />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Cœur du Nœud Temporel</span>
             </div>
             <div className="text-[120px] font-[950] italic tracking-tighter leading-none font-mono selection:bg-blue-500/30">
                {formatTime(elapsedSeconds)}
             </div>
             <div className="flex items-center justify-center lg:justify-start gap-4">
                {timerState === 'stopped' && (
                  <button 
                    onClick={handleStart}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-12 py-6 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-4 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)] hover:scale-105"
                  >
                    <Play size={18} fill="currentColor" /> Initialiser le Suivi
                  </button>
                )}

                {timerState === 'running' && (
                  <>
                    <button 
                      onClick={handlePause}
                      className="bg-amber-500 hover:bg-amber-400 text-black px-10 py-6 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-4 transition-all hover:scale-105"
                    >
                      <Pause size={18} fill="currentColor" /> Suspendre
                    </button>
                    <button 
                      onClick={handleStop}
                      className="bg-rose-500 hover:bg-rose-400 text-white px-10 py-6 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-4 transition-all hover:scale-105"
                    >
                      <Square size={18} fill="currentColor" /> Terminer le Nœud
                    </button>
                  </>
                )}

                {timerState === 'paused' && (
                  <>
                    <button 
                      onClick={handleResume}
                      className="bg-blue-500 hover:bg-blue-400 text-black px-10 py-6 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-4 transition-all hover:scale-105"
                    >
                      <Play size={18} fill="currentColor" /> Reprendre le Protocole
                    </button>
                    <button 
                      onClick={handleStop}
                      className="bg-rose-500 hover:bg-rose-400 text-white px-10 py-6 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-4 transition-all hover:scale-105"
                    >
                      <Square size={18} fill="currentColor" /> Terminer le Nœud
                    </button>
                  </>
                )}
             </div>
          </div>

          {/* Form Configuration */}
          <div className="flex-1 w-full space-y-8">
             <div className="space-y-2">
                <div className="flex items-center justify-between ml-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Nœud de Project Cible</label>
                  <AnimatePresence>
                    {suggestedProjectId && (
                      <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={applySuggestion}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full hover:bg-blue-600 hover:text-white transition-all group"
                      >
                        <BrainCircuit size={10} className="animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Suggestion Neuronale : {projects.find(p => p.id === suggestedProjectId)?.name}</span>
                        <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <div className="relative group">
                  <Briefcase size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <select 
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      const p = projects.find(proj => proj.id === e.target.value);
                      setSelectedProjectName(p?.name || '');
                    }}
                    className={`w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-3xl outline-none transition-all font-bold text-sm italic appearance-none cursor-pointer text-slate-300 focus:text-white ${suggestedProjectId ? 'ring-2 ring-blue-500/50' : 'focus:border-blue-500'}`}
                  >
                    <option value="" className="bg-[#1a1615]">-- Aucun Lien de Project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#1a1615]">
                        {p.name} ({typeof p.client === 'string' ? p.client : 'Global'})
                      </option>
                    ))}
                  </select>
                </div>
             </div>

             <div className="space-y-2">
                <div className="flex items-center justify-between ml-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Description de la Mission</label>
                  {isSuggesting && (
                    <div className="flex items-center gap-2 text-blue-500">
                      <Loader2 size={10} className="animate-spin" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Node Prediction...</span>
                    </div>
                  )}
                </div>
                <div className="relative group">
                   <MessageSquare size={18} className="absolute left-6 top-6 text-slate-500 pointer-events-none" />
                   <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter activity log context..."
                    className="w-full pl-16 pr-8 py-6 bg-white/5 border border-white/10 rounded-3xl outline-none focus:border-blue-500 font-bold transition-all text-sm italic h-32 resize-none text-slate-300 focus:text-white placeholder:text-slate-700"
                   />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* History Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
           <div className="flex items-center gap-3">
              <History size={18} className="text-slate-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Journal du Registre Temporel</h3>
           </div>
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{timeEntries.length} Signals Captured</span>
        </div>

        <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden">
          {loadingHistory ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-slate-200" size={40} /></div>
          ) : timeEntries.length === 0 ? (
            <div className="py-24 text-center space-y-4 opacity-30">
               <Zap size={48} className="mx-auto text-slate-300" />
               <p className="text-[11px] font-black uppercase tracking-[0.4em]">No activity detected in temporal flow.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-10 py-6">Nœud de Mission</th>
                    <th className="px-10 py-6">Operational Log</th>
                    <th className="px-10 py-6">Magnitude (Temps)</th>
                    <th className="px-10 py-6 text-right">Date d'Interception</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-800">
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-8 italic uppercase tracking-tight">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black italic">
                               {entry.project_name?.[0] || 'G'}
                            </div>
                            <span className="text-sm">{entry.project_name || 'Nœud Global'}</span>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <p className="text-xs text-slate-500 font-medium max-w-xs truncate italic">
                           {entry.description || 'Aucun contexte fourni pour cette transmission.'}
                         </p>
                      </td>
                      <td className="px-10 py-8 font-mono text-emerald-600 italic">
                         {formatTime(entry.duration_seconds)}
                      </td>
                      <td className="px-10 py-8 text-right">
                         <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 uppercase">
                            <Calendar size={12} />
                            {new Date(entry.ended_at).toLocaleDateString('fr-FR')}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingPage;
