
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion as _motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  Filter, Download, ChevronRight, CheckCircle2, 
  Clock, AlertCircle, MoreHorizontal, ArrowUpRight, 
  ArrowDownRight, Landmark, Zap, Lock, Database,
  Activity, FileText, Plus, Search, RefreshCw,
  Wallet, PieChart, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../lib/supabase-data-layer';
import { eventBus, EVENTS } from '../lib/eventBus';
import { formatMAD } from '../lib/local-adaptation';

const motion = _motion as any;

// --- Sub-components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Sent: 'bg-blue-50 text-blue-600 border-blue-100',
    Draft: 'bg-slate-50 text-slate-500 border-slate-100',
    Overdue: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status] || styles.Draft}`}>
      {status}
    </span>
  );
};

const FiscalCalendar = () => {
  const { orgId } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    
    const fetchDeadlines = async () => {
      setLoading(true);
      try {
        const data = await firestoreService.getCollection(
          'fiscal_deadlines',
          orgId,
          [],
          'due_date',
          'asc'
        );
        setEvents(data || []);
      } catch (err) {
        console.error('Failed to fetch fiscal deadlines:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeadlines();

    const unsubscribe = firestoreService.subscribeToCollection(
      'fiscal_deadlines',
      orgId,
      [],
      fetchDeadlines
    );

    return () => unsubscribe();
  }, [orgId]);

  return (
    <div className="bg-[#1a1615] rounded-[48px] p-10 text-white relative overflow-hidden group border border-white/5 h-full shadow-2xl flex flex-col">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
        <Calendar size={180} />
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4 text-emerald-400">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Fiscal Timeline</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-6 p-5 bg-white/5 rounded-3xl border border-white/5 animate-pulse">
                  <div className="w-12 h-12 bg-white/10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/10 rounded-full w-3/4" />
                    <div className="h-2 bg-white/10 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60 italic py-10">
              <Calendar size={48} className="text-slate-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AUCUNE ÉCHÉANCE ACTUELLE</p>
              <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                + INITIATIALISER LE MODULE FISCAL
              </button>
            </div>
          ) : (
            events.map((ev, i) => {
              const dateObj = new Date(ev.due_date);
              const day = dateObj.getDate().toString().padStart(2, '0');
              const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
              
              return (
                <motion.div 
                  key={ev.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-6 p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/item"
                >
                  <div className="text-center shrink-0 w-12">
                    <p className="text-xl font-black italic tracking-tighter leading-none text-white">{day}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">{month}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-200 group-hover/item:text-emerald-400 transition-colors">{ev.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <div className={`w-1.5 h-1.5 rounded-full ${ev.type === 'TAX' ? 'bg-amber-500' : ev.type === 'INCOME' ? 'bg-emerald-500' : ev.type === 'EXPENSE' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                       <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{ev.type}</span>
                    </div>
                  </div>
                  {ev.urgent && <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                  <ChevronRight size={14} className="text-slate-700 group-hover/item:text-white transition-colors" />
                </motion.div>
              );
            })
          )}
        </div>
        
        <div className="mt-8 pt-4 border-t border-white/5">
          <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all italic">
            En attente de synchronisation ERP
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---

