
import React, { useState, useEffect, useCallback, memo } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MarkerType,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from 'reactflow';
import { firestoreService } from '../../lib/supabase-data-layer';
import { useAuth } from '../../context/AuthContext';
import { Network, Database, RefreshCw, Loader2, ShieldCheck, UserCheck } from 'lucide-react';

const nodeStyles: Record<string, any> = {
  project: { background: '#3b82f6', color: '#fff', borderRadius: '24px', padding: '10px 20px', border: 'none', fontWeight: 'bold', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.5)' },
  client: { background: '#1a1615', color: '#fff', borderRadius: '24px', padding: '10px 20px', border: 'none', fontWeight: 'bold', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' },
  document: { background: '#fff', color: '#64748b', borderRadius: '24px', padding: '10px 20px', border: '2px dashed #cbd5e1', fontWeight: 'bold', fontSize: '10px' },
  operative: { background: '#8b5cf6', color: '#fff', borderRadius: '24px', padding: '10px 20px', border: 'none', fontWeight: 'bold', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.5)' },
  raw_material: { background: '#f59e0b', color: '#fff', borderRadius: '20px', padding: '10px 20px', border: 'none', fontWeight: '900', fontSize: '10px', fontStyle: 'italic' },
  tech_resource: { background: '#06b6d4', color: '#fff', borderRadius: '20px', padding: '10px 20px', border: 'none', fontWeight: '900', fontSize: '10px', fontStyle: 'italic' },
  logistic_hub: { background: '#10b981', color: '#fff', borderRadius: '20px', padding: '10px 20px', border: 'none', fontWeight: '900', fontSize: '10px', fontStyle: 'italic' }
};

const UNYNode = memo(({ data }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const baseStyle = nodeStyles[data.type] || nodeStyles.operative;

  // Calculate glow color based on background
  const glowColor = baseStyle.background === '#fff' ? '#cbd5e1' : baseStyle.background;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...baseStyle,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'scale(1.12)' : 'scale(1)',
        boxShadow: isHovered 
          ? `0 20px 40px -10px ${glowColor}80, 0 0 25px ${glowColor}40` 
          : baseStyle.boxShadow,
        cursor: 'pointer',
        zIndex: isHovered ? 10 : 1,
        position: 'relative'
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className="flex items-center gap-2">
        {isHovered && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
        <span className="whitespace-nowrap uppercase tracking-tighter">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
});

const nodeTypes = {
  uny: UNYNode
};

const ConnectionsGraph: React.FC = () => {
  const { orgId } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);

  const loadGraph = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    try {
      const [
        projects, 
        clients, 
        docs, 
        operatives,
        connections
      ] = await Promise.all([
        firestoreService.getCollection('projects', orgId),
        firestoreService.getCollection('clients', orgId),
        firestoreService.getCollection('documents', orgId),
        firestoreService.getCollection('profiles', orgId),
        firestoreService.getCollection('connections', orgId)
      ]);

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      clients?.forEach((c: any, i: number) => {
        newNodes.push({
          id: c.id,
          type: 'uny',
          data: { label: `CLIENT: ${c.name}`, type: 'client' },
          position: { x: 800, y: 300 + (i * 100) },
        });
      });

      projects?.forEach((p: any, i: number) => {
        newNodes.push({
          id: p.id,
          type: 'uny',
          data: { label: `PROJECT: ${p.name}`, type: 'project' },
          position: { x: 400, y: 300 + (i * 100) },
        });
      });

      operatives?.forEach((op: any, i: number) => {
        const nodeType = op.metadata?.node_type || 'operative';
        newNodes.push({
          id: op.id,
          type: 'uny',
          data: { label: `${nodeType.toUpperCase()}: ${op.full_name}`, type: nodeType },
          position: { x: 0, y: 300 + (i * 100) },
        });
      });

      docs?.forEach((d: any, i: number) => {
        newNodes.push({
          id: d.id,
          type: 'uny',
          data: { label: `DOC: ${d.file_name.slice(0, 15)}`, type: 'document' },
          position: { x: 400, y: 0 - (i * 80) },
        });
      });

      connections?.forEach((c: any) => {
        newEdges.push({
          id: c.id,
          source: c.source_id,
          target: c.target_id,
          animated: c.ai_confidence > 0.8,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
          style: { stroke: '#3b82f6', strokeWidth: 2 }
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      console.error('Graph calibration failure:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, setNodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  return (
    <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl h-[calc(100vh-320px)] relative overflow-hidden flex flex-col group">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-black text-white rounded-2xl shadow-xl">
              <Network size={20} />
           </div>
           <div>
              <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-900">Neural Knowledge Matrix</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Database size={10} className="text-blue-500" /> Operational Moat Index: {edges.length} Synapses
              </p>
           </div>
        </div>
        <button 
          onClick={loadGraph}
          className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-slate-400 hover:text-blue-600"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 relative bg-slate-50/50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls />
        </ReactFlow>

        {loading && (
           <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Reconstructing Synapses...</p>
           </div>
        )}
      </div>

      <div className="absolute bottom-8 left-8 p-5 bg-[#1a1615] rounded-[32px] text-white space-y-3 border border-white/10 z-10 shadow-2xl">
         <div className="flex items-center gap-3">
            <UserCheck size={16} className="text-purple-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-purple-400">Industry-Aware Node Tracking Active</span>
         </div>
      </div>
    </div>
  );
};

export default ConnectionsGraph;
