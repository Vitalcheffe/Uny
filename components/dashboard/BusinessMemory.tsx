
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronRight, Activity, X, Share2, Target, Link as LinkIcon, Plus, MousePointer2 } from 'lucide-react';
import { BusinessIntelligence, Project, Client } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  label: string;
  type: 'CLIENT' | 'PROJECT' | 'REVENUE' | 'TEAM';
  connections: string[];
  insight: string;
  riskFactor: number;
  interceptionImpact: string;
  realEntityId?: string;
  isDragging?: boolean;
}

interface BusinessMemoryProps {
  intel: BusinessIntelligence;
  realProjects?: Project[];
  realClients?: Client[];
  onNodeClick?: (nodeId: string, nodeType: string) => void;
}

const BusinessMemory: React.FC<BusinessMemoryProps> = ({ intel, realProjects = [], realClients = [], onNodeClick }) => {
  const { orgId } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<Node | null>(null);
  
  const requestRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const nodesRef = useRef<Node[]>([]);

  // Initialize nodes
  useEffect(() => {
    const newNodes: Node[] = [];
    
    // Add Client Nodes
    realClients.forEach((client) => {
      newNodes.push({
        id: `client_${client.id}`,
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 600,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: 10,
        label: client.name,
        type: 'CLIENT',
        connections: [],
        insight: `Primary connection for ${client.name}. Sentiment: ${client.sentiment_score || 82}%`,
        riskFactor: 100 - (client.sentiment_score || 82),
        interceptionImpact: 'Stable',
        realEntityId: client.id
      });
    });

    // Add Project Nodes & Connect them to Clients
    realProjects.forEach((project) => {
      const nodeId = `project_${project.id}`;
      const connections: string[] = [];
      
      if (project.client_id) {
        connections.push(`client_${project.client_id}`);
      }

      newNodes.push({
        id: nodeId,
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 600,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: 7,
        label: project.name,
        type: 'PROJECT',
        connections: connections,
        insight: `Ongoing project mission. Revenue Locked: $${(project.revenue || 0).toLocaleString()}`,
        riskFactor: project.priority === 'High' ? 15 : 5,
        interceptionImpact: project.deadline || 'TBD',
        realEntityId: project.id
      });
    });

    // Background noise
    if (newNodes.length < 15) {
      for (let i = 0; i < (15 - newNodes.length); i++) {
        newNodes.push({
          id: `noise_${i}`,
          x: Math.random() * 800,
          y: Math.random() * 800,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          size: 3,
          label: `UNY_NODE_${i}`,
          type: 'REVENUE',
          connections: [],
          insight: 'Tactical background signal.',
          riskFactor: 0,
          interceptionImpact: 'Nameinal'
        });
      }
    }

    nodesRef.current = newNodes;
  }, [realProjects, realClients]);

  const getCanvasCoordinates = (e: React.MouseEvent | MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e);
    mouseRef.current = coords;

    if (draggedNodeId) {
      const node = nodesRef.current.find(n => n.id === draggedNodeId);
      if (node) {
        node.x = coords.x;
        node.y = coords.y;
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e);
    const node = nodesRef.current.find(n => {
      const dx = n.x - coords.x;
      const dy = n.y - coords.y;
      return Math.sqrt(dx * dx + dy * dy) < (n.size + 15);
    });

    if (node) {
      if (isConnectMode) {
        setConnectingFrom(node);
      } else {
        setDraggedNodeId(node.id);
        node.isDragging = true;
      }
    }
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e);

    if (isConnectMode && connectingFrom) {
      const targetNode = nodesRef.current.find(n => {
        const dx = n.x - coords.x;
        const dy = n.y - coords.y;
        return n.id !== connectingFrom.id && Math.sqrt(dx * dx + dy * dy) < (n.size + 15);
      });

      if (targetNode && orgId) {
        // Create actual connection in DB
        const { error } = await supabase.from('connections').insert({
          org_id: orgId,
          source_type: connectingFrom.type.toLowerCase(),
          source_id: connectingFrom.realEntityId || connectingFrom.id,
          target_type: targetNode.type.toLowerCase(),
          target_id: targetNode.realEntityId || targetNode.id,
          connection_type: 'related_to',
          ai_confidence: 1.0,
          ai_reasoning: 'User-defined neural link'
        });

        if (!error) {
          connectingFrom.connections.push(targetNode.id);
        }
      }
    }

    if (draggedNodeId) {
      const node = nodesRef.current.find(n => n.id === draggedNodeId);
      if (node) node.isDragging = false;
    }

    setDraggedNodeId(null);
    setConnectingFrom(null);

    // Simple click logic for selection
    const clickedNode = nodesRef.current.find(n => {
      const dx = n.x - coords.x;
      const dy = n.y - coords.y;
      return Math.sqrt(dx * dx + dy * dy) < (n.size + 15);
    });
    if (clickedNode && !isConnectMode) {
      setSelectedNode(clickedNode);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let closestNode: Node | null = null;
    let minDistance = 35;

    nodesRef.current.forEach(node => {
      // Movement
      if (!node.isDragging) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 30 || node.x > canvas.width - 30) node.vx *= -1;
        if (node.y < 30 || node.y > canvas.height - 30) node.vy *= -1;
      }

      const dx = node.x - mouseRef.current.x;
      const dy = node.y - mouseRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }

      // Draw Connections
      node.connections.forEach(targetId => {
        const target = nodesRef.current.find(n => n.id === targetId);
        if (target) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    });

    // Draw connection line in progress
    if (connectingFrom) {
      ctx.beginPath();
      ctx.moveTo(connectingFrom.x, connectingFrom.y);
      ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
      ctx.strokeStyle = '#3b82f6';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    nodesRef.current.forEach(node => {
      const isHovered = closestNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const isTarget = connectingFrom && isHovered && node.id !== connectingFrom.id;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size + (isHovered ? 6 : 0), 0, Math.PI * 2);
      
      if (isTarget) {
        ctx.fillStyle = '#10b981';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#10b981';
      } else if (isSelected) {
        ctx.fillStyle = '#1e40af';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#3b82f6';
      } else if (isHovered) {
        ctx.fillStyle = '#3b82f6';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#3b82f6';
      } else {
        ctx.shadowBlur = 0;
        if (node.type === 'CLIENT') ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
        else if (node.type === 'PROJECT') ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        else ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
      }
      ctx.fill();

      if (isHovered || isSelected || node.type === 'CLIENT') {
        ctx.font = 'bold 10px Inter';
        ctx.fillStyle = isHovered || isSelected ? '#1a1615' : 'rgba(26, 22, 21, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - node.size - 12);
      }
    });

    setHoveredNode(closestNode);
    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(requestRef.current);
  }, [selectedNode, realProjects, realClients, isConnectMode, connectingFrom]);

  return (
    <div className="bg-white rounded-[56px] p-10 border border-slate-100 shadow-2xl h-full flex flex-col relative overflow-hidden group">
      <canvas 
        ref={canvasRef}
        width={800}
        height={800}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { mouseRef.current = { x: -1000, y: -1000 }; setDraggedNodeId(null); setConnectingFrom(null); }}
        className="absolute inset-0 w-full h-full cursor-crosshair z-0"
      />

      <div className="relative z-10 pointer-events-none flex-1 flex flex-col space-y-8">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="p-3 bg-blue-50 rounded-2xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
              <Brain size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] block">Neural Matrix</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Interactive Command Core</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsConnectMode(!isConnectMode)}
              className={`p-3 rounded-2xl transition-all shadow-lg flex items-center gap-3 ${
                isConnectMode ? 'bg-blue-600 text-white shadow-blue-500/40 scale-105' : 'bg-white text-slate-400 border border-slate-100'
              }`}
            >
              {isConnectMode ? <LinkIcon size={18} strokeWidth={3} /> : <Plus size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{isConnectMode ? 'Connect Active' : 'Manual Link'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Operational <span className="text-blue-600">Memory</span></h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] italic">
            {isConnectMode ? 'Drag from node to node to create a synapse.' : 'Drag nodes to reposition. Click to intercept intelligence.'}
          </p>
        </div>

        <div className="mt-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 p-6 rounded-[32px] border border-slate-100 backdrop-blur-md shadow-sm">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Entities</p>
              <p className="text-2xl font-black italic tracking-tighter leading-none text-slate-800">{nodesRef.current.length}</p>
            </div>
            <div className="bg-white/60 p-6 rounded-[32px] border border-slate-100 backdrop-blur-md shadow-sm">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Synapse Growth</p>
              <p className="text-2xl font-black italic tracking-tighter leading-none text-slate-800">+{intel.activeNeuralConnections}</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-10 right-10 bottom-10 w-80 bg-[#1a1615] rounded-[48px] p-8 text-white z-50 border border-white/10 shadow-2xl flex flex-col pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3 text-blue-500">
                  <Target size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Target Locked</span>
               </div>
               <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white transition-colors p-2 bg-white/5 rounded-xl">
                 <X size={18} />
               </button>
            </div>

            <div className="flex-1 space-y-10 overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <h4 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                  {selectedNode.type} <br /> <span className="text-blue-500 truncate block">{selectedNode.label}</span>
                </h4>
              </div>

              <div className="space-y-6">
                 <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Node Insight</p>
                   <p className="text-xs font-bold leading-relaxed text-slate-300 italic">
                     {selectedNode.insight}
                   </p>
                 </div>

                 <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">Interception Vector</p>
                    <p className="text-lg font-black text-white italic">{selectedNode.interceptionImpact}</p>
                 </div>

                 <div className="flex items-center gap-4 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                    <Activity size={14} />
                    <span>Risk Factor: {selectedNode.riskFactor}%</span>
                 </div>
              </div>
            </div>
            
            <button className="w-full py-6 bg-blue-600 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 mt-8 hover:bg-blue-500 transition-all shadow-xl">
              <Share2 size={16} /> Broadcast Intel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-30">
         <MousePointer2 size={12} className="text-slate-400" />
         <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">Tactical Drag-Layer Active</span>
      </div>
    </div>
  );
};

export default BusinessMemory;
