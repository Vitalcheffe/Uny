import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
// Fix: Removed Loader2 from import to resolve conflict with local declaration
import { ChevronDown, PlusCircle, Briefcase, Plus, X, Terminal, Target, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firestoreService } from '../../lib/supabase-data-layer';
import { useAuth } from '../../context/AuthContext';

const TableSkeleton = () => (
  <div className="bg-white rounded-[32px] border border-slate-50 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
      <div className="h-6 w-32 animate-shimmer rounded-lg" />
      <div className="h-8 w-8 animate-shimmer rounded-full" />
    </div>
    <div className="p-8 space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-slate-50 last:border-0 pb-4">
          <div className="h-4 w-1/4 animate-shimmer rounded" />
          <div className="h-4 w-1/6 animate-shimmer rounded" />
          <div className="h-8 w-20 animate-shimmer rounded-full" />
          <div className="h-4 w-1/6 animate-shimmer rounded" />
          <div className="h-8 w-24 animate-shimmer rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

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
  return (
    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${styles[level]} flex items-center gap-2 w-fit`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dotStyles[level]}`} />
      {level}
    </span>
  );
};

interface ProjectsTableProps {
  data: Project[];
  loading: boolean;
  onRefresh?: () => void;
}

const ProjectsTable: React.FC<ProjectsTableProps> = ({ data, loading, onRefresh }) => {
  const { orgId } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    revenue: '',
    priority: 'Medium' as Project['priority']
  });

  // Real-time synchronization logic
  useEffect(() => {
    if (!orgId || !onRefresh) return;

    const unsubscribe = firestoreService.subscribeToCollection(
      'projects',
      orgId,
      [],
      (data) => {
        console.debug('🚀 [UNY] Real-time Project Signal Detected');
        onRefresh();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [orgId, onRefresh]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !newProject.name) return;

    setCreatingLoading(true);
    try {
      await firestoreService.addDocument('projects', orgId, {
        name: newProject.name,
        revenue: parseFloat(newProject.revenue) || 0,
        priority: newProject.priority,
        status: 'Ongoing',
        updated_at: new Date().toISOString()
      });

      setIsCreating(false);
      setNewProject({ name: '', revenue: '', priority: 'Medium' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Mission Deployment Error:", err);
    } finally {
      setCreatingLoading(false);
    }
  };

  if (loading && data.length === 0) return <TableSkeleton />;

  return (
    <div className="bg-white rounded-[32px] border border-slate-50 shadow-sm overflow-hidden relative">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ChevronDown size={20} className="text-slate-400" />
          <h3 className="font-bold">Ongoing Mission Nodes <span className="text-slate-400 font-medium ml-2">{data.length}</span></h3>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="text-blue-500 hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
        >
          <PlusCircle size={24} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-[0.1em]">
            <tr>
              <th className="px-8 py-4 whitespace-nowrap">Node Name</th>
              <th className="px-8 py-4 whitespace-nowrap">Primary Client</th>
              <th className="px-8 py-4 whitespace-nowrap">Criticality</th>
              <th className="px-8 py-4 whitespace-nowrap">Interception</th>
              <th className="px-8 py-4 whitespace-nowrap">Revenue Lock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <Briefcase size={32} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 italic uppercase tracking-tight">Empty Mission Grid</p>
                      <p className="text-xs text-slate-400 font-semibold max-w-[240px] mx-auto mt-2 leading-relaxed uppercase tracking-widest">
                        No projects detected in this sector. Deploy your first mission node to begin tracking.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5 text-sm font-bold text-slate-800 italic">{project.name}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">
                        {typeof project.client === 'string' ? project.client[0] : 'U'}
                      </div>
                      <span className="text-sm font-semibold text-slate-600">
                        {typeof project.client === 'string' ? project.client : 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <PriorityBadge level={project.priority} />
                  </td>
                  <td className="px-8 py-5 text-sm font-semibold text-slate-500 whitespace-nowrap uppercase tracking-tighter">
                    {project.deadline || 'TBD'}
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-slate-800">
                    ${(project.revenue || 0).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1a1615]/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[48px] shadow-2xl w-full max-w-lg p-10 border border-slate-100 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Target size={120} />
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4 text-blue-600">
                  <Terminal size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Mission Deployment</span>
                </div>
                <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-black transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Node Name</label>
                  <input 
                    autoFocus
                    required
                    type="text" 
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    placeholder="e.g. Project Alpha" 
                    className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Revenue Node ($)</label>
                    <input 
                      type="text" 
                      value={newProject.revenue}
                      onChange={(e) => setNewProject({...newProject, revenue: e.target.value})}
                      placeholder="e.g. 5000" 
                      className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Criticality</label>
                    <select 
                      value={newProject.priority}
                      onChange={(e) => setNewProject({...newProject, priority: e.target.value as Project['priority']})}
                      className="w-full px-8 py-5 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-lg appearance-none cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={creatingLoading}
                  className="w-full py-6 bg-black text-white rounded-[28px] font-black text-sm uppercase tracking-[0.3em] shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4 italic"
                >
                  {creatingLoading ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      <Plus size={18} />
                      Deploy Node
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectsTable;
