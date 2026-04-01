
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, X, BrainCircuit, Terminal, Sparkles, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Database } from '../../types/supabase';

type Project = Database['public']['Tables']['projects']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SentinelAssistantProps {
  stats: {
    missions: number;
    clients: number;
    payroll: number;
    revenue: number;
    moatIndex: number;
  };
  projects: Project[];
  clients: Client[];
}

const SentinelAssistant: React.FC<SentinelAssistantProps> = ({ stats, projects, clients }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Sentinel IA active. Prête pour une analyse tactique de votre organisation." }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        UNY SENTINEL COMMANDER v2.0
        
        CONTEXTE ORGANISATIONNEL :
        - Missions Actives : ${stats.missions}
        - Clients Connectés : ${stats.clients}
        - Masse Salariale : ${stats.payroll} MAD/mois
        - Chiffre d'Affaires : ${stats.revenue} MAD
        - Indice de Densité (Moat) : ${stats.moatIndex}%
        
        LISTE DES PROJETS :
        ${projects.map(p => `- ${p.name} (Budget: ${p.revenue} MAD, Status: ${p.status})`).join('\n')}
        
        OBJECTIF :
        Tu es l'assistant Sentinel d'UNY. Réponds de manière chirurgicale, tactique et ultra-professionnelle.
        Si l'utilisateur demande une analyse, utilise les données fournies pour détecter des incohérences ou suggérer des optimisations.
        
        MESSAGE UTILISATEUR :
        "${userMsg}"
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "Erreur de liaison neurale." }]);
    } catch (err: unknown) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Le Kernel IA est actuellement hors ligne ou surchargé." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="fixed bottom-32 right-10 z-[500] w-16 h-16 bg-[#1a1615] text-blue-500 rounded-2xl shadow-2xl flex items-center justify-center border border-blue-500/20 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
          <BrainCircuit size={32} className="relative z-10 animate-pulse" />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1, 
              filter: 'blur(0px)',
              height: isMinimized ? '80px' : '600px'
            }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-10 right-10 z-[501] w-[450px] bg-[#1a1615] rounded-[40px] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col transition-all duration-500`}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                     <Bot size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black italic uppercase tracking-[0.2em] text-white">Sentinel IA</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Neural Link Active</span>
                    </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-slate-500 hover:text-white transition-colors">
                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                    <X size={20} />
                  </button>
               </div>
            </div>

            {!isMinimized && (
              <>
                {/* Chat Stream */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-gradient-to-b from-[#1a1615] to-[#0c0a09]"
                >
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-5 rounded-[24px] text-xs font-bold leading-relaxed shadow-sm ${
                        m.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white/5 text-slate-300 border border-white/5 rounded-tl-none italic'
                      }`}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3">
                         <Loader2 size={14} className="animate-spin text-blue-500" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Sentinel analyse...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-white/5 bg-white/5">
                  <form onSubmit={handleChat} className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">
                      <Terminal size={16} />
                    </div>
                    <input 
                      autoFocus
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Interroger l'IA Sentinel..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-16 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all italic placeholder:text-slate-700"
                    />
                    <button 
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shadow-xl disabled:opacity-30"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                  <div className="mt-4 flex items-center justify-center gap-4 opacity-30">
                    <Sparkles size={12} className="text-blue-400" />
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Powered by Gemini 3 Core</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SentinelAssistant;
