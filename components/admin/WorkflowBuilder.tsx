
import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  MarkerType,
  Position,
  Handle
} from 'reactflow';
import { Zap, Activity, ShieldCheck, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// --- Custom Components for Flow Nodes ---

const TriggerNode = ({ data }: { data: { label: string } }) => (
  <div className="px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 min-w-[180px]">
    <div className="flex items-center gap-3 mb-2">
      <Zap size={14} className="text-blue-400" />
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">Trigger</span>
    </div>
    <div className="text-sm font-black italic uppercase tracking-tighter truncate">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-blue-500 border-white border-2" />
  </div>
);

const ActionNode = ({ data }: { data: { label: string } }) => (
  <div className="px-6 py-4 bg-blue-600 text-white rounded-2xl shadow-xl border border-blue-500 min-w-[180px]">
    <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-blue-400 border-white border-2" />
    <div className="flex items-center gap-3 mb-2">
      <Play size={14} className="text-white" />
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">Action</span>
    </div>
    <div className="text-sm font-black italic uppercase tracking-tighter truncate">{data.label}</div>
  </div>
);

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
};

const WorkflowBuilder: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    setNodes([
      {
        id: '1',
        type: 'trigger',
        data: { label: 'NEW_PAYMENT_NODE' },
        position: { x: 250, y: 50 },
      },
      {
        id: '2',
        type: 'action',
        data: { label: 'ALERT_FINANCE_UNIT' },
        position: { x: 250, y: 200 },
      },
    ]);
    setEdges([
      { 
        id: 'e1-2', 
        source: '1', 
        target: '2', 
        animated: true, 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      }
    ]);
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
    }, eds)),
    [setEdges]
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex-1 bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#f1f5f9" gap={20} size={1} />
          <Controls />
        </ReactFlow>

        <div className="absolute bottom-8 left-8 flex items-center gap-4">
          <div className="px-6 py-3 bg-[#1a1615] text-white rounded-full text-[9px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center gap-3 border border-white/10">
            <ShieldCheck size={14} className="text-blue-500" />
            Logic Integrity Verified
          </div>
          <div className="px-6 py-3 bg-white border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-[0.4em] shadow-xl flex items-center gap-3">
            <Activity size={14} className="text-emerald-500 animate-pulse" />
            Real-time Monitoring Active
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
