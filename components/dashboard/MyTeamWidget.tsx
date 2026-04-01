
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const MyTeamWidget: React.FC = () => {
  const { orgId, profile } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!orgId) return;
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('org_id', orgId);

        if (error) throw error;
        setMembers((data as any[]) || []);
      } catch (err: unknown) {
        // Error handled silently or by UI
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [orgId]);

  const isSolo = members.length <= 1;

  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-50 shadow-sm h-full flex flex-col group overflow-hidden relative">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-lg font-bold">Operatives</h3>
        {!isSolo && <button className="text-sm font-bold text-slate-400 hover:text-black transition-colors italic uppercase tracking-widest">Neural View</button>}
      </div>
      
      <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar relative z-10">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-slate-200" size={32} />
          </div>
        ) : isSolo ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-4">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 transition-transform">
                 <ShieldAlert size={28} />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full blur-md"
              />
            </div>
            <div className="space-y-2">
              <p className="font-bold text-slate-800 italic uppercase tracking-tight">Solo Pilot Mode</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed px-4">
                You are the sole commander of this mission cluster. Invite operatives to scale.
              </p>
            </div>
            <button className="flex items-center gap-3 px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all">
              <UserPlus size={14} /> Invite Operative
            </button>
          </div>
        ) : (
          members.map((member) => {
            const initials = member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
            return (
              <div key={member.id} className="flex items-center gap-4 group/item">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-400 font-bold text-xs shadow-sm transition-transform group-hover/item:scale-105 group-hover/item:text-white group-hover/item:border-cyan-500/30">
                    {initials}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-800 truncate italic uppercase">{member.full_name || 'Anonymous'}</p>
                    {member.id === profile?.id && <Sparkles size={10} className="text-blue-400" />}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest italic">{member.role || 'Member'}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-50">
         <div className="flex items-center gap-3 text-blue-500/40">
            <Sparkles size={14} />
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Neural Collaborative Tier: Alpha</span>
         </div>
      </div>
    </div>
  );
};

export default MyTeamWidget;
