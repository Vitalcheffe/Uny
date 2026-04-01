import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { firestoreService } from '../lib/firestore-service';
import { Plus, X, Loader2, Zap, Building2, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CreateOrganizationProps {
  onSuccess: () => void;
}

const CreateOrganization: React.FC<CreateOrganizationProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', type: 'Santé' });

  if (user?.email !== 'amineharchelkorane5@gmail.com') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orgId = crypto.randomUUID();
      
      // 1. Create Organization
      await firestoreService.addDocumentGlobal('organizations', {
        id: orgId,
        name: formData.name,
        type: formData.type,
        status: 'ACTIVE',
        config: {
          storage_limit: 5,
          modules: {
            finance: true,
            hr: true,
            legal: true,
            projects: true
          }
        }
      });
      
      // 2. Create Admin Profile Placeholder
      await firestoreService.addDocumentGlobal('profiles', {
        organization_id: orgId,
        email: formData.email,
        role: 'TENANT_ADMIN',
        full_name: `Admin ${formData.name}`,
        status: 'PENDING_ONBOARDING'
      });

      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="flex items-center gap-3 px-8 py-4 bg-indigo-950 text-white rounded-2xl font-bold text-sm hover:bg-indigo-900 transition-all shadow-lg shadow-indigo-950/20"
      >
        <Plus size={16} /> 
        Déployer une Mission
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsOpen(false)} 
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-12 border border-slate-100 shadow-2xl overflow-hidden"
            >
              <div className="relative z-10 space-y-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-indigo-950">
                      <Building2 size={32} />
                      <h2 className="text-3xl font-bold tracking-tight">Nouvelle Mission</h2>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Provisionnement d'Entité</p>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Nom de l'Organisation</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                          type="text" 
                          required 
                          placeholder="ex: Clinique Al-Amal"
                          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 outline-none transition-all font-medium text-base text-slate-900" 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Email Contact Admin</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                          type="email" 
                          required 
                          placeholder="admin@organisation.ma"
                          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 outline-none transition-all font-medium text-base text-slate-900" 
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Type d'Organisation</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select 
                          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 outline-none transition-all font-medium text-base text-slate-900 appearance-none" 
                          value={formData.type} 
                          onChange={e => setFormData({...formData, type: e.target.value})}
                        >
                          <option value="Santé">Santé</option>
                          <option value="Juridique">Juridique</option>
                          <option value="Finance">Finance</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-4 bg-indigo-950 text-white rounded-2xl font-bold text-sm hover:bg-indigo-900 transition-all shadow-lg shadow-indigo-950/20 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                    Déclencher le Déploiement
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateOrganization;
