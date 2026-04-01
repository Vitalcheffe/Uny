/**
 * ⚡ UNY PROTOCOL: BILLING CONTROL (V1)
 * Description: Centre de contrôle financier multi-tenant.
 * Intégration simulée Stripe / Historique des factures.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-client';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  org_name: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  plan: string;
}

const BillingControl: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation de chargement des factures depuis Stripe/DB
    setTimeout(() => {
      setInvoices([
        { id: 'INV-001', org_name: 'Acme Corp', amount: 299.00, status: 'paid', date: '2024-03-01', plan: 'Enterprise' },
        { id: 'INV-002', org_name: 'Globex', amount: 149.00, status: 'pending', date: '2024-03-15', plan: 'Pro' },
        { id: 'INV-003', org_name: 'Soylent Corp', amount: 599.00, status: 'failed', date: '2024-03-10', plan: 'Elite' },
        { id: 'INV-004', org_name: 'Initech', amount: 299.00, status: 'paid', date: '2024-02-28', plan: 'Enterprise' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const forceBillingCycle = (orgName: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: `Déclenchement du cycle pour ${orgName}...`,
        success: `Cycle de facturation forcé pour ${orgName}.`,
        error: 'Échec du déclenchement.',
      }
    );
  };

  const generateCreditNote = (invoiceId: string) => {
    toast.success(`Avoir généré pour la facture ${invoiceId}.`);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            Billing <span className="text-emerald-500">Control</span>
          </h1>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.4em]">
            Financial Oversight Node v9.2
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-500">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/20">MRR Projection</p>
              <p className="text-lg font-black italic tracking-tighter">$42,890.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Revenue', value: '$1,240.00', icon: Clock, color: 'text-orange-500' },
          { label: 'Failed Payments', value: '$599.00', icon: AlertCircle, color: 'text-rose-500' },
          { label: 'Active Subscriptions', value: '124', icon: Zap, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px] flex items-center justify-between shadow-xl">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{stat.label}</p>
              <p className="text-3xl font-black italic tracking-tighter">{stat.value}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={28} />
            </div>
          </div>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest">Master Ledger</h3>
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
            <Download size={14} />
            Export CSV
          </button>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02]">
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30">Invoice ID</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30">Organization</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30">Amount</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30">Status</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30">Plan</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-20 text-center">
                  <RefreshCw className="animate-spin text-emerald-500 mx-auto" size={32} />
                </td>
              </tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-white/[0.01] transition-colors">
                <td className="p-6">
                  <span className="font-mono text-xs text-white/40">{inv.id}</span>
                </td>
                <td className="p-6">
                  <p className="text-sm font-black uppercase tracking-tight">{inv.org_name}</p>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{inv.date}</p>
                </td>
                <td className="p-6">
                  <span className="text-sm font-black italic tracking-tighter">${inv.amount.toFixed(2)}</span>
                </td>
                <td className="p-6">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 
                    inv.status === 'pending' ? 'bg-orange-500/10 text-orange-500' : 
                    'bg-rose-500/10 text-rose-500'
                  }`}>
                    {inv.status === 'paid' ? <CheckCircle2 size={10} /> : 
                     inv.status === 'pending' ? <Clock size={10} /> : 
                     <AlertCircle size={10} />}
                    {inv.status}
                  </div>
                </td>
                <td className="p-6">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{inv.plan}</span>
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => generateCreditNote(inv.id)}
                      className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all"
                    >
                      Credit Note
                    </button>
                    <button 
                      onClick={() => forceBillingCycle(inv.org_name)}
                      className="p-2 bg-white/5 hover:bg-emerald-600/20 hover:text-emerald-500 rounded-lg transition-all"
                      title="Force Cycle"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingControl;
