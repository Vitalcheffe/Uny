
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, User, Clock, Terminal, Zap, Loader2 } from 'lucide-react';
import { firestoreService } from '../../lib/firestore-service';
import { useAuth } from '../../context/AuthContext';

interface Note {
  id: string;
  content: string;
  author_name: string;
  user_id: string;
  created_at: any;
}

interface ProjectNotesProps {
  projectId: string;
}

const ProjectNotes: React.FC<ProjectNotesProps> = ({ projectId }) => {
  const { orgId, profile, user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchNotes = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await firestoreService.getCollection(
        'project_notes',
        orgId!,
        [{ field: 'project_id', operator: '==', value: projectId }],
        'created_at',
        'asc'
      );
      setNotes(data as Note[]);
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    fetchNotes();

    // Establish real-time synaptic link
    const unsubscribe = firestoreService.subscribeToCollection(
      'project_notes',
      orgId!,
      [{ field: 'project_id', operator: '==', value: projectId }],
      (data) => {
        // Sort manually if needed or ensure firestore handles it
        const sorted = [...data].sort((a, b) => {
          const t1 = new Date(a.created_at).getTime();
          const t2 = new Date(b.created_at).getTime();
          return t1 - t2;
        });
        setNotes(sorted as Note[]);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !orgId || !user) return;

    setSending(true);
    try {
      await firestoreService.addDocument('project_notes', orgId, {
        project_id: projectId,
        user_id: user.id,
        author_name: profile?.full_name || 'Operative',
        content: content.trim(),
        created_at: new Date().toISOString()
      });
      setContent('');
    } catch (err) {
      console.error("Signal Transmission Error:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-[40px] border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 text-slate-900">
           <MessageSquare size={18} className="text-blue-500" />
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Team Intel Hub</h3>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Secure Link Active</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center opacity-20">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
             <Terminal size={32} />
             <p className="text-[9px] font-black uppercase tracking-widest">No mission logs captured yet.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 ${note.user_id === user?.id ? 'flex-row-reverse' : ''}`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black italic shrink-0 shadow-lg">
                  {note.author_name[0]}
                </div>
                <div className={`max-w-[80%] space-y-1.5 ${note.user_id === user?.id ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                     <span>{note.author_name}</span>
                     <Clock size={10} />
                     <span>{formatTime(note.created_at)}</span>
                  </div>
                  <div className={`p-4 rounded-[24px] text-xs font-bold leading-relaxed shadow-sm border ${
                    note.user_id === user?.id 
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                    : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                  }`}>
                    {note.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSend} className="relative group">
          <input 
            type="text" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Broadcast mission intel..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-6 pr-14 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all italic"
          />
          <button 
            type="submit"
            disabled={sending || !content.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
              content.trim() ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-slate-300'
            }`}
          >
            {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          </button>
        </form>
        <div className="mt-3 flex items-center justify-center gap-3 opacity-20">
           <Zap size={10} />
           <span className="text-[7px] font-black uppercase tracking-[0.4em]">Proprietary Cognitive Tunneling Active</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectNotes;
