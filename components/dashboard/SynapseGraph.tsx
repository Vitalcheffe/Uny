import React, { useMemo, useEffect, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  Node,
  Edge,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { firestoreService } from '../../lib/supabase-data-layer';
import { THEME } from '../../constants/theme';

interface SynapseGraphProps {
  orgId: string;
}

const SynapseGraph: React.FC<SynapseGraphProps> = ({ orgId }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!orgId) return;

      try {
        const [connections, projects, clients, docs] = await Promise.all([
          firestoreService.getCollection('connections', orgId),
          firestoreService.getCollection('projects', orgId),
          firestoreService.getCollection('clients', orgId),
          firestoreService.getCollection('documents', orgId)
        ]);

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        // Add Organization Node (Center)
        newNodes.push({
          id: orgId,
          data: { label: 'UNY HUB' },
          position: { x: 0, y: 0 },
          style: { 
            background: THEME.colors.primary, 
            color: THEME.colors.text.primary, 
            borderRadius: THEME.borderRadius.lg, 
            fontWeight: 'bold',
            border: 'none',
            padding: THEME.spacing.sm,
            fontSize: THEME.typography.fontSize.xs
          }
        });

        // Add Projects
        projects?.forEach((p: any, i: number) => {
          const angle = (i / (projects.length || 1)) * 2 * Math.PI;
          newNodes.push({
            id: p.id,
            data: { label: p.name },
            position: { x: 250 * Math.cos(angle), y: 250 * Math.sin(angle) },
            style: { 
              background: THEME.colors.secondary, 
              color: THEME.colors.text.primary, 
              borderRadius: THEME.borderRadius.md, 
              fontSize: THEME.typography.fontSize['2xs'],
              border: 'none',
              padding: THEME.spacing.sm
            }
          });
          newEdges.push({
            id: `e-${orgId}-${p.id}`,
            source: orgId,
            target: p.id,
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 2 }
          });
        });

        // Add Clients
        clients?.forEach((c: any, i: number) => {
          const angle = (i / (clients.length || 1)) * 2 * Math.PI + 0.5;
          newNodes.push({
            id: c.id,
            data: { label: c.name },
            position: { x: 450 * Math.cos(angle), y: 450 * Math.sin(angle) },
            style: { 
              background: THEME.colors.success, 
              color: THEME.colors.text.primary, 
              borderRadius: THEME.borderRadius.md, 
              fontSize: THEME.typography.fontSize['2xs'],
              border: 'none',
              padding: THEME.spacing.sm
            }
          });
          // Connect clients to org if no other connection exists
          newEdges.push({
            id: `e-${orgId}-${c.id}`,
            source: orgId,
            target: c.id,
            style: { stroke: '#10b981', strokeWidth: 1, opacity: 0.5 }
          });
        });

        // Add Connections (Edges) from the database
        connections?.forEach((conn: any) => {
          newEdges.push({
            id: conn.id,
            source: conn.source_id,
            target: conn.target_id,
            label: conn.type,
            markerEnd: { type: MarkerType.ArrowClosed, color: THEME.colors.text.muted },
            style: { stroke: THEME.colors.text.muted, strokeWidth: 1.5 },
            labelStyle: { fill: THEME.colors.text.secondary, fontSize: 8, fontWeight: 700 }
          });
        });

        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        console.error("Synapse Graph Error:", error);
      }
    };

    fetchData();
  }, [orgId]);

  return (
    <div 
      className="w-full glass-card overflow-hidden border border-white/5 relative group"
      style={{
        height: '600px',
        borderRadius: THEME.borderRadius['6xl'],
      }}
    >
      <div 
        className="absolute z-10 space-y-2"
        style={{
          top: THEME.spacing.xl,
          left: THEME.spacing.xl,
        }}
      >
        <h3 
          className="font-black uppercase italic text-blue-500"
          style={{
            fontSize: THEME.typography.fontSize['2xs'],
            letterSpacing: THEME.typography.letterSpacing.wider,
          }}
        >
          Neural Network
        </h3>
        <h3 
          className="font-[950] italic uppercase tracking-tighter text-white"
          style={{
            fontSize: THEME.typography.fontSize['2xl'],
          }}
        >
          Cartographie <span style={{ color: THEME.colors.primaryDark }}>des Synapses</span>
        </h3>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        style={{ background: 'transparent' }}
      >
        <Background color="rgba(59, 130, 246, 0.05)" gap={24} size={1} />
        <Controls className="bg-white/5 border-white/10 text-white fill-white" />
        <MiniMap 
          nodeColor={(n) => (n.style?.background as string) || '#333'} 
          maskColor="rgba(0,0,0,0.7)"
          className="bg-[#050505] border border-white/10 rounded-2xl"
        />
      </ReactFlow>

      <div 
        className="absolute z-10 flex gap-4"
        style={{
          bottom: THEME.spacing.xl,
          right: THEME.spacing.xl,
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="rounded-full bg-blue-500" 
            style={{
              width: THEME.spacing.sm,
              height: THEME.spacing.sm,
            }}
          />
          <span 
            className="font-bold text-zinc-500 uppercase tracking-widest"
            style={{ fontSize: THEME.typography.fontSize['3xs'] }}
          >
            Hub
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="rounded-full bg-purple-500" 
            style={{
              width: THEME.spacing.sm,
              height: THEME.spacing.sm,
            }}
          />
          <span 
            className="font-bold text-zinc-500 uppercase tracking-widest"
            style={{ fontSize: THEME.typography.fontSize['3xs'] }}
          >
            Missions
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="rounded-full bg-emerald-500" 
            style={{
              width: THEME.spacing.sm,
              height: THEME.spacing.sm,
            }}
          />
          <span 
            className="font-bold text-zinc-500 uppercase tracking-widest"
            style={{ fontSize: THEME.typography.fontSize['3xs'] }}
          >
            Entités
          </span>
        </div>
      </div>
    </div>
  );
};

export default SynapseGraph;
