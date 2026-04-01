
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MarkerType,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  applyNodeChanges
} from 'reactflow';
import { firestoreService } from '../lib/firestore-service';
import { useAuth } from '../context/AuthContext';
// Fix: Use local alias to resolve conflict with local RefreshCw declaration
import { Network, Database, RefreshCw as LucideRefreshCw, Loader2, Sparkles, Orbit } from 'lucide-react';

const nodeStyles: Record<string, any> = {
  organization: { background: '#1a1615', color: '#fff', borderRadius: '50%', width: 160, height: 160, border: '6px solid #3b82f6', fontWeight: '950', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)', textTransform: 'uppercase', fontStyle: 'italic' },
  profile: { background: '#fff', color: '#1a1615', borderRadius: '32px', padding: '12px 24px', border: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', textAlign: 'center' },
};

const MindMapPage: React.FC = () => {
  const { orgId, profile: userProfile } = useAuth();
  const [nodes, setNodes, onNodesChangeState] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);

  // Custom onNodesChange to handle selection and trigger edge updates
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        return nextNodes;
      });
    },
    [setNodes]
  );

  const loadGraph = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    try {
      const profiles = await firestoreService.getCollection('profiles', orgId, []);

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Node Central: L'Organisation
      newNodes.push({
        id: 'org_center',
        data: { label: userProfile?.metadata?.company_name || 'KERNEL CORE' },
        position: { x: 500, y: 500 },
        style: nodeStyles.organization,
        type: 'default',
        selectable: false,
      });

      // Nodes Operatives orbitant
      profiles?.forEach((p: any, i) => {
        const total = profiles.length;
        const angle = (i / total) * 2 * Math.PI;
        const radius = 350;
        
        newNodes.push({
          id: p.id,
          data: { label: `${(p.full_name || '').toUpperCase()}\n${p.metadata?.job_title || 'OPERATIVE'}` },
          position: { 
            x: 500 + Math.cos(angle) * radius, 
            y: 500 + Math.sin(angle) * radius 
          },
          style: {
            ...nodeStyles.profile,
            border: p.onboarding_completed ? '1px solid #e2e8f0' : '2px dashed #3b82f6'
          }
        });

        // Connexions Synaptiques avec Animation de Flux
        newEdges.push({
          id: `synapse-${p.id}`,
          source: 'org_center',
          target: p.id,
          animated: true, 
          markerEnd: { 
            type: MarkerType.ArrowClosed, 
            color: p.onboarding_completed ? '#3b82f6' : '#60a5fa', 
            width: 20, 
            height: 20 
          },
          style: { 
            stroke: p.onboarding_completed ? '#3b82f6' : '#60a5fa', 
            strokeWidth: p.onboarding_completed ? 2 : 3,
            opacity: 0.8,
            transition: 'all 0.3s ease-in-out'
          }
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      console.error('Graph calibration failure:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, userProfile, setNodes, setEdges]);

  // Highlight effect when a node is selected
  useEffect(() => {
    const selectedNodeId = nodes.find(n => n.selected)?.id;
    
    setEdges((eds) => 
      eds.map((edge) => {
        const isTargetSelected = edge.target === selectedNodeId;
        
        if (isTargetSelected) {
          return {
            ...edge,
            className: 'pulsing-synapse',
            style: {
              ...edge.style,
              stroke: '#10b981',
              strokeWidth: 5,
              opacity: 1,
            },
            markerEnd: {
              ...(typeof edge.markerEnd === 'object' ? edge.markerEnd : { type: MarkerType.ArrowClosed }),
              color: '#10b981',
            }
          };
        }

        // Return to original state if not selected
        const node = nodes.find(n => n.id === edge.target);
        const isComplete = typeof node?.style?.border === 'string' ? node?.style?.border?.includes('solid') : true;
        const baseColor = isComplete ? '#3b82f6' : '#60a5fa';

        return {
          ...edge,
          className: '',
          style: {
            ...edge.style,
            stroke: baseColor,
            strokeWidth: isComplete ? 2 : 3,
            opacity: 0.8,
          },
          markerEnd: {
            ...(typeof edge.markerEnd === 'object' ? edge.markerEnd : { type: MarkerType.ArrowClosed }),
            color: baseColor,
          }
        };
      })
    );
  }, [nodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  return (
    <div className="space-y-12 max-w-[1700px] mx-auto pb-24 h-[calc(100vh-160px)] flex flex-col">
      <style>{`
        @keyframes synapse-glow {
          0%, 100% { filter: drop-shadow(0 0 2px #10b981); stroke-width: 4; }
          50% { filter: drop-shadow(0 0 12px #10b981); stroke-width: 6; }
        }
        .pulsing-synapse path {
          animation: synapse-glow 1.5s infinite ease-in-out;
        }
      `}</style>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shrink-0">
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20">
              <Network size={24} />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Graphe de <span className="text-blue-600">Connaissance</span></h1>
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.5em] ml-16 italic">Visualisation des Connexions Neuronales</p>
        </div>

        <div className="flex items-center gap-6">
           <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <Orbit size={16} className="text-blue-500 animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nœuds Synchronisés : {nodes.length}</span>
           </div>
           <button onClick={loadGraph} className="bg-black text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 shadow-xl transition-all italic">
            <LucideRefreshCw size={16} className={loading ? 'animate-spin' : ''} /> SYNCHRONISER LE GRAPHE
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[48px] border border-slate-100 shadow-2xl relative overflow-hidden flex flex-col group">
        <div className="flex-1 relative bg-slate-50/50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Background color="#cbd5e1" gap={25} size={1} />
            <Controls />
          </ReactFlow>

          {loading && (
             <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Cartographie des Synapses...</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MindMapPage;
