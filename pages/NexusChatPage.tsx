import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Zap, ShieldCheck, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PIIMasker } from '../lib/pii-masker';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  masked?: boolean;
  timestamp: Date;
}

type StringMap = Record<string, string>;

const NexusChatPage: React.FC = () => {
  const { user, orgId } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionMapping, setSessionMapping] = useState<Record<string, StringMap>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const { maskedText, mapping } = PIIMasker.mask(userMessage);
      
      if (mapping.size > 0) {
        const mappingObj: StringMap = {};
        mapping.forEach((value, key) => {
          mappingObj[key] = value;
        });
        setSessionMapping((prev) => ({
          ...prev,
          [userMsg.id]: mappingObj,
        }));
      }

      const aiRes = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: maskedText,
          orgId,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.masked ? m.content : m.content,
          })),
        }),
      });

      if (!aiRes.ok) {
        throw new Error('AI request failed');
      }

      const { response } = await aiRes.json();

      const mappingForSession = sessionMapping[userMsg.id];
      const unmaskedResponse = mappingForSession
        ? PIIMasker.unmask(response, new Map(Object.entries(mappingForSession)))
        : response;

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: unmaskedResponse,
        masked: mapping.size > 0,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Erreur lors du traitement IA.');
      
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionMapping({});
    toast.success('Conversation effacée');
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900">Sovereign AI</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">🔒 Données anonymisées</span>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="p-2 hover:bg-slate-100 rounded-lg" title="Effacer">
              <Trash2 className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl ${
                m.role === 'user'
                  ? 'bg-slate-100 ml-auto max-w-[80%]'
                  : 'bg-blue-50 mr-auto max-w-[80%]'
              }`}
            >
              {m.content}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <div className="flex items-center gap-2 p-4 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Traitement en cours...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 p-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500"
            placeholder="Discutez en toute sécurité avec l'IA..."
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Vos données sont anonymisées avant d'être envoyées à l'IA ✓
        </p>
      </div>
    </div>
  );
};

export default NexusChatPage;
