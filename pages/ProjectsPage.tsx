
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, Plus, Search, LayoutGrid, List, 
  Calendar, AlertCircle, ChevronRight, 
  Filter, GitMerge, DollarSign, Target, X, CheckCircle2,
  Clock, ArrowUpRight, BrainCircuit, Sparkles, 
  Zap, TrendingUp, Loader2, Activity, ShieldCheck,
  MoreVertical, Trash2, Rocket
} from 'lucide-react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { firestoreService } from '../lib/firestore-service';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { formatMAD } from '../lib/local-adaptation';

// --- SUB-COMPONENTS ---

// Fix: Local definition of PriorityBadge to resolve "Cannot find name" error
const PriorityBadge = ({ level }: { level: Project['priority'] }) => {
  const styles = {
    High: 'bg-green-50 text-green-600 border-green-100',
    Medium: 'bg-orange-50 text-orange-600 border-orange-100',
    Low: 'bg-red-50 text-red-600 border-red-100'
  };
  const dotStyles = {
    High: 'bg-green-600',
    Medium: 'bg-orange-600',
    Low: 'bg-red-600'
  };
  const translatedLevel = level === 'High' ? 'Haute' : level === 'Medium' ? 'Moyenne' : 'Basse';
  return (
    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${styles[level]} flex items-center gap-2 w-fit`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dotStyles[level]}`} />
      {translatedLevel}
    </span>
  );
};

