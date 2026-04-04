/**
 * ⚡ UNY PROTOCOL: STEALTH GATE (X92)
 * Description: Porte dérobée furtive pour l'accès SUPER_ADMIN.
 * Simule une 404 pour les non-initiés.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase-client';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const Gate_X92: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const navigate = useNavigate();

  // Directive robots: noindex, nofollow
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;
      const role = user?.app_metadata?.role;

      if (role === 'SUPER_ADMIN') {
        toast.success('Accès Système Autorisé.');
        // Force reload navigation
        window.location.href = '/dashboard';
      } else {
        // Simulation 404 pour masquer l'existence de la page aux non-admins
        setIsNotFound(true);
      }
    } catch (err: any) {
      console.error(`❌ [Gate] Login fault: ${err.message}`);
      setIsNotFound(true); // Simulation 404 systématique en cas d'échec
    } finally {
      setLoading(false);
    }
  };

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-9xl font-black text-slate-100 italic tracking-tighter">404</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest mt-4">Page Not Found</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 text-xs font-black uppercase tracking-widest text-blue-600 hover:underline"
        >
          Return to Base
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
          backgroundSize: '30px 30px' 
        }} 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/5 p-12 rounded-[48px] shadow-2xl space-y-10 relative z-10"
      >
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-orange-600/20">
            <span className="text-white font-black italic text-2xl">X</span>
          </div>
          <h2 className="text-white font-black italic text-3xl uppercase tracking-tighter leading-none pt-4">
            Commander <span className="text-orange-500">Gate</span>
          </h2>
          <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.4em]">
            Sovereign Access Protocol v9.2
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Identity_Hash</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@protocol.x"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder:text-white/10 focus:border-orange-500/50 outline-none transition-all font-mono text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Cipher_Key</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder:text-white/10 focus:border-orange-500/50 outline-none transition-all font-mono text-sm"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-orange-600/20"
          >
            {loading ? 'Decrypting...' : 'Execute Override'}
          </button>
        </form>

        <div className="pt-6 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Node_Active</span>
          </div>
          <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">0x92B_SECURE</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Gate_X92;
