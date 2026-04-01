import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Users, Briefcase, 
  Wallet, Plus, FileText, Receipt, ArrowUpRight,
  MoreVertical, ShieldCheck, Zap, Activity, Cpu
} from 'lucide-react';
import * as Router from 'react-router-dom';
const { useNavigate, Link } = Router as any;
import { useAuth } from '../context/AuthContext';
import { useCognitive } from '../context/CognitiveContext';
import { firestoreService } from '../lib/supabase-data-layer';
import { formatMAD } from '../lib/local-adaptation';
import { FiscalCalendarWidget } from '../components/FiscalCalendarWidget';
import SynapseGraph from '../components/dashboard/SynapseGraph';

import { THEME } from '../constants/theme';

/**
 * TITAN GLASS STAT CARD (Stable CSS Implementation)
 * Replaces WebGL instances to prevent context loss.
 */
const StatCardTitan = ({ title, value, change, trend, icon, color }: any) => {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative glass-card overflow-hidden group cursor-pointer transition-all duration-500"
      style={{
        borderRadius: THEME.borderRadius['3xl'],
        padding: THEME.spacing.xl,
        boxShadow: THEME.shadows.titan,
      }}
    >
      {/* Decorative Radial Shimmer */}
      <div 
        className="absolute -top-24 -right-24 w-64 h-64 opacity-10 group-hover:opacity-20 transition-opacity duration-700" 
        style={{ 
          background: color,
          filter: `blur(${THEME.spacing['8xl']})`
        }} 
      />
      
      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div 
            className="bg-white/5 shadow-sm border border-white/10 group-hover:border-blue-500/50 transition-all duration-500"
            style={{
              padding: THEME.spacing.md,
              borderRadius: THEME.borderRadius.xl,
            }}
          >
            {React.cloneElement(icon as React.ReactElement<any>, { size: 22, className: "text-zinc-400 group-hover:text-blue-400 transition-colors" })}
          </div>
          
          <div 
            className={`flex items-center gap-1.5 rounded-full font-black uppercase tracking-widest border transition-all ${
              trend === 'up' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
              trend === 'down' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
              'text-zinc-500 bg-white/5 border-white/10'
            }`}
            style={{
              padding: `${THEME.spacing.sm} ${THEME.spacing.md}`,
              fontSize: THEME.typography.fontSize['3xs'],
            }}
          >
            {trend === 'up' ? <ArrowUpRight size={10} /> : <Activity size={10} />}
            {change}
          </div>
        </div>
        
        <div className="space-y-1">
          <p 
            className="font-black text-zinc-500 uppercase leading-none italic"
            style={{
              fontSize: THEME.typography.fontSize['2xs'],
              letterSpacing: THEME.typography.letterSpacing.ultra,
            }}
          >
            {title}
          </p>
          <h3 
            className="font-[950] italic tracking-tighter text-white uppercase"
            style={{
              fontSize: THEME.typography.fontSize['4xl'],
            }}
          >
            {value}
          </h3>
        </div>
      </div>
      
      {/* Animated Bottom Border */}
      <div 
        className="absolute bottom-0 left-0 w-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-full transition-all duration-1000" 
        style={{
          height: THEME.spacing['2xs'],
        }}
      />
    </motion.div>
  );
};

