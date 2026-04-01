/**
 * ⚡ UNY PROTOCOL: SECRET GATE (V1)
 * Description: Porte dérobée sécurisée pour l'accès SUPER_ADMIN.
 * Route obscure, invisible aux moteurs de recherche.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase-client';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const Portal_A78x: React.FC = () => {
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
        navigate('/dashboard');
      } else {
        // Simulation 404 pour masquer l'existence de la page aux non-admins
        setIsNotFound(true);
      }
    } catch (err: any) {
      console.error(`❌ [Portal] Login fault: ${err.message}`);
      setIsNotFound(true); // Même en cas d'erreur de login, on simule une 404
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/5 p-12 rounded-[40px] shadow-2xl space-y-8"
      >
        <div className="space-y-2">
          <h2 className="text-white font-black italic text-3xl uppercase tracking-tighter leading-none">
            System <span className="text-blue-500">Override</span>
          </h2>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">
            Restricted Access Protocol v4.0
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Identity</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@uny.protocol"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/10 focus:border-blue-500/50 outline-none transition-all"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Cipher</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/10 focus:border-blue-500/50 outline-none transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Authenticating...' : 'Execute Login'}
          </button>
        </form>

        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
          <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Auth_Node: 0x78A</span>
          <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Status: Encrypted</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Portal_A78x;
