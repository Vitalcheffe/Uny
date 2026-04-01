
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Shield, Terminal, Zap, Brain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const InviteOperative: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const { orgId } = useAuth();
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/#/register?org=${orgId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1a1615]/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-[64px] p-16 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Brain size={200} />
            </div>

            <div className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-4 text-blue-600">
                  <Shield size={24} />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Command Protocol: Expansion</span>
               </div>
               <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                 <X size={24} />
               </button>
            </div>

            <div className="space-y-8 mb-12">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
                Provision <br /> <span className="text-blue-600">Neural Operative</span>
              </h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed max-w-md">
                Authorize a new data-point to access the Strategic Command Node. 
                Every operative added increases the platform's predictive density.
              </p>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Secure Provisioning Link</label>
               <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-2 rounded-[32px]">
                  <input 
                    readOnly 
                    value={inviteLink}
                    className="flex-1 bg-transparent px-6 py-4 text-xs font-mono font-bold text-slate-500 outline-none"
                  />
                  <button 
                    onClick={handleCopy}
                    className={`px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${
                      copied ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-blue-600'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Zap size={14} />}
                    <span>{copied ? 'Linked' : 'Authorize'}</span>
                  </button>
               </div>
            </div>

            <div className="mt-16 pt-8 border-t border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Terminal size={14} className="text-slate-300" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 italic">Honey Pot Protocol Tier 2 Enabled</span>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InviteOperative;
