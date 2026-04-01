
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
const { useNavigate } = Router as any;
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../lib/supabase-data-layer';
import { toast } from 'sonner';
import { 
  ArrowRight, ArrowLeft, Loader2, LogOut,
  Building, Target, Briefcase, 
  Landmark, RefreshCcw, Clock, 
  Rocket, Sparkles, CheckCircle2
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Bienvenue.', desc: 'Parlez-nous de votre rôle.' },
  { id: 2, title: 'Votre Espace.', desc: 'Configurez votre entreprise.' },
  { id: 3, title: 'Modèle d\'Affaires.', desc: 'Comment générez-vous des revenus ?' },
  { id: 4, title: 'Prêt au Lancement.', desc: 'Votre environnement est configuré.' }
];

const ROLES = [
  { id: 'PDG', icon: Briefcase, desc: 'Direction générale' },
  { id: 'DAF', icon: Landmark, desc: 'Finance & Légal' },
  { id: 'Opérations', icon: Target, desc: 'Gestion de projet' },
  { id: 'Propriétaire d\'Agence', icon: Building, desc: 'Services & Clients' }
];

const BILLING_TYPES = [
  { id: 'RECURRING', label: 'Abonnement / MRR', icon: RefreshCcw, desc: 'Revenus récurrents' },
  { id: 'MILESTONE', label: 'Basé sur les Jalons', icon: Target, desc: 'Facturation à l\'avancement' },
  { id: 'TIME', label: 'Temps & Matériels', icon: Clock, desc: 'Facturation horaire' }
];

