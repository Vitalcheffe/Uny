import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Zap, ShieldCheck, FileText, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const NexusChatPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      // 1. Anonymize via NER Engine
      const nerRes = await fetch('/api/ner/mask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMessage }),
      });
      const { maskedText } = await nerRes.json();

      // 2. Send to AI (Simulated for now, would integrate with Gemini API)
      setMessages(prev => [...prev, { role: 'ai', content: `[Anonymized]: ${maskedText}. (Processing your request...)` }]);
    } catch (error) {
      toast.error("Erreur lors du traitement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-2xl ${m.role === 'user' ? 'bg-slate-100 ml-auto max-w-[80%]' : 'bg-blue-50 mr-auto max-w-[80%]'}`}>
            {m.content}
          </motion.div>
        ))}
        {loading && <div className="p-4 text-slate-400">Anonymisation en cours...</div>}
      </div>
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 p-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500"
            placeholder="Discutez en toute sécurité..."
          />
          <button onClick={sendMessage} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NexusChatPage;
