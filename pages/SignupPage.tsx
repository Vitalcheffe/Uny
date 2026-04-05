import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  Check, AlertCircle, Sparkles, Building2, User
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    role: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          company_name: formData.companyName,
          role: formData.role || 'USER'
        }
      }
    });
    
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else if (data.user) {
      // Create organization if company name provided
      if (formData.companyName) {
        await supabase.from('organizations').insert({
          name: formData.companyName,
          plan: 'starter'
        });
      }
      
      // Show success or go to dashboard
      if (data.session) {
        navigate('/dashboard');
      } else {
        setMagicLinkSent(true);
      }
    }
    setLoading(false);
  };
  
  const handleMagicLink = async () => {
    if (!formData.email) {
      setError('Entrez votre email d\'abord');
      return;
    }
    setLoading(true);
    setError(null);
    
    const { error: magicError } = await supabase.auth.signInWithOtp({
      email: formData.email,
      options: {
        emailRedirectTo: window.location.origin + '/dashboard'
      }
    });
    
    if (magicError) {
      setError(magicError.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };
  
  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Vérifiez votre email
          </h1>
          <p className="text-white/60 mb-8">
            Nous avons envoyé un lien de confirmation à <span className="text-white">{formData.email}</span>.
            Cliquez sur le lien pour activer votre compte.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la connexion
          </Link>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center p-6">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
      </div>
      
      {/* Back Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Accueil
      </Link>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">U</span>
            </div>
          </Link>
        </div>
        
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Créer votre compte
            </h1>
            <p className="text-white/60">
              Commencez gratuitement en 30 secondes
            </p>
          </div>
          
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all ${
                  step >= s ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white/10'
                }`} />
              </div>
            ))}
          </div>
          
          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
          
          {step === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Email professionnel</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="vous@entreprise.com"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
              
              {/* Password */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Suivant
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Votre nom complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Jean Dupont"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
              
              {/* Company Name */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Nom de l'entreprise (optionnel)</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    placeholder="Ma super entreprise"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              
              {/* Confirm Password */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl font-medium text-white hover:bg-white/10 transition-all"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Créer le compte
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          
          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#0A0A1A] text-white/30 text-sm">ou</span>
            </div>
          </div>
          
          {/* Magic Link */}
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={loading || !formData.email}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-medium text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
            Envoyer un lien magique
          </button>
        </div>
        
        {/* Login Link */}
        <div className="text-center mt-8">
          <span className="text-white/60">Déjà un compte? </span>
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Se connecter
          </Link>
        </div>
      </motion.div>
    </div>
  );
}