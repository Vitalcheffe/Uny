
import React, { useState, useEffect } from 'react';
import { motion as _motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Users, ShieldAlert, Heart, Wallet, Loader2, Lock } from 'lucide-react';

// Fix: Cast motion to any to resolve property 'initial' does not exist error on motion components
const motion = _motion as any;

export const RHModule: React.FC = () => {
  const { profile, orgId, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    if (!orgId) return;
    setLoading(true);

    try {
      // ÉTAPE 1 : Données publiques (Toujours sûr)
      const { data: publicData, error: pubError } = await supabase
        .from('profiles')
        .select('id, full_name, role, onboarding_completed')
        .eq('org_id', orgId);

      if (pubError) throw pubError;

      let mergedData = publicData || [];

      // ÉTAPE 2 : Données sensibles gated by centralized RBAC
      const canSeeSensitive = hasPermission('rh', 'special');
      
      if (canSeeSensitive) {
        const { data: sensitiveData, error: sensError } = await (supabase as any)
          .from('profiles')
          .select('id, salary, health_data')
          .eq('org_id', orgId);

        if (!sensError && sensitiveData) {
          mergedData = mergedData.map(emp => {
            const sens = sensitiveData.find(s => s.id === emp.id);
            return sens ? { ...emp, ...sens } : emp;
          });
        }
      }

      setEmployees(mergedData);
    } catch (err) {
      console.error("RH Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [orgId]);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between mb-16">
        <div>
          <h2 className="text-5xl font-heading italic titanium-text uppercase tracking-tighter">Capital Humain</h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.5em] mt-4">Silo de Gestion Opérationnelle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-brand-cobalt" size={48} /></div>
        ) : (
          employees.map(emp => (
            <motion.div 
              key={emp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-surgical border-white/5 bg-brand-anthracite/20 p-8 rounded-[2.5rem] flex items-center justify-between group hover:border-brand-cobalt/30 transition-all"
            >
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-brand-cobalt/10 rounded-2xl flex items-center justify-center text-brand-cobalt text-2xl font-black italic border border-brand-cobalt/20">
                  {emp.full_name?.[0] || 'U'}
                </div>
                <div>
                  <div className="text-xl font-heading text-white uppercase tracking-tight">{emp.full_name}</div>
                  <div className="text-[9px] font-black text-brand-cobalt uppercase tracking-widest mt-1">{emp.role}</div>
                </div>
              </div>

              <div className="flex items-center gap-12">
                {/* Bloc Salaire : Si absent (filtré par centralized logic), on affiche un verrou */}
                <div className="text-right">
                  <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
                    <Wallet size={10} /> Rémunération
                  </div>
                  <div className="text-lg font-mono font-bold text-white italic">
                    {emp.salary ? `${emp.salary.toLocaleString()} MAD` : <Lock size={14} className="text-gray-800 ml-auto" />}
                  </div>
                </div>

                {/* Bloc Santé */}
                <div className="text-right">
                  <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
                    <Heart size={10} /> Dossier Médical
                  </div>
                  <div className="text-xs font-bold text-brand-emerald">
                    {emp.health_data ? emp.health_data : <Lock size={14} className="text-gray-800 ml-auto" />}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="p-10 glass-surgical border-brand-cobalt/20 bg-brand-cobalt/5 rounded-[3rem] flex items-center gap-8">
         <ShieldAlert size={32} className="text-brand-cobalt" />
         <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-2">Sécurité des Données N4</h4>
            <p className="text-[9px] text-gray-600 uppercase font-bold leading-relaxed tracking-widest">
               Les attributs 'Salary' et 'Health' sont protégés par RLS au niveau du Kernel Supabase et par le protocole RBAC UNY. 
               Aucune donnée sensible n'est transmise au client sans token JWT valide DIR_RH, SUPER_ADMIN ou OWNER.
            </p>
         </div>
      </div>
    </div>
  );
};
