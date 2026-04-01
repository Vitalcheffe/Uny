import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Building2, FileText, Zap, Command, X, ChevronRight, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'ORGANIZATION' | 'DOCUMENT' | 'COMMAND' | 'PROJECT';
  title: string;
  subtitle: string;
  url: string;
}

const SpotlightSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const [orgs, docs, projects] = await Promise.all([
        supabase.from('organizations').select('id, name, sector').ilike('name', `%${searchQuery}%`).limit(5),
        supabase.from('documents').select('id, file_name, file_type, org_id').ilike('file_name', `%${searchQuery}%`).limit(5),
        supabase.from('projects').select('id, name, status, org_id').ilike('name', `%${searchQuery}%`).limit(5)
      ]);

      const formattedResults: SearchResult[] = [
        ...(orgs.data?.map(o => ({
          id: o.id,
          type: 'ORGANIZATION' as const,
          title: o.name,
          subtitle: o.sector || 'Secteur Non Défini',
          url: `/dashboard?orgId=${o.id}`
        })) || []),
        ...(docs.data?.map(d => ({
          id: d.id,
          type: 'DOCUMENT' as const,
          title: d.file_name,
          subtitle: `${d.file_type} • ${d.org_id}`,
          url: `/documents?id=${d.id}`
        })) || []),
        ...(projects.data?.map(p => ({
          id: p.id,
          type: 'PROJECT' as const,
          title: p.name,
          subtitle: p.status,
          url: `/projects?id=${p.id}`
        })) || [])
      ];

      // Add system commands
      const commands: SearchResult[] = [
        { id: 'cmd-1', type: 'COMMAND' as const, title: 'Ouvrir Station de Combat', subtitle: 'Accès Super Admin', url: '/uny-command' },
        { id: 'cmd-2', type: 'COMMAND' as const, title: 'Déployer Nouvelle Mission', subtitle: 'Provisionnement Atomique', url: '/uny-command?action=deploy' },
        { id: 'cmd-3', type: 'COMMAND' as const, title: 'Audit de Conformité', subtitle: 'Loi 09-08 CNDP', url: '/compliance' }
      ].filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

      setResults([...commands, ...formattedResults]);
    } catch (err) {
      console.error("Spotlight Search Fault:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh] p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            onKeyDown={onKeyDown}
          >
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
              <Search className="text-zinc-500" size={20} />
              <input 
                autoFocus
                type="text"
                placeholder="Recherche Spotlight (CMD+K)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-lg font-black italic uppercase tracking-tight text-white placeholder:text-zinc-700"
              />
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-black text-zinc-500">
                <Command size={10} /> K
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-4">
              {loading && query.length > 1 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-zinc-600">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Indexation en cours...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group ${
                        index === selectedIndex ? 'bg-blue-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          index === selectedIndex ? 'bg-white/20' : 'bg-zinc-800'
                        }`}>
                          {result.type === 'ORGANIZATION' && <Building2 size={18} />}
                          {result.type === 'DOCUMENT' && <FileText size={18} />}
                          {result.type === 'COMMAND' && <Zap size={18} />}
                          {result.type === 'PROJECT' && <ChevronRight size={18} />}
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-black italic uppercase tracking-tight ${
                            index === selectedIndex ? 'text-white' : 'text-white'
                          }`}>{result.title}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${
                            index === selectedIndex ? 'text-white/60' : 'text-zinc-600'
                          }`}>{result.subtitle}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                        index === selectedIndex ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {result.type}
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.length > 1 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-700 mx-auto">
                    <Search size={32} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Aucun résultat pour "{query}"</p>
                </div>
              ) : (
                <div className="py-12 text-center space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Suggestions de Commandes</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Zap, label: 'Déployer Mission', cmd: 'deploy' },
                      { icon: ShieldCheck, label: 'Audit Sécurité', cmd: 'audit' },
                      { icon: Building2, label: 'Liste Clients', cmd: 'clients' },
                      { icon: FileText, label: 'Documents Récents', cmd: 'docs' }
                    ].map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => setQuery(s.cmd)}
                        className="p-6 bg-white/5 rounded-[24px] border border-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3 group"
                      >
                        <s.icon className="text-zinc-600 group-hover:text-blue-500 transition-colors" size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1"><ChevronRight size={10} /> Sélectionner</span>
                <span className="flex items-center gap-1"><Command size={10} /> Entrée Ouvrir</span>
              </div>
              <span>UNY Spotlight Engine v1.0</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SpotlightSearch;
