
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquareCode, Send, X, Terminal, Radio, ShieldAlert, RefreshCcw } from 'lucide-react';
import { TelemetryContext } from '../../types';

interface FeedbackModuleProps {
  telemetry: TelemetryContext;
  onSubmit: (msg: string, type: string) => void;
}

const FeedbackModule: React.FC<FeedbackModuleProps> = ({ telemetry, onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'BUG' | 'INSIGHT' | 'REQUEST'>('INSIGHT');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    await new Promise(r => setTimeout(r, 1200));
    onSubmit(message, type);
    setMessage('');
    setIsSending(false);
    setIsOpen(false);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-10 right-10 z-[100] bg-blue-600 text-white p-6 rounded-full shadow-[0_20px_40px_rgba(37,99,235,0.4)] flex items-center gap-4 group"
      >
        <MessageSquareCode size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] pr-2">Alpha Feedback</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 right-10 z-[100] w-[450px] bg-[#1a1615] rounded-[48px] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          >
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-blue-500">
                  <Terminal size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Neural Feedback Channel</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">Transmission</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Every message captures your current Operational Context for precise calibration.
                </p>
              </div>

              <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                <div className="flex items-center gap-3 text-blue-400 mb-2">
                  <Radio size={14} className="animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Context Metadata Attached</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Clarity</p>
                    <p className="text-xs font-black text-white">{telemetry.clarityScore}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Sentiment</p>
                    <p className="text-xs font-black text-white">{telemetry.clientSentiment}%</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {(['BUG', 'INSIGHT', 'REQUEST'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                      type === t ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your strategic observation..."
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-sm font-bold focus:ring-4 focus:ring-blue-500/20 outline-none transition-all resize-none h-32"
              />

              <button
                onClick={handleSend}
                disabled={isSending || !message.trim()}
                className="w-full py-6 bg-blue-600 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-blue-500 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
              >
                {isSending ? (
                  <RefreshCcw className="animate-spin" size={18} />
                ) : (
                  <>
                    <Send size={18} />
                    <span>Send Transmission</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-blue-600/10 p-4 border-t border-white/5 flex items-center justify-center gap-4">
              <ShieldAlert size={12} className="text-blue-400" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-400">Encrypted End-to-End Tunnel Active</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackModule;
