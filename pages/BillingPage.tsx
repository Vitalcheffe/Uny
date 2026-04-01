
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, CheckCircle2, Zap, ArrowRight, 
  Landmark, ShieldCheck, Download, Activity, 
  BrainCircuit, Globe, Layers, Database, Loader2,
  Clock, TrendingDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../lib/supabase-data-layer';
import { Organization } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  timestamp: string; // Changed from Timestamp to string
}

const BillingPage: React.FC = () => {
  const { orgId, profile } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  
  useEffect(() => {
    const fetchOrgDetails = async () => {
      if (!orgId) return;
      try {
        const data = await firestoreService.getDocument('organizations', orgId, orgId);
        setOrg(data as Organization);
      } catch (err) {
        console.error("Billing Org Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgDetails();

    if (orgId) {
      const unsubscribe = firestoreService.subscribeToCollectionGlobal(
        'credit_transactions',
        [{ field: 'organization_id', operator: '==', value: orgId }],
        (data) => {
          setTransactions(data as CreditTransaction[]);
        },
        'timestamp',
        'desc'
      );
      return () => unsubscribe();
    }
  }, [orgId]);

  // Calibration against top-level columns instead of metadata nesting
  const trialEndsAt = new Date(org?.trial_ends_at || Date.now());
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  
  const subscriptionStatus = org?.subscription_status || 'trialing';
  const isTrialing = subscriptionStatus === 'trialing';
  const isActive = subscriptionStatus === 'active';

  const totalCreditsUsed = transactions.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  const initiateLicense = async () => {
    setActionLoading(true);
    console.debug('🛡️ [Billing] Initializing commercial handshake sequence.');
    
    try {
      // Import dynamically to avoid issues if not used
      const { PaddleService } = await import('../lib/paddle-service');
      await PaddleService.openCheckout('pri_01jxxxxxxxxx', orgId!, profile?.email); // Replace with real Paddle Price ID
    } catch (error) {
      console.error('Checkout Error:', error);
      alert('Failed to initialize checkout. Ensure Paddle environment nodes are active.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 py-16 px-6 pb-32">
      <header className="space-y-4">
        <div className="flex items-center gap-4 text-emerald-500">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <Landmark size={24} />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Financial <span className="text-emerald-500">Licensing</span>
          </h1>
        </div>
        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.5em] ml-16 italic">Subscription & Usage Calibration</p>
      </header>

      {/* SUBSCRIPTION STATUS CARD */}
      <div className="bg-white border border-slate-100 rounded-[56px] p-16 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-[10s] pointer-events-none">
          <ShieldCheck size={400} />
        </div>

        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-12 relative z-10">
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                UNY Enterprise <span className="text-blue-600">Core</span>
              </h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Full-stack cognitive infrastructure for elite organizations
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                 <p className="text-[120px] font-[950] italic tracking-tighter leading-none text-slate-900">$499</p>
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">Authorized / Month</p>
              </div>
              <div className="h-20 w-px bg-slate-100" />
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Unlimited Knowledge Nodes</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Advanced Forensic AI</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Full Neural Matrix Export</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="w-full xl:w-[400px] flex flex-col gap-6">
             {isTrialing ? (
               <div className="p-10 bg-amber-50 rounded-[40px] border border-amber-100 space-y-6 shadow-xl shadow-amber-500/5">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 italic">Trial Signal Active</p>
                     <Zap size={14} className="text-amber-500 animate-pulse" fill="currentColor" />
                  </div>
                  <p className="text-4xl font-black italic tracking-tighter text-amber-700 leading-none">{daysRemaining} DAYS <span className="text-sm">LEFT</span></p>
                  <p className="text-[11px] font-bold text-amber-900/60 leading-relaxed uppercase tracking-widest">Residue of your calibration phase.</p>
                  <button 
                    onClick={initiateLicense}
                    disabled={actionLoading}
                    className="w-full py-6 bg-[#1A1615] hover:bg-black text-white rounded-[28px] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl shadow-black/20 italic flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={18} /> : (
                      <>Authorize License <ArrowRight size={16} /></>
                    )}
                  </button>
               </div>
             ) : (
               <div className="p-10 bg-emerald-50 rounded-[40px] border border-emerald-100 space-y-6">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Operational License</p>
                     <ShieldCheck size={18} className="text-emerald-500" />
                  </div>
                  <p className="text-4xl font-black italic tracking-tighter text-emerald-700 leading-none uppercase">{subscriptionStatus}</p>
                  <p className="text-[11px] font-bold text-emerald-900/60 leading-relaxed uppercase tracking-widest italic">
                    Renewal Protocol: {org?.current_period_end ? new Date(org.current_period_end).toLocaleDateString() : 'Auto (Monthly)'}
                  </p>
                  <button className="w-full py-6 bg-white border-2 border-slate-200 text-slate-900 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] hover:border-slate-900 transition-all italic">
                    Manage Handshake
                  </button>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* AI USAGE TRACKING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-sm space-y-10">
            <header className="flex items-center justify-between">
               <div className="flex items-center gap-4 text-blue-600">
                  <BrainCircuit size={24} />
                  <h3 className="text-lg font-black italic uppercase tracking-tighter">AI Compute Nodes</h3>
               </div>
            </header>
            <div className="space-y-6">
               <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Crédits Consommés (Période)</p>
                  <p className="text-2xl font-black italic tracking-tighter text-slate-900">{totalCreditsUsed.toLocaleString()} <span className="text-[10px] text-slate-400">UNY CREDITS</span></p>
               </div>
               <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (totalCreditsUsed / 5000) * 100)}%` }}
                    className="h-full bg-blue-600 shadow-[0_0_15px_#3b82f640]"
                  />
               </div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed italic">
                 Standard nodes are included. Excess payloads are authorized at $0.50/unit per surgical scan.
               </p>
            </div>
         </div>

         <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-sm space-y-10">
            <header className="flex items-center justify-between">
               <div className="flex items-center gap-4 text-slate-900">
                  <CreditCard size={24} />
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Payment Infrastructure</h3>
               </div>
            </header>
            {isActive ? (
              <div className="flex items-center gap-8 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                 <div className="w-16 h-10 bg-[#1A1615] rounded-lg flex items-center justify-center text-white italic font-black text-xs shadow-inner">VISA</div>
                 <div className="flex-1">
                    <p className="text-lg font-black italic tracking-tight text-slate-900">•••• 4242</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1 italic">Authorized Card (Exp: 12/28)</p>
                 </div>
                 <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Update</button>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 opacity-30 italic">
                 <ShieldCheck size={48} className="text-slate-300" />
                 <p className="text-[11px] font-black uppercase tracking-widest">No payment nodes registered in the matrix.</p>
              </div>
            )}
         </div>
      </div>

      {/* BILLING HISTORY */}
      <div className="bg-white border border-slate-100 rounded-[56px] overflow-hidden shadow-2xl">
        <div className="p-12 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-slate-50 rounded-3xl text-slate-900 shadow-inner">
                 <Database size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Handshake Registry</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1 italic">Archival Ledger of Transactions</p>
              </div>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-12 py-8">Temporal Signal</th>
                <th className="px-12 py-8">Handshake ID</th>
                <th className="px-12 py-8">Magnitude</th>
                <th className="px-12 py-8">Integrity</th>
                <th className="px-12 py-8 text-right">Node Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold text-slate-800 italic">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center space-y-4 opacity-10 italic">
                    <Layers size={64} className="mx-auto" />
                    <p className="text-xl font-black uppercase">No transactions detected in the matrix.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                    <td className="px-12 py-8 uppercase tracking-tighter">
                      {tx.timestamp ? format(new Date(tx.timestamp), 'MMM dd, yyyy', { locale: fr }) : 'PENDING'}
                    </td>
                    <td className="px-12 py-8 font-mono text-[10px] text-slate-400">
                      {tx.id.toUpperCase().slice(0, 12)}...
                    </td>
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={14} className="text-rose-500" />
                        <span className="text-lg font-black tracking-tighter">{tx.amount} CREDITS</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">{tx.description}</p>
                    </td>
                    <td className="px-12 py-8">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Verified</span>
                    </td>
                    <td className="px-12 py-8 text-right">
                       <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-black transition-all shadow-sm">
                          <Download size={18} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