const OnboardingPage: React.FC = () => {
  const { user, profile, refreshProfile, profileLoaded, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: profile?.full_name?.split(' ')[0] || '',
    lastName: profile?.full_name?.split(' ')[1] || '',
    role: 'PDG',
    companyName: '',
    industry: 'TECH',
    teamSize: '1',
    currency: 'USD',
    billingType: 'RECURRING',
    primaryGoal: 'CASHFLOW',
    aiPreference: 'ASSISTED'
  });

  useEffect(() => {
    if (profileLoaded && profile?.onboarding_completed) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, profileLoaded, navigate]);

  const nextStep = () => {
    if (step === 1 && (!formData.firstName || !formData.lastName)) {
      toast.error("Veuillez entrer votre nom complet.", { position: 'top-right' });
      return;
    }
    if (step === 2 && !formData.companyName) {
      toast.error("Veuillez fournir le nom de votre entreprise.", { position: 'top-right' });
      return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const finishOnboarding = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const timestamp = Date.now().toString().slice(-4);
      const cleanSlug = formData.companyName.replace(/[^A-Za-z0-9]/g, '-').toUpperCase();
      const orgId = `${cleanSlug}-${timestamp}`;

      await firestoreService.setDocument('organizations', orgId, orgId, {
        name: formData.companyName,
        sector: formData.industry,
        team_size: formData.teamSize,
        currency: formData.currency,
        metadata: {
          billing_type: formData.billingType,
          primary_goal: formData.primaryGoal,
          ai_preference: formData.aiPreference
        }
      });

      if (!user) throw new Error("Aucun utilisateur authentifié trouvé.");

      await firestoreService.updateDocumentGlobal('profiles', user.id, {
        org_id: orgId,
        full_name: `${formData.firstName} ${formData.lastName}`,
        role: 'OWNER',
        onboarding_completed: true,
        metadata: {
          ...profile?.metadata,
          job_title: formData.role
        }
      });

      await refreshProfile();

      // Trigger Paddle Checkout
      if (window.Paddle) {
        window.Paddle.Initialize({ token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN });
        window.Paddle.Checkout.open({
          items: [{ priceId: 'pri_01j...', quantity: 1 }], // Placeholder priceId
          customer: { email: user?.email },
        });
      }

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Échec de la configuration de l'espace de travail. Veuillez réessayer.", { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = async () => {
    if (loading || !user) return;
    setLoading(true);
    try {
      await firestoreService.updateDocumentGlobal('profiles', user.id, {
        onboarding_completed: true,
        metadata: {
          ...profile?.metadata,
          onboarding_skipped: true
        }
      });
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue lors du passage de l'étape.", { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col font-sans text-slate-900">
      {/* Header Bar */}
      <div className="w-full px-12 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-950 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-950/20">
            <span className="font-bold italic text-lg">U</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-indigo-950">UNY</span>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-950 transition-colors"
        >
          <LogOut size={18} />
          <span>Quitter</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-3xl bg-white rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.06)] relative overflow-hidden"
        >
          {/* Elegant Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
            <motion.div 
              className="h-full bg-indigo-950"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          </div>

          <div className="p-12 sm:p-16">
            <div className="space-y-3 mb-12">
              <h1 className="text-3xl font-bold text-indigo-950 tracking-tight">
                {STEPS[step-1].title}
              </h1>
              <p className="text-lg text-slate-500 font-medium">
                {STEPS[step-1].desc}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Prénom</label>
                      <input 
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 outline-none transition-all font-medium text-base"
                        placeholder="Steve"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Nom</label>
                      <input 
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 outline-none transition-all font-medium text-base"
                        placeholder="Jobs"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-700">Votre Rôle</label>
                    <div className="grid grid-cols-2 gap-4">
                      {ROLES.map(r => {
                        const Icon = r.icon;
                        const isActive = formData.role === r.id;
                        return (
                          <button
                            key={r.id}
                            onClick={() => setFormData({...formData, role: r.id})}
                            className={`p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col gap-3 group relative ${
                              isActive 
                                ? 'border-indigo-950 bg-indigo-50/50 shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 hover:shadow-md bg-white'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                              isActive ? 'bg-indigo-950 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                            }`}>
                              <Icon size={20} />
                            </div>
                            <div>
                              <div className={`font-bold text-base ${isActive ? 'text-indigo-950' : 'text-slate-900'}`}>{r.id}</div>
                              <div className={`text-sm mt-0.5 ${isActive ? 'text-indigo-950/70' : 'text-slate-500'}`}>{r.desc}</div>
                            </div>
                            {isActive && (
                              <div className="absolute top-5 right-5 text-indigo-950">
                                <CheckCircle2 size={20} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">Nom Légal de l'Entreprise</label>
                    <input 
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      placeholder="Apple Inc."
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 outline-none transition-all font-medium text-base"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Secteur</label>
                      <select 
                        value={formData.industry}
                        onChange={(e) => setFormData({...formData, industry: e.target.value})}
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 outline-none transition-all font-medium text-base appearance-none"
                      >
                        <option value="TECH">Technologie / Logiciel</option>
                        <option value="AGENCY">Agence Créative</option>
                        <option value="RETAIL">E-commerce</option>
                        <option value="CONSULTING">Conseil</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Devise par Défaut</label>
                      <select 
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 outline-none transition-all font-medium text-base appearance-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="MAD">MAD (DH)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-700">Modèle de Revenus Principal</label>
                    <div className="grid grid-cols-1 gap-4">
                      {BILLING_TYPES.map(m => {
                        const Icon = m.icon;
                        const isActive = formData.billingType === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setFormData({...formData, billingType: m.id})}
                            className={`p-5 rounded-2xl border text-left transition-all duration-300 flex items-center gap-5 group relative ${
                              isActive 
                                ? 'border-indigo-950 bg-indigo-50/50 shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 hover:shadow-md bg-white'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                              isActive ? 'bg-indigo-950 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                            }`}>
                              <Icon size={24} />
                            </div>
                            <div>
                              <div className={`font-bold text-lg ${isActive ? 'text-indigo-950' : 'text-slate-900'}`}>{m.label}</div>
                              <div className={`text-sm mt-0.5 ${isActive ? 'text-indigo-950/70' : 'text-slate-500'}`}>{m.desc}</div>
                            </div>
                            {isActive && (
                              <div className="absolute right-6 text-indigo-950">
                                <CheckCircle2 size={24} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-8 text-center py-8">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-24 h-24 bg-indigo-950 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl"
                  >
                    <Rocket size={48} strokeWidth={1.5} />
                  </motion.div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight text-indigo-950">Prêt au décollage</h2>
                    <p className="text-lg text-slate-500 max-w-md mx-auto">
                      Votre espace de travail est configuré. Nous préparons votre tableau de bord et vos outils de gestion.
                    </p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left max-w-md mx-auto mt-8">
                    <div className="flex items-center gap-3 text-slate-400 mb-3">
                      <Sparkles size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">Résumé</span>
                    </div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                      Création de <span className="text-indigo-950 font-bold">{formData.companyName || 'votre entreprise'}</span> dans le secteur <span className="text-indigo-950 font-bold">{formData.industry}</span>.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between pt-10 mt-10 border-t border-slate-100">
              <button 
                onClick={prevStep}
                disabled={step === 1 || loading}
                className={`flex items-center gap-2 text-base font-semibold text-slate-400 transition-all duration-300 ${step === 1 ? 'opacity-0 pointer-events-none' : 'hover:text-indigo-950 hover:-translate-x-1'}`}
              >
                <ArrowLeft size={20} /> Retour
              </button>
              
              <div className="flex items-center gap-6">
                {step < 4 && (
                  <button
                    onClick={skipOnboarding}
                    disabled={loading}
                    className="text-slate-400 hover:text-indigo-950 font-semibold text-base transition-colors"
                  >
                    Passer
                  </button>
                )}
                {step < 4 ? (
                  <button 
                    onClick={nextStep}
                    className="px-8 py-4 bg-indigo-950 text-white rounded-2xl font-bold text-base hover:bg-indigo-900 transition-all duration-300 flex items-center gap-2"
                  >
                    Continuer <ArrowRight size={20} />
                  </button>
                ) : (
                  <button 
                    onClick={finishOnboarding}
                    disabled={loading}
                    className="px-10 py-4 bg-indigo-950 text-white rounded-2xl font-bold text-base hover:bg-indigo-900 transition-all duration-300 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Accéder au Dashboard'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;