// Fix: Use React.FC to properly handle standard props like 'key' in TypeScript
const ProjectCard: React.FC<{ project: Project, onClick: () => void }> = ({ project, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={onClick}
      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer relative mb-4"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-[32px]" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-lg italic uppercase tracking-tighter">{project.name}</h3>
        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
          project.priority === 'High' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'
        }`}>
          {project.priority === 'High' ? 'Haute' : project.priority === 'Medium' ? 'Moyenne' : 'Basse'}
        </div>
      </div>
      
      <div className="mb-4 space-y-2">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
          <span>Déploiement</span>
          <span>{project.status === 'DEPLOYED' ? '100%' : 'Actif'}</span>
        </div>
        <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: project.status === 'DEPLOYED' ? '100%' : '65%' }}
            className={`h-full ${project.status === 'DEPLOYED' ? 'bg-emerald-500' : 'bg-blue-600'} transition-all`}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[8px] font-black text-white italic uppercase">
             {typeof project.client === 'string' ? project.client[0] : 'U'}
           </div>
           <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[80px] italic">{typeof project.client === 'string' ? project.client : 'Node'}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-slate-900 italic">
          <DollarSign size={10} className="text-emerald-500" />
          {Number(project.revenue || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// Fix: Use React.FC to properly handle standard props like 'key' in TypeScript
const KanbanColumn: React.FC<{ id: string, title: string, projects: Project[], onProjectClick: (p: Project) => void }> = ({ id, title, projects, onProjectClick }) => {
  return (
    <div className="flex flex-col gap-6 min-w-[320px] bg-slate-50/50 p-6 rounded-[40px] border border-slate-100 h-full">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${id === 'DEPLOYED' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">{title}</h3>
        </div>
        <span className="text-[10px] font-black text-slate-300 bg-white border border-slate-100 px-3 py-1 rounded-full">{projects.length}</span>
      </div>
      
      <SortableContext id={id} items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onClick={() => onProjectClick(project)} />
          ))}
          {projects.length === 0 && (
            <div className="py-12 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-4 opacity-30">
               <Briefcase size={32} />
               <p className="text-[9px] font-black uppercase tracking-widest">Secteur Vide</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

// --- MAIN PAGE ---

const ProjectsPage: React.FC = () => {
  const { orgId, hasPermission } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [aiForecast, setAiForecast] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const fetchProjects = useCallback(async (isSilent = false) => {
    if (!orgId) return;
    if (!isSilent) setLoading(true);
    try {
      const data = await firestoreService.getCollection('projects', orgId, [], 'created_at', 'desc');
      setProjects(data as Project[] || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchProjects();
    if (!orgId) return;
    
    const unsubscribe = firestoreService.subscribeToCollection(
      'projects',
      orgId,
      [],
      (data) => setProjects(data as Project[]),
      'created_at',
      'desc'
    );

    return () => unsubscribe();
  }, [fetchProjects, orgId]);

  const runAIPreduction = async (project: Project) => {
    if (!process.env.GEMINI_API_KEY) return;
    setIsPredicting(true);
    setAiForecast(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        UNY MISSION ORACLE v5.0
        TARGET MISSION: ${project.name}
        STATUS: ${project.status}
        REVENUE LOCK: ${formatMAD(project.revenue || 0)}
        PRIORITY: ${project.priority}
        
        Analyze the drift probability and completion likelihood.
        Return structured JSON with:
        - completion_probability: number (0-100)
        - risk_level: "LOW" | "MEDIUM" | "HIGH"
        - risk_factors: string[] (top 3)
        - tactical_advice: string
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              completion_probability: { type: Type.NUMBER },
              risk_level: { type: Type.STRING },
              risk_factors: { type: Type.ARRAY, items: { type: Type.STRING } },
              tactical_advice: { type: Type.STRING }
            }
          }
        }
      });
      setAiForecast(JSON.parse(response.text || "{}"));
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;
    
    const projectId = active.id;
    const newStatus = over.id;
    
    if (newStatus !== projects.find(p => p.id === projectId)?.status) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
      await firestoreService.updateDocument('projects', orgId!, projectId, { status: newStatus });
    }
  };

  const columns = [
    { id: 'PROSPECTION', title: 'Prospection', icon: Target },
    { id: 'AUDIT', title: 'Audit en cours', icon: Search },
    { id: 'DEPLOYED', title: 'Déployé', icon: Rocket }
  ];

  const ganttTasks: Task[] = useMemo(() => {
    return projects.map((p, i) => ({
      start: p.created_at ? new Date(p.created_at) : new Date(),
      end: p.deadline ? new Date(p.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      name: p.name,
      id: p.id,
      type: 'task',
      progress: p.status === 'DEPLOYED' ? 100 : 45,
      styles: { backgroundColor: p.status === 'DEPLOYED' ? '#10b981' : '#3B82F6', backgroundSelectedColor: '#1A1615' }
    }));
  }, [projects]);

  return (
    <div className="space-y-12 max-w-[1700px] mx-auto pb-32 relative">
      
      {/* HEADER COMMAND SECTION */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5">
              <Briefcase size={28} />
            </div>
            <div>
              <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                Grille des <span className="text-blue-600">Missions</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">Orchestration du Flux Opérationnel</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="bg-white p-2 rounded-full border border-slate-100 shadow-xl flex items-center gap-1">
             {[
               { id: 'kanban', icon: LayoutGrid, label: 'Tableau' },
               { id: 'timeline', icon: GitMerge, label: 'Chronologie' },
               { id: 'list', icon: List, label: 'Liste' }
             ].map(mode => (
               <button 
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                  viewMode === mode.id ? 'bg-[#1A1615] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
                }`}
               >
                 <mode.icon size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
               </button>
             ))}
          </div>
          <button className="bg-blue-600 text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:bg-black transition-all shadow-[0_20px_40px_rgba(59,130,246,0.2)] italic">
            <Plus size={20} /> Initialiser le Nœud
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Missions Actives', value: projects.filter(p => p.status !== 'DEPLOYED').length, icon: Activity, color: 'text-blue-600' },
          { label: 'Capacité Neuronale', value: '84%', icon: Zap, color: 'text-amber-500' },
          { label: 'Revenus Sécurisés', value: formatMAD(projects.reduce((s, p) => s + (p.revenue || 0), 0), false), icon: DollarSign, color: 'text-emerald-500' },
          { label: 'Indice d\'Intégrité', value: 'Optimal', icon: ShieldCheck, color: 'text-indigo-600' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
             <div className={`p-5 bg-slate-50 rounded-2xl ${kpi.color} group-hover:bg-[#1A1615] group-hover:text-white transition-all`}>
                <kpi.icon size={24} />
             </div>
             <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">{kpi.label}</p>
                <p className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">{kpi.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* MAIN VIEW AREA */}
      <div className="min-h-[600px] relative">
         <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center">
                 <Loader2 size={48} className="animate-spin text-slate-200" />
              </motion.div>
            ) : viewMode === 'kanban' ? (
              <motion.div key="kanban" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-8 overflow-x-auto no-scrollbar pb-10 items-start">
                 <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                    {columns.map(col => (
                      <KanbanColumn key={col.id} id={col.id} title={col.title} projects={projects.filter(p => p.status === col.id)} onProjectClick={(p) => { setSelectedProject(p); runAIPreduction(p); }} />
                    ))}
                 </DndContext>
              </motion.div>
            ) : viewMode === 'timeline' ? (
              <motion.div key="timeline" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[56px] p-10 border border-slate-100 shadow-2xl overflow-hidden">
                 {ganttTasks.length > 0 ? (
                   <Gantt tasks={ganttTasks} viewMode={ViewMode.Month} listCellWidth="200px" columnWidth={80} />
                 ) : (
                   <div className="py-40 text-center space-y-4 opacity-30 italic">
                      <GitMerge size={64} className="mx-auto" />
                      <p className="text-xl font-black uppercase">Aucun nœud temporel détecté</p>
                   </div>
                 )}
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[56px] border border-slate-100 shadow-2xl overflow-hidden">
                 <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-12 py-8">Nœud de Mission</th>
                        <th className="px-12 py-8">Client Ancrage</th>
                        <th className="px-12 py-8">Priorité</th>
                        <th className="px-12 py-8">Statut</th>
                        <th className="px-12 py-8 text-right">Revenus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {projects.map(p => (
                        <tr key={p.id} onClick={() => setSelectedProject(p)} className="hover:bg-slate-50/50 transition-all cursor-pointer group font-bold">
                           <td className="px-12 py-8 text-lg font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-blue-600">{p.name}</td>
                           <td className="px-12 py-8 text-slate-500 uppercase italic text-sm">{typeof p.client === 'string' ? p.client : '---'}</td>
                           <td className="px-12 py-8"><PriorityBadge level={p.priority} /></td>
                           <td className="px-12 py-8"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{p.status === 'DEPLOYED' ? 'Déployé' : p.status === 'AUDIT' ? 'Audit en cours' : p.status === 'PROSPECTION' ? 'Prospection' : 'Inconnu'}</span></td>
                           <td className="px-12 py-8 text-right font-black italic text-xl">{formatMAD(Number(p.revenue || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* DETAIL OVERLAY */}
      <AnimatePresence>
         {selectedProject && (
           <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProject(null)} className="fixed inset-0 bg-[#1A1615]/80 backdrop-blur-md z-[500]" />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-2xl bg-white shadow-2xl z-[501] p-16 overflow-y-auto no-scrollbar"
            >
               <button onClick={() => setSelectedProject(null)} className="absolute top-10 right-10 p-4 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                 <X size={24} />
               </button>

               <div className="space-y-12">
                  <header className="space-y-6">
                    <div className="flex items-center gap-4 text-blue-600">
                      <Target size={24} />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em]">Renseignement Légal de Mission</span>
                    </div>
                    <h2 className="text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-[0.9]">{selectedProject.name}</h2>
                    <div className="flex gap-4">
                       <PriorityBadge level={selectedProject.priority} />
                       <div className="px-4 py-1.5 bg-[#1A1615] text-white rounded-lg text-[9px] font-black uppercase tracking-widest italic">{selectedProject.status === 'DEPLOYED' ? 'Déployé' : selectedProject.status === 'AUDIT' ? 'Audit en cours' : selectedProject.status === 'PROSPECTION' ? 'Prospection' : 'Inconnu'}</div>
                    </div>
                  </header>

                  {/* AI FORECAST SECTION */}
                  <section className="bg-[#1A1615] rounded-[48px] p-10 text-white space-y-10 relative overflow-hidden group border border-white/5 shadow-2xl">
                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-[5s] pointer-events-none">
                        <BrainCircuit size={240} />
                     </div>
                     <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4 text-blue-400">
                              <Sparkles size={20} className="animate-pulse" />
                              <span className="text-[11px] font-black uppercase tracking-[0.5em]">Trajectoire Prédictive</span>
                           </div>
                           {aiForecast && (
                             <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 ${
                               aiForecast.risk_level === 'LOW' ? 'bg-emerald-500/20 text-emerald-400' : 
                               aiForecast.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                             }`}>
                                Risque Détecté : {aiForecast.risk_level === 'LOW' ? 'FAIBLE' : aiForecast.risk_level === 'MEDIUM' ? 'MOYEN' : 'ÉLEVÉ'}
                             </div>
                           )}
                        </div>

                        {isPredicting ? (
                          <div className="space-y-6 py-4">
                             <div className="h-2.5 bg-white/5 rounded-full w-full animate-pulse" />
                             <div className="h-2.5 bg-white/5 rounded-full w-[85%] animate-pulse" />
                             <div className="h-2.5 bg-white/5 rounded-full w-[60%] animate-pulse" />
                          </div>
                        ) : aiForecast ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-8">
                             <div className="flex items-baseline gap-4">
                                <span className="text-[80px] font-[950] italic tracking-tighter leading-none text-blue-500">{aiForecast.completion_probability}%</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500 leading-none">Probabilité <br /> de Succès</span>
                             </div>
                             
                             <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic">Observation Légale :</p>
                                <p className="text-xl font-bold leading-relaxed text-slate-300 italic uppercase tracking-tighter">"{aiForecast.tactical_advice}"</p>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {aiForecast.risk_factors.map((rf: string, idx: number) => (
                                  <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 group/rf hover:bg-white/10 transition-all">
                                     <AlertCircle size={14} className="text-rose-500 group-hover/rf:scale-110 transition-transform" />
                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{rf}</span>
                                  </div>
                                ))}
                             </div>
                          </motion.div>
                        ) : (
                          <div className="py-12 flex flex-col items-center justify-center gap-6 text-center">
                             <div className="w-20 h-20 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center animate-spin-slow">
                                <Activity size={32} className="text-slate-700" />
                             </div>
                             <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Lien Neuronal en Attente</p>
                             <button 
                               onClick={() => runAIPreduction(selectedProject)}
                               className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl italic"
                             >
                                Lancer la Prédiction Système
                             </button>
                          </div>
                        )}
                     </div>
                  </section>

                  {/* STANDARD DATA */}
                  <div className="grid grid-cols-2 gap-8">
                     <div className="p-10 bg-slate-50 rounded-[48px] border border-slate-100 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Verrouillage des Revenus du Nœud</p>
                        <p className="text-4xl font-[950] italic tracking-tighter text-emerald-600 leading-none">{formatMAD(Number(selectedProject.revenue || 0))}</p>
                     </div>
                     <div className="p-10 bg-slate-50 rounded-[48px] border border-slate-100 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Limite Temporelle</p>
                        <p className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none uppercase">{selectedProject.deadline || 'Non défini'}</p>
                     </div>
                  </div>

                  <div className="pt-12 border-t border-slate-100 flex gap-4">
                     <button className="flex-1 py-6 bg-[#1A1615] text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl italic flex items-center justify-center gap-4">
                        <Activity size={18} /> Journal d'Opération
                     </button>
                     <button className="p-6 bg-rose-50 text-rose-500 rounded-3xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-inner">
                        <Trash2 size={24} />
                     </button>
                  </div>
               </div>
            </motion.div>
           </>
         )}
      </AnimatePresence>

    </div>
  );
};

export default ProjectsPage;
