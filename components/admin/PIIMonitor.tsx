/**
 * ⚡ UNY PROTOCOL: PII MONITOR (V1)
 * Description: Composant d'administration pour surveiller le masquage PII.
 * Affiche les statistiques de masquage basées sur ai_request_logs.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-client';
import { Database } from '../../types/supabase';
import { motion } from 'motion/react';
import { ShieldCheck, Activity, Database as DatabaseIcon, AlertCircle, TrendingUp, Lock } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface PIIStats {
  totalRequests: number;
  maskedRequests: number;
  maskingRate: number;
  dailyStats: { date: string; count: number; masked: number }[];
  modelStats: { name: string; value: number }[];
}

type AIRequestLog = Database['public']['Tables']['ai_request_logs']['Row'];

const PIIMonitor: React.FC = () => {
  const [stats, setStats] = useState<PIIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // 1. Récupérer les logs des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error: fetchError } = await supabase
        .from('ai_request_logs')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      if (!data) return;

      // 2. Calculer les statistiques
      const total = data.length;
      const masked = data.filter((log: AIRequestLog) => log.is_masked).length;
      
      // Statistiques journalières
      const dailyMap = new Map<string, { count: number; masked: number }>();
      data.forEach((log: AIRequestLog) => {
        const date = new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        const current = dailyMap.get(date) || { count: 0, masked: 0 };
        current.count++;
        if (log.is_masked) current.masked++;
        dailyMap.set(date, current);
      });

      const dailyStats = Array.from(dailyMap.entries()).map(([date, val]) => ({
        date,
        count: val.count,
        masked: val.masked
      }));

      // Statistiques par modèle
      const modelMap = new Map<string, number>();
      data.forEach((log: AIRequestLog) => {
        const model = log.model_used;
        modelMap.set(model, (modelMap.get(model) || 0) + 1);
      });

      const modelStats = Array.from(modelMap.entries()).map(([name, value]) => ({
        name,
        value
      }));

      setStats({
        totalRequests: total,
        maskedRequests: masked,
        maskingRate: total > 0 ? (masked / total) * 100 : 0,
        dailyStats,
        modelStats
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-[32px] flex items-center gap-4 text-rose-500">
        <AlertCircle size={24} />
        <p className="font-black uppercase tracking-widest text-xs">Signal Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">PII <span className="text-blue-500">Monitor</span></h2>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">Privacy Compliance Node v4.0</p>
        </div>
        <button 
          onClick={fetchStats}
          className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
        >
          <Activity size={18} className="text-blue-500" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px] space-y-4 shadow-2xl"
        >
          <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center">
            <DatabaseIcon size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total AI Requests</p>
            <p className="text-4xl font-black italic tracking-tighter">{stats?.totalRequests}</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px] space-y-4 shadow-2xl"
        >
          <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center">
            <Lock size={24} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Masked Payloads</p>
            <p className="text-4xl font-black italic tracking-tighter text-emerald-500">{stats?.maskedRequests}</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px] space-y-4 shadow-2xl"
        >
          <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Compliance Rate</p>
            <p className="text-4xl font-black italic tracking-tighter text-indigo-500">{stats?.maskingRate.toFixed(1)}%</p>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px] shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-blue-500" />
            <h3 className="text-xs font-black uppercase tracking-widest">Temporal Activity</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff20" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#ffffff20" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="masked" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Distribution */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px] shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest">Model Distribution</h3>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.modelStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.modelStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Active</span>
              <span className="text-xl font-black italic tracking-tighter">{stats?.modelStats.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PIIMonitor;
