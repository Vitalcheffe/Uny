
import React, { useState } from 'react';
import { motion as _motion, AnimatePresence } from 'motion/react';
import { UserPlus, Mail, Shield, Check, Loader2, X, Info, ChevronRight, Zap } from 'lucide-react';
import { firestoreService } from '../../lib/supabase-data-layer';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

const motion = _motion as any;

// Fix: Added missing roles to ROLE_DATA to match UserRole definition and resolve exhaustiveness error
const ROLE_DATA: Record<UserRole, { title: string, desc: string, color: string }> = {
  OWNER: { title: 'Owner', desc: 'Total control. Accès API, facturation et suppression de l\'organisation.', color: 'text-rose-600' },
  SUPER_ADMIN: { title: 'Super Admin', desc: 'Orchestration d\'entreprise. Inter-unit supervision et accès infrastructure.', color: 'text-rose-700' },
  ADMIN: { title: 'Admin', desc: 'Full operations. Ne peut pas supprimer l\'organisation ou changer de forfait.', color: 'text-rose-500' },
  MANAGER: { title: 'Manager', desc: 'Gestion d\'équipe. Project supervision et des membres de l\'équipe.', color: 'text-indigo-500' },
  EMPLOYEE: { title: 'Employé', desc: 'Standard member. Access to basic tools et aux projets assignés.', color: 'text-slate-500' },
  FINANCE_CONTROLLER: { title: 'Financial Controller', desc: 'Accounting Focus & Trésorerie. Bank reconciliation access.', color: 'text-emerald-600' },
  DIR_RH: { title: 'HR Director', desc: 'Strategic human capital control. Full vault access et à la conformité.', color: 'text-blue-700' },
  HR_MANAGER: { title: 'HR Manager', desc: 'Employee vault access. Payroll, contracts and health data.', color: 'text-blue-600' },
  OPS_MANAGER: { title: 'Operations Manager', desc: 'Project flow master. Full mission control et documents.', color: 'text-indigo-600' },
  LEGAL_COUNSEL: { title: 'Legal Counsel', desc: 'Sovereignty Focus. Document review et contrats avec accès aux risques Sentinel.', color: 'text-purple-600' },
  CONTRIBUTOR: { title: 'Contributor', desc: 'Input only. Uploads documents et consulte les projets assignés.', color: 'text-slate-600' },
  AUDITOR: { title: 'Auditor', desc: 'Read-only visibility. Strategic review sans pouvoir de modification.', color: 'text-slate-500' },
  GUEST: { title: 'Guest', desc: 'Restricted partner. Access to specific files only.', color: 'text-slate-400' },
  OPERATIVE: { title: 'Operative', desc: 'Unité standard. Integrated via AI or manual input.', color: 'text-slate-600' },
  CLIENT_VIP: { title: 'VIP Client', desc: 'Premium external access. Views projects et les shared financial nodes.', color: 'text-amber-600' },
};

const InviteMember: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const { orgId } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('CONTRIBUTOR');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !orgId) return;

    setLoading(true);
    try {
      await firestoreService.addDocument('invitations', orgId, {
        email,
        role,
        status: 'pending',
        token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        created_at: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setEmail('');
      }, 2000);
    } catch (err) {
      console.error("Invite failure:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1a1615]/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[64px] p-12 md:p-16 shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row gap-16"
          >
            <button onClick={onClose} className="absolute top-10 right-10 p-3 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>

            {/* Left: Configuration */}
            <div className="flex-1 space-y-10">
              <header className="space-y-4">
                <div className="flex items-center gap-4 text-blue-600">
                  <UserPlus size={28} />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Provisionnement de Nœud</span>
                </div>
                <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
                  AJOUTER <br /> <span className="text-blue-500">MEMBRE</span>
                </h2>
              </header>

              <form onSubmit={handleInvite} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Destination Neuronale (Email)</label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="commander@nexus.io"
                      className="w-full pl-16 pr-8 py-6 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-lg"
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading || success}
                  className="w-full py-6 bg-black text-white rounded-[28px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 italic active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : success ? <Check size={20} /> : (
                    <>
                      <Zap size={18} fill="currentColor" /> AUTORISER LE LIEN
                    </>
                  )}
                </button>
              </form>

              <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-4">
                 <Shield size={20} className="text-slate-400" />
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed italic">
                   The encrypted handshake protocol will be sent to the recipient via the UNY kernel.
                 </p>
              </div>
            </div>

            {/* Right: Role Matrix */}
            <div className="flex-1 bg-slate-50 rounded-[48px] p-10 flex flex-col">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Access Level Calibration</h3>
               
               <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar pr-2">
                  {(Object.entries(ROLE_DATA) as [UserRole, any][]).map(([key, data]) => (
                    <button
                      key={key}
                      onClick={() => setRole(key)}
                      className={`w-full p-6 rounded-3xl text-left transition-all border group relative ${
                        role === key 
                        ? 'bg-white border-blue-500 shadow-xl scale-[1.02]' 
                        : 'bg-transparent border-transparent hover:bg-white/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${data.color}`}>{data.title}</span>
                        {role === key && <Check size={14} className="text-blue-500" />}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 leading-tight pr-8 uppercase tracking-tighter">
                        {data.desc}
                      </p>
                      {role === key && <div className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-500 opacity-20"><ChevronRight size={24} /></div>}
                    </button>
                  ))}
               </div>

               <div className="mt-8 pt-8 border-t border-slate-200">
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-widest italic">
                     <Info size={14} className="text-blue-500" />
                     <span>Capacité : {role.replace('_', ' ')}</span>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InviteMember;
