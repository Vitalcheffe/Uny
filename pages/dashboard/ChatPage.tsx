import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Plus, 
  Send, 
  ChevronDown, 
  Bot, 
  User,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const MODELS = [
  { id: 'claude', name: 'Claude', provider: 'Anthropic' },
  { id: 'gpt', name: 'GPT', provider: 'OpenAI' },
  { id: 'gemini', name: 'Gemini', provider: 'Google' },
];

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id);
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    const { data } = await (supabase
      .from('conversations' as any)
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20) as any);
    
    if (data) setConversations(data);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await (supabase
      .from('messages' as any)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }) as any);
    
    if (data) setMessages(data);
  };

  const createNewConversation = async () => {
    const { data, error } = await (supabase
      .from('conversations' as any)
      .insert({
        title: 'Nouvelle conversation',
        user_id: user?.id
      })
      .select()
      .single() as any);

    if (!error && data) {
      setConversations([data, ...conversations]);
      setCurrentConversation(data);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call the chat proxy API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          model: selectedModel.id,
          conversation_id: currentConversation.id
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Désolé, une erreur est survenue.',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save to database
      await (supabase.from('messages' as any).insert({
        conversation_id: currentConversation.id,
        role: 'user',
        content: userMessage.content
      }) as any);
      await (supabase.from('messages' as any).insert({
        conversation_id: currentConversation.id,
        role: 'assistant',
        content: assistantMessage.content
      }) as any);

      // Update conversation title if it's the first message
      if (messages.length === 0) {
        const title = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '');
        await (supabase
          .from('conversations' as any)
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', currentConversation.id) as any);
        
        setCurrentConversation({ ...currentConversation, title });
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Erreur de connexion. Veuillez réessayer.',
        created_at: new Date().toISOString()
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="flex h-[calc(100vh-64px-48px)] bg-white">
      {/* Left Panel - Conversation History */}
      <div className="w-[260px] border-r border-[#E2E8F0] flex flex-col bg-[#F8FAFC]">
        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle conversation
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune conversation</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setCurrentConversation(conv)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    currentConversation?.id === conv.id
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-white/50'
                  }`}
                >
                  <p className={`text-sm font-medium truncate ${
                    currentConversation?.id === conv.id ? 'text-[#0A0A1A]' : 'text-slate-700'
                  }`}>
                    {conv.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(conv.updated_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat Window */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Zap className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Commencez une conversation</p>
              <p className="text-sm mt-1">Envoyez un message pour démarrer</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${
                  msg.role === 'user'
                    ? 'bg-[#0A0A1A] text-white rounded-2xl rounded-br-md'
                    : 'bg-[#F1F5F9] text-[#0A0A1A] rounded-2xl rounded-bl-md'
                } px-4 py-3`}>
                  <div className="flex items-start gap-2">
                    {msg.role === 'assistant' && (
                      <Bot className="w-5 h-5 mt-0.5 text-[#2563EB]" />
                    )}
                    {msg.role === 'user' && (
                      <User className="w-5 h-5 mt-0.5" />
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#F1F5F9] text-[#0A0A1A] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#2563EB]" />
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#E2E8F0]">
          <div className="flex items-end gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tapez votre message..."
              className="flex-1 bg-transparent resize-none outline-none text-sm py-2 max-h-32"
              rows={1}
            />
            
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="font-medium">{selectedModel.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {modelDropdownOpen && (
                <div className="absolute bottom-full mb-2 right-0 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-1 min-w-[140px]">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                        selectedModel.id === model.id ? 'text-[#2563EB] font-medium' : 'text-slate-700'
                      }`}
                    >
                      {model.name}
                      <span className="text-xs text-slate-400 ml-1">({model.provider})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}