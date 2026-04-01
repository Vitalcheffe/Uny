
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Zap, ShieldCheck, MessageSquare, TrendingUp, RefreshCcw, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { AutopilotAction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { logTelemetry } from '../../lib/telemetry';

interface AutopilotWidgetProps {
  actions: AutopilotAction[];
  onExecute: (id: string) => void;
}

const AutopilotWidget: React.FC<AutopilotWidgetProps> = ({ actions: providedActions, onExecute }) => {
  const { orgId } = useAuth();
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [internalActions, setInternalActions] = useState<AutopilotAction[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    const detectActions = async () => {
      if (!orgId) return;
      const { data: clients } = await (supabase as any).from('clients').select('*').eq('org_id', orgId);
      const { data: projects } = await (supabase as any).from('projects').select('*').eq('org_id', orgId).eq('status', 'Ongoing');
      
      const newActions: AutopilotAction[] = [];

      const lowSentimentClient = clients?.find(c => (c.sentiment_score || 0) < 80);
      if (lowSentimentClient) {
        newActions.push({
          id: 'auto_sent_01',
          type: 'COMMUNICATION',
          title: 'Sentiment Restoration',
          description: `Client ${lowSentimentClient.name} is showing 82% sentiment node drift. Suggesting automated check-in protocol.`,
          confidence: 94
        });
      }

      if ((projects?.length || 0) > 5) {
        newActions.push({
          id: 'auto_opt_01',
          type: 'OPTIMIZATION',
          title: 'Unit Scaling Strategy',
          description: `High mission density detected (${projects?.length} nodes). Suggesting transition to Milestone billing for cashflow velocity.`,
          confidence: 88
        });
      }

      setInternalActions(newActions);
    };

    detectActions();
  }, [orgId]);

  const allActions = [...providedActions, ...internalActions];

  const handleExecute = (id: string) => {
    setExecutingId(id);
    setTimeout(() => {
      onExecute(id);
      setInternalActions(prev => prev.filter(a => a.id !== id));
      setExecutingId(null);
      logTelemetry('AUTOPILOT_APPROVAL', `Action ${id} authorized`, {}, { action_id: id }, orgId!);
    }, 1500);
  };

  const handleFlagFeedback = async () => {
    if (!flaggingId || !orgId) return;
    
    await logTelemetry(
      'AI_ALERT', 
      `AI Logic Flagged: ${flaggingId}`, 
      {}, 
      { action_id: flaggingId, user_comment: feedbackMsg }, 
      orgId
    );
    
    setInternalActions(prev => prev.filter(a => a.id !== flaggingId));
    setFlaggingId(null);
    setFeedbackMsg('');
  };

  return (
    <div className="bg-white rounded-[56px] p-10 border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.02)] h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-1000" />
      
      <div className="relative z-10 flex flex-col h-full space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="p-3 bg-blue-50 rounded-2xl shadow-inner relative overflow-hidden">
               <Bot size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] block">Autopilot Layer</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Predictive Logic Gates Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
             Strategic Analysis
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Decision <span className="text-blue-600">Queue</span></h3>
        </div>

        <div className="flex-1 space-y-4">
          <AnimatePresence mode="popLayout">
            {allActions.map((action, i) => (
              <motion.div 
                key={action.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-50 border border-slate-100 p-6 rounded-[32px] hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all cursor-default relative group/card"
              >
                {flaggingId === action.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase text-rose-500">Flag Inaccuracy</p>
                      <button onClick={() => setFlaggingId(null)}><X size={14} className="text-slate-400" /></button>
                    </div>
                    <textarea 
                      autoFocus
                      placeholder="What was wrong with this logic?"
                      className="w-full bg-slate-100 border-none rounded-2xl p-4 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20"
                      value={feedbackMsg}
                      onChange={(e) => setFeedbackMsg(e.target.value)}
                    />
                    <button 
                      onClick={handleFlagFeedback}
                      className="w-full py-3 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all"
                    >
                      Commit Retraining Data
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm">
                          {action.type === 'COMMUNICATION' && <MessageSquare size={16} />}
                          {action.type === 'OPTIMIZATION' && <TrendingUp size={16} />}
                          {action.type === 'RECOVERY' && <RefreshCcw size={16} />}
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-widest text-slate-800">{action.title}</p>
                          <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Confidence: {action.confidence}%</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setFlaggingId(action.id)}
                        className="opacity-0 group-hover/card:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                        title="Flag as Incorrect"
                      >
                        <AlertTriangle size={16} />
                      </button>
                    </div>
                    
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-6 leading-relaxed italic">
                      {action.description}
                    </p>

                    <button 
                      onClick={() => handleExecute(action.id)}
                      disabled={executingId !== null}
                      className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${
                        executingId === action.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-[#1a1615] text-white hover:bg-blue-600'
                      }`}
                    >
                      {executingId === action.id ? (
                        <RefreshCcw className="animate-spin" size={14} />
                      ) : (
                        <>
                          <Zap size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Authorize Adjustment</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {allActions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 opacity-50 italic">
               <CheckCircle2 size={32} className="text-blue-500" />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Balance Maintained.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutopilotWidget;
