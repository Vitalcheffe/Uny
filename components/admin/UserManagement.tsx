/**
 * ⚡ UNY PROTOCOL: USER MANAGEMENT COMPONENT (V1)
 * Description: Gestion des employés d'une organisation spécifique.
 * Fonctions: Reset Password, Edit Role.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-client';
import { 
  Shield, 
  Key, 
  Mail, 
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../../types/auth';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface UserManagementProps {
  organizationId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ organizationId }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees((data as any[]) || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Erreur employés: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const forcePasswordReset = async (employee: Employee) => {
    const newPassword = Math.random().toString(36).slice(-10) + 'A1!';
    
    try {
      // Appel de la fonction RPC admin_reset_password
      const { error } = await (supabase as any).rpc('admin_reset_password', {
        target_user_id: employee.id,
        new_password: newPassword
      });

      if (error) throw error;

      toast.success(`Password réinitialisé pour ${employee.full_name}.`);
      // In production, show new password or send via email
      alert(`Nouveau mot de passe généré: ${newPassword}\n(À transmettre manuellement à l'utilisateur)`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Failure du reset: ${message}`);
    }
  };

  const updateRole = async (employee: Employee, newRole: string) => {
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ role: newRole })
        .eq('id', employee.id);

      if (error) throw error;

      toast.success(`Rôle de ${employee.full_name} mis à jour en ${newRole}.`);
      fetchEmployees();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Erreur rôle: ${message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <Activity className="animate-spin text-blue-500 mx-auto" size={24} />
          </div>
        ) : employees.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">No employees found in this node.</p>
          </div>
        ) : employees.map((emp) => (
          <div key={emp.id} className="bg-white/[0.03] border border-white/5 p-6 rounded-[32px] space-y-4 hover:border-white/10 transition-all group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center font-black text-xs border border-white/10">
                  {emp.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight truncate max-w-[120px]">{emp.full_name}</p>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                    <Mail size={10} />
                    <span className="truncate max-w-[100px]">{emp.email}</span>
                  </div>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                emp.role === UserRole.ORG_ADMIN ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
              }`}>
                {emp.role}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
              <button 
                onClick={() => forcePasswordReset(emp)}
                className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
              >
                <Key size={12} />
                Reset
              </button>
              
              <div className="relative group/menu">
                <button className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                  <Shield size={12} />
                  Role
                </button>
                <div className="absolute bottom-full left-0 w-full mb-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden opacity-0 group-hover/menu:opacity-100 pointer-events-none group-hover/menu:pointer-events-auto transition-all z-10 shadow-2xl">
                  {[UserRole.USER, UserRole.MANAGER, UserRole.ORG_ADMIN].map((role) => (
                    <button 
                      key={role}
                      onClick={() => updateRole(emp, role)}
                      className="w-full p-3 text-[8px] font-black uppercase tracking-widest text-left hover:bg-blue-600 hover:text-white transition-all border-b border-white/5 last:border-0"
                    >
                      Set {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
