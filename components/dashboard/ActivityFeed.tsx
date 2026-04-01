
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Zap, Target, BrainCircuit, MessageSquare, 
  TrendingUp, ShieldCheck, Clock, Radio, ChevronRight,
  Database, Sparkles, FileText, Landmark, AlertCircle,
  Wifi, WifiOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { TelemetryEntry } from '../../types';

const EventIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'AUTOPILOT_APPROVAL': return <Sparkles size={14} className="text-amber-400" />;
    case 'AUTOPILOT_REJECTION': return <ShieldCheck size={14} className="text-rose-400" />;
    case 'FEEDBACK_SUBMISSION': return <MessageSquare size={14} className="text-blue-400" />;
    case 'VELOCITY_DRIFT': return <TrendingUp size={14} className="text-emerald-400" />;
    case 'NEURAL_INTERACTION': return <BrainCircuit size={14} className="text-purple-400" />;
    case 'AI_ALERT': return <AlertCircle size={14} className="text-rose-500" />;
    default: return <Target size={14} className="text-slate-400" />;
  }
};

const ActivityFeed: React.FC = () => {
  const { orgId } = useAuth();
  const [logs, setLogs] = useState<TelemetryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'active' | 'error'>('connecting');

  useEffect(() => {
    if (!orgId) return;

    setLoading(true);
    setConnectionStatus('connecting');

    const fetchInitialLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('telemetry_logs')
          .select('*')
          .eq('org_id', orgId)
          .order('timestamp', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setLogs(data as unknown as TelemetryEntry[]);
        setConnectionStatus('active');
      } catch (err: unknown) {
        setConnectionStatus('error');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialLogs();

    const channel = supabase
      .channel(`activity_feed_${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_logs',
          filter: `org_id=eq.${orgId}`
        },
        (payload) => {
          setLogs(prev => [payload.new as TelemetryEntry, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  const formatTime = (timestamp: string | number | Date) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] flex flex-col h-[650px] relative overflow-hidden group">
      {/* Background Decor - Visual Noise */}
      <div className="absolute -top-20 -right-20 opacity-[0.03] pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-[3000ms]">
         <Activity size={400} />
      </div>

      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-[#1A1615] text-white rounded-[20px] shadow-2xl group-hover:rotate-6 transition-transform">
            <Radio size={24} className={connectionStatus === 'active' ? 'animate-pulse text-blue-400' : ''} />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Neural Stream</h3>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-1.5 h-1.5 rounded-full ${
                 connectionStatus === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 
                 connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
               }`} />
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
                 {connectionStatus === 'active' ? 'Live Link established' : 'Synchronizing matrix...'}
               </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
           {connectionStatus === 'active' ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-slate-300" />}
           <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Realtime</span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar relative z-10 pr-2">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-6 opacity-40">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin" />
             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Intercepting packets...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 px-6">
            <Database size={48} className="text-slate-200" />
            <div className="space-y-2">
               <p className="text-xs font-black uppercase tracking-widest text-slate-400 leading-relaxed">
                 Quiet Sector Detected
               </p>
               <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 italic">
                 The neural grid is awaiting your first operational signal.
               </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="p-5 bg-white border border-slate-50 rounded-[32px] flex items-start gap-5 hover:border-blue-100 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.1)] transition-all group/item cursor-default"
                >
                  <div className="p-3 bg-slate-50 rounded-xl shadow-inner border border-white group-hover/item:scale-110 group-hover/item:bg-white transition-all shrink-0">
                    <EventIcon type={log.event_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${
                        log.event_type === 'AUTOPILOT_APPROVAL' ? 'text-amber-600 bg-amber-50 border border-amber-100' : 
                        log.event_type === 'VELOCITY_DRIFT' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 
                        log.event_type === 'AI_ALERT' ? 'text-rose-600 bg-rose-50 border border-rose-100' :
                        'text-blue-600 bg-blue-50 border border-blue-100'
                      }`}>
                        {log.event_type.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                         <Clock size={10} />
                         {formatTime(log.timestamp)}
                      </div>
                    </div>
                    <p className="text-[12px] font-[900] text-slate-900 italic leading-tight uppercase tracking-tighter group-hover/item:text-blue-600 transition-colors">
                      {log.metric_label}
                    </p>
                    {log.payload?.project_id && (
                      <div className="mt-2 flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-blue-500" />
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Signal Linked to Mission</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between opacity-50 relative z-10">
         <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Command Stream v7.0</span>
         </div>
         <button className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-black transition-colors uppercase tracking-widest group/more">
            Archive Explorer <ChevronRight size={14} className="group-hover/more:translate-x-1 transition-transform" />
         </button>
      </div>
    </div>
  );
};

export default ActivityFeed;
