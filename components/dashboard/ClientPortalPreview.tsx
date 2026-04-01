
import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, ExternalLink, MousePointer2, Clock, 
  FileCheck, Share2, Globe, ArrowUpRight 
} from 'lucide-react';
import { NetworkStrength } from '../../types';

interface ClientPortalPreviewProps {
  strength: NetworkStrength;
}

const ClientPortalPreview: React.FC<ClientPortalPreviewProps> = ({ strength }) => {
  return (
    <div className="bg-[#1a1615] rounded-[56px] p-10 text-white relative overflow-hidden group shadow-2xl border border-white/5">
      {/* Dynamic Network Glow */}
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-0 right-0 w-96 h-96 bg-blue-500 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" 
      />

      <div className="relative z-10 space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xl">
              <Globe size={24} className="text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400 block mb-1">Network Expansion</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Client Interaction Layer</span>
            </div>
          </div>
          <button className="p-2 text-slate-500 hover:text-white transition-colors">
            <ExternalLink size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            Client <span className="text-blue-500">Portals</span>
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-sm">
            Your clients are now nodes within your ecosystem. Collaboration is synchronous and automated.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 group/node hover:bg-white/10 transition-all cursor-pointer">
             <div className="flex justify-between items-start mb-4">
                <Users size={20} className="text-blue-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Active Nodes</span>
             </div>
             <p className="text-3xl font-black italic tracking-tighter leading-none">{strength.connectedNodes}</p>
             <div className="flex items-center gap-1.5 mt-4">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Client Sync Live</span>
             </div>
          </div>
          
          <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 group/node hover:bg-white/10 transition-all cursor-pointer">
             <div className="flex justify-between items-start mb-4">
                <FileCheck size={20} className="text-blue-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Approval Vel.</span>
             </div>
             <p className="text-3xl font-black italic tracking-tighter leading-none">{strength.approvalVelocity}h</p>
             <div className="flex items-center gap-1.5 mt-4">
                <ArrowUpRight size={10} className="text-green-400" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">+12% faster</span>
             </div>
          </div>
        </div>

        <div className="bg-blue-600 rounded-[32px] p-6 relative overflow-hidden shadow-2xl group/cta cursor-pointer hover:bg-blue-500 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/cta:opacity-20 transition-opacity">
            <Share2 size={64} />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1">Network Value Locked</p>
              <p className="text-2xl font-black italic tracking-tighter">${strength.networkValueLocked.toLocaleString()}</p>
            </div>
            <div className="bg-white text-[#1a1615] p-3 rounded-2xl shadow-xl group-hover/cta:scale-110 transition-transform">
              <MousePointer2 size={18} fill="currentColor" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
           <Clock size={12} />
           <span>Last Node Activity: 4m ago by Client_09</span>
        </div>
      </div>
    </div>
  );
};

export default ClientPortalPreview;