const FinanceTresorerie: React.FC = () => {
  const { orgId } = useAuth();
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchInvoices = useCallback(async (isSilent = false) => {
    if (!orgId) return;
    if (!isSilent) setLoading(true);
    try {
      const data = await firestoreService.getCollection(
        'invoices',
        orgId,
        [],
        'due_date',
        'desc'
      );
      
      if (data) {
        setInvoices(data);
        const totalPaid = data
          .filter(i => (i as any).status === 'Paid')
          .reduce((sum, i) => sum + Number((i as any).amount), 0);
        setCashBalance(totalPaid);

        // Calculate real daily trend based on invoices (last 7 days)
        const dailyData: Record<string, { income: number, pending: number }> = {};
        const today = new Date();
        
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyData[dateStr] = { income: 0, pending: 0 };
        }

        data.forEach((inv: any) => {
          if (inv.created_at) {
            const d = new Date(inv.created_at);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (dailyData[dateStr]) {
              if (inv.status === 'Paid') {
                dailyData[dateStr].income += Number(inv.amount);
              } else {
                dailyData[dateStr].pending += Number(inv.amount);
              }
            }
          }
        });

        const newChartData = Object.keys(dailyData).map(key => ({
          name: key,
          income: dailyData[key].income,
          expense: dailyData[key].pending // Using 'expense' key for the red line, but it represents pending revenue
        }));
        
        setChartData(newChartData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchInvoices();
    if (!orgId) return;

    const unsubscribe = firestoreService.subscribeToCollection(
      'invoices',
      orgId,
      [],
      () => fetchInvoices(true)
    );
    
    const handleCashSignal = (newVal: number) => setCashBalance(newVal);
    eventBus.on(EVENTS.CASH_UPDATED, handleCashSignal);

    return () => { 
      unsubscribe();
      eventBus.off(EVENTS.CASH_UPDATED, handleCashSignal);
    };
  }, [fetchInvoices, orgId]);

  const stats = useMemo(() => {
    const pending = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + Number(i.amount), 0);
    const overdue = invoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + Number(i.amount), 0);
    return { pending, overdue };
  }, [invoices]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 max-w-[1750px] mx-auto pb-32"
    >
      {/* 1. COMMAND CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="bg-[#1a1615] rounded-[56px] p-12 text-white col-span-1 lg:col-span-2 relative overflow-hidden group shadow-2xl border border-white/5">
           <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-1000" />
           <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-8">
                <div className="flex items-center gap-4 text-emerald-400">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <Landmark size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Global Reserve Core</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-[80px] font-[950] italic tracking-tighter leading-none selection:bg-emerald-500/30">
                    {formatMAD(cashBalance, false)}
                  </h2>
                  <div className="flex items-center gap-3 text-emerald-500/60 ml-2">
                     <ArrowUpRight size={16} />
                     <span className="text-[10px] font-black uppercase tracking-widest">+14.2% Neural Velocity</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-500 transition-all flex items-center gap-3 italic">
                    <Wallet size={14} /> Withdraw Funds
                  </button>
                  <button className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all italic">
                    Audit Ledger
                  </button>
                </div>
              </div>
              <div className="hidden xl:block">
                 <div className="w-32 h-32 bg-emerald-500/5 rounded-[40px] flex items-center justify-center text-emerald-500 border border-emerald-500/10 shadow-inner">
                   <PieChart size={64} className="animate-spin-slow" />
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[56px] p-10 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
           <div className="space-y-2">
             <div className="flex items-center justify-between mb-4">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Pipeline Alpha</p>
               <Activity size={18} className="text-blue-500" />
             </div>
             <h3 className="text-5xl font-[950] italic tracking-tighter text-blue-600 uppercase leading-none">
               {formatMAD(stats.pending, false)}
             </h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">In Transit Nodes</p>
           </div>
           <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden mt-8">
              <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
           </div>
        </div>

        <div className="bg-white rounded-[56px] p-10 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
           <div className="space-y-2">
             <div className="flex items-center justify-between mb-4">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Arrears Detection</p>
               <AlertCircle size={18} className="text-rose-500 animate-pulse" />
             </div>
             <h3 className="text-5xl font-[950] italic tracking-tighter text-rose-500 uppercase leading-none">
               {formatMAD(stats.overdue, false)}
             </h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Critical Signal Breach</p>
           </div>
           <button className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-500 hover:text-white transition-all">
             Initialize Recovery
           </button>
        </div>
      </div>

      {/* 2. MAIN ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-8 bg-white rounded-[64px] p-12 border border-slate-100 shadow-2xl space-y-12 min-h-[600px] relative overflow-hidden">
           <div className="flex items-center justify-between relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-blue-600">
                  <TrendingUp size={20} />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.5em]">Real-time Flow Analysis</h3>
                </div>
                <h3 className="text-4xl font-[950] italic uppercase tracking-tighter text-slate-900">Capital <span className="text-blue-600">Velocity</span></h3>
              </div>
              <div className="flex gap-2">
                 {['7D', '30D', '90D', 'ALL'].map(t => (
                   <button key={t} className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${t === '30D' ? 'bg-black text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{t}</button>
                 ))}
              </div>
           </div>

           <div className="h-[450px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '20px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-10">
           <FiscalCalendar />
           <div className="bg-blue-600 rounded-[48px] p-10 text-white space-y-8 relative overflow-hidden shadow-2xl flex-1 group">
              <div className="absolute bottom-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                <ShieldCheck size={160} />
              </div>
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                   <Zap size={20} />
                 </div>
                 <h4 className="text-xl font-[950] italic uppercase tracking-tighter">Neural Safeguard</h4>
              </div>
              <p className="text-xs font-bold leading-relaxed uppercase tracking-widest opacity-80">
                AI optimization is detecting a <span className="text-white font-black italic">14% margin leak</span> in your recurring cloud infrastructure costs.
              </p>
              <div className="pt-4">
                <button className="w-full py-5 bg-white text-blue-600 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-50 transition-all italic">
                   Resolve Discrepancy
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* 3. ARCHIVE GRID */}
      <div className="bg-white rounded-[64px] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-12 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl">
                 <FileText size={24} />
              </div>
              <div>
                <h3 className="text-3xl font-[950] italic uppercase tracking-tighter text-slate-900 leading-none">Financial <span className="text-blue-600">Registry</span></h3>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2 italic">Immutable Transaction Stream</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 group">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Filter transmissions..." 
                  className="w-full bg-slate-50 border border-slate-100 rounded-full py-4 pl-14 pr-6 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all font-bold italic"
                />
              </div>
              <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-black transition-all">
                 <Filter size={20} />
              </button>
              <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-black transition-all">
                 <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          {invoices.length === 0 && !loading ? (
             <div className="py-32 text-center space-y-6 opacity-30 italic">
               <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto border border-slate-100">
                 <Database size={40} className="text-slate-300" />
               </div>
               <p className="text-xs font-black uppercase tracking-widest text-slate-500">No telemetry detected in the financial stream.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-12 py-8">Entity Identity</th>
                  <th className="px-12 py-8">Signal Integrity</th>
                  <th className="px-12 py-8">Status</th>
                  <th className="px-12 py-8">Temporal Due</th>
                  <th className="px-12 py-8 text-right">Magnitude Lock</th>
                  <th className="px-12 py-8 text-right">Unit Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold text-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer">
                    <td className="px-12 py-10">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-black italic shadow-lg group-hover:rotate-12 transition-transform">
                             {inv.client_name?.[0] || 'N'}
                          </div>
                          <div className="min-w-0">
                             <span className="text-lg italic uppercase tracking-tight block truncate group-hover:text-blue-600 transition-colors">{inv.client_name || 'UNKNOWN_NODE'}</span>
                             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5 font-mono">#TX-{inv.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-12 py-10">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Verified Node</span>
                       </div>
                    </td>
                    <td className="px-12 py-10">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-12 py-10 text-[11px] uppercase tracking-widest text-slate-500">
                      <div className="flex items-center gap-3">
                         {inv.status === 'Overdue' ? <AlertCircle size={14} className="text-rose-500" /> : <Clock size={14} />}
                         {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'INDETERMINATE'}
                      </div>
                    </td>
                    <td className="px-12 py-10 text-right">
                       <div className="space-y-1">
                          <p className="text-2xl font-[950] italic tracking-tighter leading-none">{formatMAD(Number(inv.amount))}</p>
                       </div>
                    </td>
                    <td className="px-12 py-10 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-black shadow-sm transition-all hover:scale-110"><Download size={18} /></button>
                        <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm transition-all hover:scale-110"><MoreHorizontal size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FinanceTresorerie;
