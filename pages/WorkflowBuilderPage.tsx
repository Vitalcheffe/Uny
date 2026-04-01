import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Handle,
  Position,
  MarkerType,
  Connection
} from 'reactflow';
import { 
  Zap, GitMerge, Save, Play, Trash2, 
  Bell, FileText, Users, Mail, ShieldCheck, 
  Plus, Terminal, BrainCircuit, Activity,
  AlertCircle, ChevronRight, X, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../lib/supabase-data-layer';

// --- Custom Nodes ---

const TriggerNode = ({ data }: any) => (
  <div className="px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 min-w-[200px] group">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
        <Zap size={14} fill="currentColor" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">Nœud Déclencheur</span>
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-black italic uppercase tracking-tighter">{data.label}</h4>
      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Attente de signal</p>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-white" />
  </div>
);

const ConditionNode = ({ data }: any) => (
  <div className="px-6 py-4 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-100 min-w-[180px] group">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400 border-2 border-white" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
        <Activity size={14} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500">Porte Logique</span>
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-black italic uppercase tracking-tighter">{data.label}</h4>
      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Évaluation booléenne</p>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500 border-2 border-white" />
  </div>
);

const ActionNode = ({ data }: any) => (
  <div className="px-6 py-4 bg-blue-600 text-white rounded-2xl shadow-2xl border border-blue-500 min-w-[180px] group">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-400 border-2 border-white" />
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-white/10 text-white rounded-lg">
        <Play size={14} fill="currentColor" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Nœud d'Action</span>
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-black italic uppercase tracking-tighter">{data.label}</h4>
      <p className="text-[8px] font-bold text-blue-200 uppercase tracking-widest leading-none">Exécution système</p>
    </div>
  </div>
);

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};

// --- Main Component ---

