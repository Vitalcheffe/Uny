
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const TrialLockOverlay: React.FC = () => {
  const { orgId } = useAuth();
  const [showLock, setShowLock] = useState(false);
  const [stats, setStats] = useState({ docs: 0, clients: 0, projects: 0 });

  useEffect(() => {
    if (!orgId) return;

    const checkTrialStatus = async () => {
      const { data: org } = await (supabase as any)
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (org && org.subscription_status === 'trialing') {
        const trialEnd = new Date(org.trial_ends_at);
        const now = new Date();
        if (now > trialEnd) {
          // Fetch counts to show the user what they are losing
          const [docsRes, clientsRes, projectsRes] = await Promise.all([
            supabase.from('documents').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
            supabase.from('clients').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('org_id', orgId)
          ]);

          setStats({
            docs: docsRes.count || 0,
            clients: clientsRes.count || 0,
            projects: projectsRes.count || 0
          });
          setShowLock(true);
        }
      }
    };

    checkTrialStatus();
  }, [orgId]);

  if (!showLock) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Blurred background - blocked interaction */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 backdrop-blur-2xl bg-slate-900/60"
        style={{ pointerEvents: 'all' }}
      />
      
      {/* Lock Modal */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 max-w-2xl w-full mx-8 bg-white rounded-[64px] p-16 shadow-2xl border-4 border-rose-500 overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <ShieldAlert size={300} />
        </div>

        {/* Red Lock Icon */}
        <div className="flex justify-center mb-12">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-32 h-32 bg-rose-50 rounded-full flex items-center justify-center border-2 border-rose-100"
          >
            <Lock size={64} className="text-rose-600" />
          </motion.div>
        </div>
        
        {/* Message */}
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
            Security Protocol
            <br />
            <span className="text-rose-600 italic">Activated</span>
          </h1>
          
          <div className="space-y-4">
            <p className="text-xl text-slate-600 font-bold leading-relaxed">
              Your enterprise vault has been secured. Your institutional capital is protected.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-2xl font-black text-slate-900">{stats.docs}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vault Nodes</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-2xl font-black text-slate-900">{stats.clients}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Client Entities</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-2xl font-black text-slate-900">{stats.projects}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Missions</p>
              </div>
            </div>
          </div>
          
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Activate your commercial license to resume autonomous operations and regain access to the Knowledge Matrix.
          </p>
        </div>
        
        {/* Activate Button */}
        <button
          onClick={() => window.location.href = '/dashboard/admin/billing'}
          className="w-full mt-12 py-8 bg-[#1A1615] hover:bg-rose-600 text-white rounded-[32px] font-black text-lg uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-4 group italic"
        >
          <Zap size={24} fill="white" />
          Initialize Commercial License
          <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
        </button>
        
        <p className="text-center mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Instant activation • All data linkages preserved • Priority Kernel access
        </p>
      </motion.div>
    </div>
  );
};

export default TrialLockOverlay;
