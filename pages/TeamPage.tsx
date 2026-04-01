
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Search, Loader2, Sparkles, Zap, 
  ChevronRight, Filter, Database, BrainCircuit, Wallet, Calendar, X,
  MoreVertical, User, Shield, UserX, AlertTriangle, Layers, Box, Plus, 
  RotateCcw, Activity, ShieldCheck, Heart, Mail, Landmark, Network,
  FileText
} from 'lucide-react';
import { firestoreService } from '../lib/firestore-service';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import EmployeeDrawer from '../components/team/EmployeeDrawer';
import TeamOrganigram3D from '../components/team/TeamOrganigram3D';
import InviteMember from '../components/team/InviteMember';
import SourceModal from '../components/SourceModal';

const motion = _motion as any;

const TrustScore = ({ score }: { score: number }) => {
  const color = score > 80 ? 'text-emerald-500' : score > 50 ? 'text-blue-500' : 'text-rose-500';
  return (
    <div className="flex items-center gap-2">
       <div className={`text-[10px] font-black italic tracking-tighter ${color}`}>{score}% confiance IA</div>
    </div>
  );
};

const TeamPage: React.FC = () => {
  const { orgId, profile, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDepartment, setActiveDepartment] = useState('Tous les services');
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<'list' | '3d'>('list');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [salarySources, setSalarySources] = useState<Record<string, any>>({});
  const [activeSourceAtom, setActiveSourceAtom] = useState<any>(null);

  const fetchTeam = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await firestoreService.getCollection('profiles', orgId, [], 'full_name', 'asc');
      setEmployees(data as UserProfile[] || []);

      // FETCH NEURAL SOURCES (SALARY ATOMS)
      const atoms = await firestoreService.getCollection('knowledge_atoms', orgId, [
        { field: 'entity_type', operator: '==', value: 'salary' },
        { field: 'validation_status', operator: '==', value: 'approved' }
      ]);

      const sourceMap: Record<string, any> = {};
      atoms?.forEach(a => {
        // Find owner by parsing key or value context (simplified for demo)
        const owner = (data as UserProfile[])?.find(e => (a as any).value_text?.toLowerCase().includes(e.full_name?.toLowerCase() || ''));
        if (owner) sourceMap[owner.id] = a;
      });
      setSalarySources(sourceMap);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.metadata as any)?.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = activeDepartment === 'Tous les services' || 
                         (e.metadata as any)?.department?.toLowerCase() === activeDepartment.toLowerCase();
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, activeDepartment]);

  const totalSalary = useMemo(() => employees.reduce((s, e) => s + (e.salary || 0), 0), [employees]);
  const avgSalary = useMemo(() => employees.length > 0 ? Math.round(totalSalary / employees.length) : 0, [employees, totalSalary]);
  
  const departments = useMemo(() => {
    const depts = new Set<string>(['Tous les services']);
    employees.forEach(e => {
      const d = (e.metadata as any)?.department;
      if (d) depts.add(d);
    });
    return Array.from(depts);
  }, [employees]);

  const handleRevoke = async (empId: string) => {
    if (!orgId) return;
    try {
      await firestoreService.updateDocument('profiles', orgId, empId, { status: 'inactive' });
      fetchTeam();
    } catch (err) {
      console.error("Revoke failure:", err);
    }
  };

  const canInvite = hasPermission('admin', 'write');

  return (
    <div className="space-y-12 max-w-[1700px] mx-auto pb-24 relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Équipe
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Gérez les membres de votre organisation
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-1">
            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-black text-white shadow-lg' : 'text-slate-400 hover:text-black hover:bg-slate-50'}`}>
              <Layers size={18} />
            </button>
            <button onClick={() => setViewMode('3d')} className={`p-2.5 rounded-xl transition-all ${viewMode === '3d' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-black hover:bg-slate-50'}`}>
              <Box size={18} />
            </button>
          </div>
          {canInvite && (
            <button onClick={() => setIsInviteOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 shadow-xl transition-all italic shrink-0">
              <Plus size={16} /> Nouveau
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         {[
           { label: 'Effectif Total', value: employees.length, sub: 'collaborateurs actifs', icon: Users, color: 'text-blue-500' },
           { label: 'Masse Salariale', value: totalSalary.toLocaleString() + ' €', sub: 'annuel brut', icon: Wallet, color: 'text-emerald-500' },
           { label: 'Salaire Moyen', value: avgSalary.toLocaleString() + ' €', sub: 'brut annuel', icon: Landmark, color: 'text-purple-500' },
           { label: 'Organigramme', value: 'Voir', sub: "structure de l'équipe", icon: Network, color: 'text-blue-500', onClick: () => setViewMode('3d') }
         ].map((s, i) => (
           <div 
            key={i} 
            onClick={s.onClick}
            className={`bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4 ${s.onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all group' : ''}`}
           >
              <div className={`p-3 bg-slate-50 rounded-xl w-fit ${s.color} ${s.onClick ? 'group-hover:bg-blue-600 group-hover:text-white transition-colors' : ''}`}>
                <s.icon size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                 <p className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">{s.value}</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.sub}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white/50 p-4 rounded-[32px] border border-slate-100 backdrop-blur-sm">
        <div className="relative group w-full md:w-96">
          <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" placeholder="Rechercher un collaborateur..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-100 shadow-sm rounded-full py-3.5 pl-12 pr-6 text-xs outline-none focus:ring-4 focus:ring-blue-500/10 font-bold italic"
          />
        </div>
        <select 
          value={activeDepartment}
          onChange={(e) => setActiveDepartment(e.target.value)}
          className="bg-white border border-slate-100 rounded-full px-6 py-3.5 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer italic"
        >
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
        ) : viewMode === '3d' ? (
          <TeamOrganigram3D employees={employees} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEmployees.map((emp) => {
              const salarySource = salarySources[emp.id];
              return (
                <motion.div 
                  key={emp.id}
                  whileHover={{ scale: 1.02, y: -8 }}
                  onClick={() => setSelectedEmployee(emp)}
                  className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm cursor-pointer group relative overflow-hidden flex flex-col gap-6"
                >
                  <div className="flex justify-between items-start">
                     <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-black italic group-hover:rotate-6 transition-transform shadow-2xl">
                        {emp.full_name?.[0]}
                     </div>
                     <div className="flex flex-col items-end gap-2">
                       <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                         {(emp.metadata as any)?.department || 'DIRECTION'}
                       </div>
                       {salarySource && (
                         <div 
                          className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase border border-emerald-100 shadow-sm animate-pulse"
                          onClick={(e) => { e.stopPropagation(); setActiveSourceAtom(salarySource); }}
                         >
                            <ShieldCheck size={10} /> VÉRIFIÉ
                         </div>
                       )}
                     </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{emp.full_name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                      {(emp.metadata as any)?.job_title || emp.role.replace('_', ' ')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Mail size={14} />
                      <span className="text-xs font-bold truncate">{(emp as any).email || `${emp.full_name?.toLowerCase().replace(' ', '.')}@sentinel.fr`}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Wallet size={14} className="text-emerald-500" />
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-slate-900">{(emp.salary || 50000).toLocaleString()} €</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">/an brut</span>
                          </div>
                       </div>
                       {salarySource && (
                         <div 
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                          title={`Source : ${salarySource.source_document?.file_name}`}
                          onClick={(e) => { e.stopPropagation(); setActiveSourceAtom(salarySource); }}
                        >
                            <FileText size={16} />
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="mt-4 pt-6 border-t border-slate-50 flex items-center justify-between">
                     <TrustScore score={salarySource ? salarySource.confidence_score : 95} />
                     <div className="flex items-center gap-2">
                       <button onClick={(e) => { e.stopPropagation(); handleRevoke(emp.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Révocation">
                         <UserX size={18} />
                       </button>
                       <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                     </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <EmployeeDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      <InviteMember isOpen={isInviteOpen} onClose={() => { setIsInviteOpen(false); fetchTeam(); }} />
      <SourceModal atom={activeSourceAtom} isOpen={!!activeSourceAtom} onClose={() => setActiveSourceAtom(null)} />
    </div>
  );
};

export default TeamPage;