const WorkflowBuilderPage: React.FC = () => {
  const { orgId, hasPermission } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [isSaving, setIsSaving] = useState(false);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [workflowName, setWorkflowName] = useState('Nouveau Workflow');
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    const unsubscribe = firestoreService.subscribeToCollection(
      'workflows',
      orgId,
      [],
      (data) => {
        setSavedWorkflows(data);
      }
    );
    return () => unsubscribe();
  }, [orgId]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
    }, eds)),
    [setEdges]
  );

  const addNode = (type: 'trigger' | 'condition' | 'action', label: string) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      data: { label },
      position: { x: 250, y: 250 },
    };
    setNodes((nds) => nds.concat(newNode));
    setShowNodeMenu(false);
  };

  const saveWorkflow = async () => {
    if (!orgId) return;
    setIsSaving(true);
    try {
      const workflowData = {
        name: workflowName,
        nodes,
        edges,
        organization_id: orgId,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      if (activeWorkflowId) {
        await firestoreService.updateDocument('workflows', orgId, activeWorkflowId, workflowData);
      } else {
        const docId = await firestoreService.addDocument('workflows', orgId, {
          ...workflowData,
          created_at: new Date().toISOString()
        });
        setActiveWorkflowId(docId);
      }
    } catch (error) {
      console.error("Save Error:", error);
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  const loadWorkflow = (wf: any) => {
    setActiveWorkflowId(wf.id);
    setWorkflowName(wf.name);
    setNodes(wf.nodes || []);
    setEdges(wf.edges || []);
  };

  const deleteWorkflow = async (id: string) => {
    if (confirm("Delete this workflow permanently?")) {
      try {
        await firestoreService.deleteDocument('workflows', orgId!, id);
        if (activeWorkflowId === id) {
          setActiveWorkflowId(null);
          setNodes([]);
          setEdges([]);
          setWorkflowName('Nouveau Workflow');
        }
      } catch (error) {
        console.error("Delete Error:", error);
      }
    }
  };

  const canWrite = hasPermission('admin', 'write');

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-8 max-w-[1700px] mx-auto pb-4">
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shrink-0">
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-blue-600">
              <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20">
                <GitMerge size={24} />
              </div>
              <input 
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="bg-transparent border-none text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none focus:ring-0 w-auto min-w-[300px]"
              />
            </div>
            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.5em] ml-16 italic">Autonomous Workflow Orchestration</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowNodeMenu(true)}
            disabled={!canWrite}
            className="bg-blue-600 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 shadow-xl transition-all italic disabled:opacity-50"
          >
            <Plus size={16} /> ADD COMPONENT
          </button>
          
          <div className="h-10 w-px bg-slate-200 mx-2" />
          
          <button 
            onClick={saveWorkflow}
            disabled={!canWrite || isSaving}
            className="bg-black text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 shadow-xl transition-all italic disabled:opacity-50"
          >
            {isSaving ? <CustomLoader className="animate-spin" size={16} /> : <Save size={16} />}
            {isSaving ? 'SYNCING...' : 'COMMIT LOGIC'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Sidebar: Saved Workflows */}
        <div className="w-80 glass-card rounded-[48px] p-8 space-y-8 overflow-y-auto no-scrollbar border border-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Bibliothèque</h3>
          <div className="space-y-4">
            {savedWorkflows.map(wf => (
              <div 
                key={wf.id}
                onClick={() => loadWorkflow(wf)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer group ${activeWorkflowId === wf.id ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase italic truncate pr-4">{wf.name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteWorkflow(wf.id); }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={() => { setActiveWorkflowId(null); setNodes([]); setEdges([]); setWorkflowName('Nouveau Workflow'); }}
              className="w-full p-5 rounded-3xl border border-dashed border-white/10 text-zinc-600 hover:text-white hover:border-white/30 transition-all text-[10px] font-black uppercase tracking-widest italic"
            >
              + Nouveau Pont
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-white rounded-[56px] border border-slate-100 shadow-2xl overflow-hidden relative group">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#cbd5e1" gap={30} size={1} />
            <Controls />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-white/80 backdrop-blur-sm p-12 rounded-[40px] border border-slate-200 shadow-2xl flex flex-col items-center text-center max-w-md pointer-events-auto">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <BrainCircuit size={32} className="text-blue-500" />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-3">
                  AUCUN WORKFLOW ACTIF
                </h3>
                <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">
                  L'espace de travail est vide. Initialisez un nouveau flux logique pour automatiser vos processus.
                </p>
                <button 
                  onClick={() => setShowNodeMenu(true)}
                  className="bg-blue-600 text-white px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl flex items-center gap-3"
                >
                  <Plus size={16} />
                  Créer un Nœud
                </button>
              </div>
            </div>
          )}

          {/* Overlay Info */}
          <div className="absolute top-8 left-8 p-6 bg-slate-900/90 backdrop-blur-xl rounded-[32px] border border-white/10 text-white space-y-4 max-w-xs pointer-events-none shadow-2xl">
             <div className="flex items-center gap-3 text-blue-400">
                <BrainCircuit size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Engine v4.2</span>
             </div>
             <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter italic">
                Active workflows process signals from document ingestion, RH alerts, and financial drifts.
             </p>
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase text-emerald-500">Execution Layer: Nominal</span>
             </div>
          </div>
        </div>
      </div>

      {/* Component Selection Modal */}
      <AnimatePresence>
        {showNodeMenu && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNodeMenu(false)} className="absolute inset-0 bg-[#1a1615]/80 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[64px] p-16 shadow-2xl border border-slate-100 overflow-hidden"
            >
              <button onClick={() => setShowNodeMenu(false)} className="absolute top-10 right-10 p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
                <X size={24} />
              </button>

              <header className="mb-12 space-y-4">
                <div className="flex items-center gap-4 text-blue-600">
                  <Terminal size={24} />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Logic Component Library</span>
                </div>
                <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
                  SELECT <br /> <span className="text-blue-600">GATEWAY</span>
                </h2>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Triggers Column */}
                <div className="space-y-6">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2">Triggers (Entry)</h3>
                   <div className="space-y-3">
                      {[
                        { label: 'New Invoice', event: 'NEW_INVOICE' },
                        { label: 'Document Upload', event: 'DOC_INGESTED' },
                        { label: 'RH Anomaly', event: 'RH_DRIFT' },
                        { label: 'Contract Expiration', event: 'CONTRACT_EXPIRING' }
                      ].map(item => (
                        <button 
                          key={item.event}
                          onClick={() => addNode('trigger', item.event)}
                          className="w-full p-6 rounded-[28px] bg-slate-900 text-white text-left hover:scale-[1.03] transition-all group shadow-xl"
                        >
                           <div className="flex items-center gap-4 mb-2">
                             <Zap size={14} className="text-blue-400" />
                             <span className="text-sm font-black italic uppercase tracking-tight">{item.label}</span>
                           </div>
                           <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">External Signal Receptor</p>
                        </button>
                      ))}
                   </div>
                </div>

                {/* Conditions Column */}
                <div className="space-y-6">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2">Conditions (Logic)</h3>
                   <div className="space-y-3">
                      {[
                        { label: 'Value Filter', logic: 'AMOUNT > X' },
                        { label: 'Department Filter', logic: 'DEPT == "FINANCE"' },
                        { label: 'Sentiment Check', logic: 'SCORE < 50' },
                        { label: 'Temporal Gap', logic: 'TIME > 48H' }
                      ].map(item => (
                        <button 
                          key={item.label}
                          onClick={() => addNode('condition', item.logic)}
                          className="w-full p-6 rounded-[28px] bg-white border border-slate-100 text-left hover:shadow-xl hover:scale-[1.03] transition-all group"
                        >
                           <div className="flex items-center gap-4 mb-2">
                             <Filter size={14} className="text-amber-500" />
                             <span className="text-sm font-black italic uppercase tracking-tight text-slate-900">{item.label}</span>
                           </div>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.logic}</p>
                        </button>
                      ))}
                   </div>
                </div>

                {/* Actions Column */}
                <div className="space-y-6">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2">Actions (Execution)</h3>
                   <div className="space-y-3">
                      {[
                        { label: 'Notify Team', action: 'SEND_TELEMETRY' },
                        { label: 'Lock Resource', action: 'GATED_ACCESS' },
                        { label: 'Generate Link', action: 'CREATE_SYNAPSE' },
                        { label: 'Alert Owner', action: 'SENTINEL_ALARM' }
                      ].map(item => (
                        <button 
                          key={item.label}
                          onClick={() => addNode('action', item.action)}
                          className="w-full p-6 rounded-[28px] bg-blue-600 text-white text-left hover:scale-[1.03] transition-all group shadow-2xl shadow-blue-500/20"
                        >
                           <div className="flex items-center gap-4 mb-2">
                             <Play size={14} className="text-white" />
                             <span className="text-sm font-black italic uppercase tracking-tight">{item.label}</span>
                           </div>
                           <p className="text-[8px] font-bold text-blue-200 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Kernel Command</p>
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="mt-16 pt-8 border-t border-slate-50 flex items-center justify-between opacity-30 italic">
                <div className="flex items-center gap-4">
                   <ShieldCheck size={18} />
                   <p className="text-[9px] font-black uppercase tracking-widest">End-to-End Logic Protection Active</p>
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest">UNY HUB v4.2.1-LIVE</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowBuilderPage;

function CustomLoader(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