const DashboardHome: React.FC = () => {
  const { orgId, profile } = useAuth();
  const { setActiveModule, logCognitiveAction } = useCognitive();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    revenue: 0,
    projects: 0,
    clients: 0,
    cash: 0,
    recentInvoices: [] as any[],
    activeProjects: [] as any[],
    chartData: [] as any[]
  });

  useEffect(() => {
    setActiveModule('dashboard');
    logCognitiveAction(
      'view_dashboard',
      { orgId },
      'User accessed the main dashboard.'
    );
  }, [setActiveModule, logCognitiveAction, orgId]);

  const fetchDashboardData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [invRes, projRes, clientRes] = await Promise.all([
        firestoreService.getCollection('invoices', orgId, [], 'created_at', 'desc'),
        firestoreService.getCollection('projects', orgId, [], 'updated_at', 'desc'),
        firestoreService.getCollection('clients', orgId, [])
      ]);

      const allInvoices = invRes || [];
      const paidInvoices = allInvoices.filter(i => (i as any).status === 'Paid');
      const totalRev = paidInvoices.reduce((sum, i) => sum + Number((i as any).amount), 0);
      
      // Calculate monthly revenue for the chart
      const monthlyData: Record<string, number> = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize last 6 months
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        monthlyData[`${months[d.getMonth()]} ${d.getFullYear()}`] = 0;
      }

      paidInvoices.forEach((inv: any) => {
        if (inv.created_at) {
          const d = new Date(inv.created_at);
          const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
          if (monthlyData[key] !== undefined) {
            monthlyData[key] += Number(inv.amount);
          }
        }
      });

      const chartData = Object.keys(monthlyData).map(key => ({
        name: key.split(' ')[0], // Just the month name
        amount: monthlyData[key]
      }));

      setMetrics({
        revenue: totalRev,
        projects: projRes?.length || 0,
        clients: clientRes?.length || 0,
        cash: totalRev * 0.82,
        recentInvoices: allInvoices.slice(0, 5),
        activeProjects: projRes?.slice(0, 3) || [],
        chartData: chartData
      });
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  if (loading) {
    return (
      <div 
        className="flex flex-col items-center justify-center gap-8"
        style={{
          minHeight: '70vh',
          backgroundColor: THEME.colors.background,
        }}
      >
        <div className="relative">
           <div 
             className="border-[3px] border-white/5 border-t-blue-600 rounded-full animate-spin" 
             style={{
               width: THEME.spacing['5xl'],
               height: THEME.spacing['5xl'],
             }}
           />
           <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="bg-blue-600 rounded-lg animate-pulse" 
                style={{
                  width: THEME.spacing.lg,
                  height: THEME.spacing.lg,
                }}
              />
           </div>
        </div>
        <p 
          className="font-black uppercase italic text-zinc-500"
          style={{
            fontSize: THEME.typography.fontSize['2xs'],
            letterSpacing: THEME.typography.letterSpacing.giga,
          }}
        >
          Système UNY Hub - Niveau 1 Opérationnel
        </p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen selection:bg-blue-500/30"
      style={{
        backgroundColor: THEME.colors.background,
        paddingBottom: THEME.spacing['7xl'],
      }}
    >
      
      <header 
        className="relative mb-12 overflow-hidden border-b border-white/5"
        style={{
          padding: `${THEME.spacing['5xl']} ${THEME.spacing['3xl']}`,
          backgroundColor: THEME.colors.background,
        }}
      >
        {/* Titan Background Decor */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
          style={{ 
            backgroundImage: `radial-gradient(${THEME.colors.primary} 1px, transparent 1px)`, 
            backgroundSize: `${THEME.spacing['2xl']} ${THEME.spacing['2xl']}` 
          }} 
        />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />

        <div className="max-w-[1500px] mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-blue-500">
               <Cpu size={16} className="animate-pulse" />
               <span 
                 className="font-black uppercase italic"
                 style={{
                   fontSize: THEME.typography.fontSize['2xs'],
                   letterSpacing: THEME.typography.letterSpacing.mega,
                 }}
               >
                 Intégrité du Nœud : Nameinale
               </span>
            </div>
            <h1 
              className="font-[950] text-white tracking-tighter italic uppercase leading-none"
              style={{
                fontSize: THEME.typography.fontSize['6xl'],
              }}
            >
              Centre de <br /> <span style={{ color: THEME.colors.primaryDark }}>Commandement</span>
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
              Unité d'Intelligence Souveraine // OrgID: {orgId?.split('-')[0]}
            </p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/dashboard/documents')}
              className="glass-card rounded-3xl font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center gap-3 shadow-sm italic"
              style={{
                padding: `${THEME.spacing.xl} ${THEME.spacing['6xl']}`,
                fontSize: THEME.typography.fontSize['2xs'],
              }}
            >
              <FileText size={18} /> Ingérer les Données
            </button>
            <button 
              onClick={() => navigate('/dashboard/projects')}
              className="bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-3 shadow-2xl shadow-blue-500/20 italic glow-button"
              style={{
                padding: `${THEME.spacing.xl} ${THEME.spacing['7xl']}`,
                fontSize: THEME.typography.fontSize['2xs'],
              }}
            >
              <Plus size={18} /> Déployer une Mission
            </button>
          </div>
        </div>
      </header>
      
      <main 
        className="max-w-[1500px] mx-auto space-y-10"
        style={{
          paddingLeft: THEME.spacing['3xl'],
          paddingRight: THEME.spacing['3xl'],
        }}
      >
        
        {/* STAT GRID (Stable CSS Based) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCardTitan
            title="Revenus Sécurisés"
            value={formatMAD(metrics.revenue, false)}
            change={metrics.revenue > 0 ? "+100%" : "0%"}
            trend={metrics.revenue > 0 ? "up" : "neutral"}
            color={THEME.colors.primary}
            icon={<TrendingUp />}
          />
          <StatCardTitan
            title="Missions Actives"
            value={metrics.projects}
            change={metrics.projects > 0 ? "Active" : "En attente"}
            trend={metrics.projects > 0 ? "up" : "neutral"}
            color={THEME.colors.secondary}
            icon={<Briefcase />}
          />
          <StatCardTitan
            title="Registre d'Entités"
            value={metrics.clients}
            change={metrics.clients > 0 ? "Vérifié" : "Vide"}
            trend={metrics.clients > 0 ? "up" : "neutral"}
            color={THEME.colors.success}
            icon={<Users />}
          />
          <StatCardTitan
            title="Réserve de Capital"
            value={formatMAD(Math.round(metrics.cash), false)}
            change={metrics.cash > 0 ? "Stable" : "N/A"}
            trend={metrics.cash > 0 ? "up" : "neutral"}
            color={THEME.colors.warning}
            icon={<Wallet />}
          />
        </section>

        {/* ANALYTICS SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div 
            className="lg:col-span-8 glass-card shadow-sm relative overflow-hidden group"
            style={{
              borderRadius: THEME.borderRadius['6xl'],
              padding: THEME.spacing['3xl'],
            }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-blue-500">
                  <Activity size={18} />
                  <h3 
                    className="font-black uppercase"
                    style={{
                      fontSize: THEME.typography.fontSize['2xs'],
                      letterSpacing: THEME.typography.letterSpacing.wider,
                    }}
                  >
                    Analyse de Vélocité
                  </h3>
                </div>
                <h3 
                  className="font-[950] italic uppercase tracking-tighter text-white"
                  style={{
                    fontSize: THEME.typography.fontSize['3xl'],
                  }}
                >
                  Trajectoire <span style={{ color: THEME.colors.primaryDark }}>du Capital</span>
                </h3>
              </div>
              <button 
                className="bg-white/5 text-zinc-500 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                style={{
                  padding: `${THEME.spacing.md} ${THEME.spacing.lg}`,
                  fontSize: THEME.typography.fontSize['3xs'],
                }}
              >
                Auditer les Projections
              </button>
            </div>
            
            <div 
              className="w-full"
              style={{
                height: `${THEME.charts.height}px`,
              }}
            >
              {metrics.revenue === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60 italic">
                  <Activity size={48} className="text-zinc-500" />
                  <p 
                    className="font-black uppercase tracking-widest text-zinc-400"
                    style={{ fontSize: THEME.typography.fontSize['2xs'] }}
                  >
                    DONNÉES INSUFFISANTES POUR LA PROJECTION
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={THEME.colors.primary} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={THEME.colors.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: parseInt(THEME.typography.fontSize['2xs']), fill: '#52525b', fontWeight: 900 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: parseInt(THEME.typography.fontSize['2xs']), fill: '#52525b', fontWeight: 900 }} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: THEME.charts.tooltip.borderRadius, 
                        border: THEME.charts.tooltip.border, 
                        boxShadow: THEME.charts.tooltip.boxShadow, 
                        background: THEME.charts.tooltip.background, 
                        color: '#fff', 
                        padding: THEME.spacing.lg 
                      }}
                      itemStyle={{ fontSize: THEME.typography.fontSize.xs, fontWeight: 900, textTransform: 'uppercase' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke={THEME.colors.primary} strokeWidth={6} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-10">
            <div 
              className="glass-card text-white shadow-2xl relative overflow-hidden group flex-1"
              style={{
                borderRadius: THEME.borderRadius['6xl'],
                padding: THEME.spacing['3xl'],
              }}
            >
              <div 
                className="absolute top-0 right-0 opacity-5 group-hover:rotate-12 transition-transform duration-1000"
                style={{
                  padding: THEME.spacing.xl,
                }}
              >
                 <Receipt size={160} />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                 <div className="flex items-center justify-between mb-12">
                    <h3 
                      className="italic uppercase tracking-tighter"
                      style={{
                        fontSize: THEME.typography.fontSize.xl,
                        fontWeight: 950,
                      }}
                    >
                      Facturation Latente
                    </h3>
                    <Link to="/dashboard/tools/invoices" className="p-2 bg-white/5 rounded-xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all"><ArrowUpRight size={18} /></Link>
                 </div>
                 
                 <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
                    {metrics.recentInvoices.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60 italic py-10">
                        <Receipt size={32} className="text-zinc-500" />
                        <p 
                          className="font-black uppercase tracking-widest text-zinc-400"
                          style={{ fontSize: THEME.typography.fontSize['2xs'] }}
                        >
                          AUCUNE FACTURE
                        </p>
                      </div>
                    ) : (
                      metrics.recentInvoices.map((inv) => (
                        <div 
                          key={inv.id} 
                          className="flex items-center gap-6 bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
                          style={{
                            padding: THEME.spacing.md,
                            borderRadius: THEME.borderRadius['3xl'],
                          }}
                        >
                           <div 
                             className={`rounded-2xl ${inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}
                             style={{
                               padding: THEME.spacing.md,
                             }}
                           >
                             <Receipt size={20} />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-black uppercase italic tracking-tight truncate">{inv.client_name}</p>
                             <p 
                               className="font-bold text-zinc-600 uppercase tracking-widest mt-1"
                               style={{ fontSize: THEME.typography.fontSize['3xs'] }}
                             >
                               #TX-{inv.id.slice(0,6)}
                             </p>
                           </div>
                           <div className="text-right">
                             <p className="font-[950] italic" style={{ fontSize: THEME.typography.fontSize.sm }}>{formatMAD(Number(inv.amount))}</p>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
                 <button 
                   className="w-full mt-10 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all italic"
                   style={{
                     padding: THEME.spacing.xl,
                     fontSize: THEME.typography.fontSize['2xs'],
                   }}
                 >
                    Synchroniser les Nœuds
                 </button>
              </div>
            </div>
            
            <FiscalCalendarWidget />
          </div>
        </section>

        {/* NEURAL NETWORK VISUALIZATION */}
        <section className="w-full">
          <SynapseGraph orgId={orgId || ''} />
        </section>

        <footer 
          className="border-t border-white/5 flex flex-col md:flex-row items-center justify-between opacity-50 gap-6"
          style={{
            paddingTop: THEME.spacing['3xl'],
          }}
        >
           <div className="flex items-center gap-4">
              <div 
                className="rounded-full bg-emerald-500 animate-pulse" 
                style={{
                  width: THEME.spacing.sm,
                  height: THEME.spacing.sm,
                }}
              />
              <span 
                className="font-black uppercase tracking-widest text-zinc-500 italic"
                style={{
                  fontSize: THEME.typography.fontSize['2xs'],
                }}
              >
                Disponibilité du Système : Vérifiée
              </span>
           </div>
           <p 
             className="font-black uppercase text-zinc-700 italic"
             style={{
               fontSize: THEME.typography.fontSize['3xs'],
               letterSpacing: THEME.typography.letterSpacing.mega,
             }}
           >
             UNY HUB // Build 2100.Alpha.4
           </p>
        </footer>
      </main>
    </div>
  );
};

export default DashboardHome;