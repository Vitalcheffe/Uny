import React, { useState } from 'react';
import { Sparkles, Send, Loader2, X, BrainCircuit } from 'lucide-react';
import { useCognitive } from '../../context/CognitiveContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

const CognitiveCommandInput: React.FC = () => {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { executeCommand, activeModule, focusedEntities, lastResponse, setLastResponse } = useCognitive();
  const { t } = useLanguage();

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      let intent = 'unknown';
      const payload: Record<string, unknown> = { raw_text: command, module: activeModule, context: focusedEntities };

      const lowerCmd = command.toLowerCase();
      if (lowerCmd.includes('facture') || lowerCmd.includes('invoice')) {
        intent = 'generate_invoice';
      } else if (lowerCmd.includes('client')) {
        intent = 'create_client';
      } else if (lowerCmd.includes('projet') || lowerCmd.includes('project')) {
        intent = 'create_project';
      } else if (lowerCmd.includes('analyse') || lowerCmd.includes('audit')) {
        intent = 'analyze_data';
      } else if (lowerCmd.includes('juridique') || lowerCmd.includes('legal')) {
        intent = 'legal_review';
      }

      await executeCommand(intent, payload);
      setCommand('');
    } catch (error: unknown) {
      // Error handled by context or silently
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50 flex flex-col gap-4">
      <AnimatePresence>
        {lastResponse && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
            <button 
              onClick={() => setLastResponse(null)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <BrainCircuit size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Artificielle</span>
            </div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
              {lastResponse}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#1A1615]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl shadow-black/50">
        <form onSubmit={handleCommandSubmit} className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Sparkles size={20} />
          </div>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={t('ask_ai') || "Demandez à l'IA (ex: Analyse les risques du projet X)..."}
            className="flex-1 bg-transparent border-none text-white text-sm focus:ring-0 placeholder:text-zinc-500 px-2 outline-none"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!command.trim() || isProcessing}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-colors shrink-0"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CognitiveCommandInput;
