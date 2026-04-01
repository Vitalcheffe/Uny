
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Wallet, Calendar, Building2, User, 
  Mail, Briefcase, Clock, ShieldCheck, Zap, 
  BrainCircuit, Sparkles, Activity, Lock, Heart
} from 'lucide-react';
import { UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface EmployeeDrawerProps {
  employee: UserProfile | null;
  onClose: () => void;
}

const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({ employee, onClose }) => {
  const { hasPermission } = useAuth();
  
  if (!employee) return null;

  // SECURITY PATCH: Strictly gate sensitive data
  const canSeeSensitive = hasPermission('rh', 'special');
  const salaryValue = employee.salary || (employee.metadata as any)?.salary;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-end pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        />
        <motion.div 
          initial={{ x: '100%' }} 
          animate={{ x: 0 }} 
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-xl h-screen bg-white shadow-2xl p-12 flex flex-col pointer-events-auto overflow-y-auto no-scrollbar"
        >
          <button 
            onClick={onClose} 
            className="absolute top-8 right-8 p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={24} />
          </button>

          <header className="mb-12 flex items-center gap-8">
            <div className="w-24 h-24 rounded-[32px] bg-slate-900 border-8 border-white shadow-2xl flex items-center justify-center text-4xl font-black text-white italic">
              {employee.full_name?.[0]}
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
                {employee.full_name}
              </h2>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
                   ID: {employee.id.slice(0, 10)}
                 </span>
                 {!employee.onboarding_completed && (
                   <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1">
                      <BrainCircuit size={10} /> GÉNÉRÉ PAR IA
                   </span>
                 )}
              </div>
            </div>
          </header>

          <div className="space-y-10 flex-1">
            <section className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Salaire Actuel</p>
                {canSeeSensitive ? (
                  <>
                    <p className="text-2xl font-[950] italic tracking-tighter text-emerald-600 leading-none">
                      {salaryValue ? `${Number(salaryValue).toLocaleString()} MAD` : '---'}
                    </p>
                    <div className="flex items-center gap-1.5 pt-2">
                      <Activity size={10} className="text-emerald-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Vérifié par le noyau</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 italic">
                    <Lock size={14} />
                    <span className="text-xs font-bold uppercase">Restreint</span>
                  </div>
                )}
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Niveau de Poste</p>
                <p className="text-xl font-black italic tracking-tighter text-slate-900 leading-none uppercase">
                  {(employee.metadata as any)?.job_title || employee.role}
                </p>
                <div className="flex items-center gap-1.5 pt-2">
                  <ShieldCheck size={10} className="text-blue-500" />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Habilitation active</span>
                </div>
              </div>
            </section>

            {canSeeSensitive && (
              <section className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 space-y-3">
                <div className="flex items-center gap-2 text-rose-600">
                  <Heart size={16} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Dossier Médical / Santé</h4>
                </div>
                <p className="text-xs font-bold text-slate-600 italic">
                  {employee.health_data || "Aucun marqueur de santé critique détecté lors de la dernière synchronisation."}
                </p>
              </section>
            )}

            <section className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Méta-Données Neuronales</h3>
               <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden divide-y divide-slate-50">
                  {[
                    { label: 'Department', value: (employee.metadata as any)?.department || 'Operations', icon: Building2 },
                    { label: 'Date d\'Embauche', value: (employee.metadata as any)?.hire_date ? new Date((employee.metadata as any).hire_date).toLocaleDateString('fr-FR') : '---', icon: Calendar },
                    { label: 'Seniority', value: (employee.metadata as any)?.seniority_years ? `${(employee.metadata as any).seniority_years} years` : '---', icon: Clock },
                    { label: 'Provisioning Method', value: (employee.metadata as any)?.extracted_via ? 'AI Automated' : 'Manual Entry', icon: Zap }
                  ].map((item, i) => (
                    <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-300">
                          <item.icon size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                      </div>
                      <span className="text-sm font-black italic text-slate-900 uppercase">{item.value}</span>
                    </div>
                  ))}
               </div>
            </section>

            {hasPermission('admin', 'write') && (
              <section className="bg-blue-600 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                  <Sparkles size={80} />
                </div>
                <div className="relative z-10 space-y-4">
                    <h4 className="text-xl font-black italic uppercase tracking-tighter">Intégration IA Prête</h4>
                    <p className="text-xs font-bold leading-relaxed uppercase tracking-widest opacity-80 max-w-[300px]">
                      Ce node a été créé via l'ingestion Honey Pot. Vous pouvez maintenant envoyer une invitation officielle pour activer le login de cet opérative.
                    </p>
                    <button className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-50 transition-all">
                      ACTIVER LA CONNEXION DU NŒUD
                    </button>
                </div>
              </section>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50 flex gap-4">
             <button className="flex-1 py-5 bg-black text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all italic">
                AUDIT DE PERFORMANCE
             </button>
             {hasPermission('rh', 'delete') && (
               <button className="px-8 py-5 bg-slate-50 text-slate-400 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:text-rose-500 transition-all">
                  ARCHIVER
               </button>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EmployeeDrawer;
