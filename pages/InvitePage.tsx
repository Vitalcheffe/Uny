import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle, AlertCircle, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function InvitePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  // Get token from URL
  const token = location.pathname.split('/invite/')[1]?.replace('/', '');

  useEffect(() => {
    if (token) validateInvitation(token);
  }, [token]);

  const validateInvitation = async (inviteToken: string) => {
    try {
      const { data, error } = await (supabase
        .from('invitations' as any)
        .select('*, organizations(name)')
        .eq('token', inviteToken)
        .eq('status', 'pending')
        .single() as any);

      if (data && new Date(data.expires_at as string) > new Date()) {
        setInvitation(data);
        setValid(true);
      } else {
        setValid(false);
      }
    } catch (err) {
      console.error('Validation error:', err);
      setValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setRegistering(true);
    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            organization_id: invitation.organization_id
          }
        }
      });

      if (authError) throw authError;

      // 2. Update invitation status
      await (supabase
        .from('invitations' as any)
        .update({ status: 'used' })
        .eq('id', invitation.id) as any);

      // 3. Create profile
      await supabase
        .from('profiles')
        .insert({
          id: authData.user?.id,
          email: invitation.email,
          full_name: form.fullName,
          organization_id: invitation.organization_id,
          role: invitation.role
        });

      toast.success('Compte créé avec succès!');
      
      // Redirect to login or dashboard
      navigate('/login');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Erreur lors de la création du compte');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-black text-white">Invitation invalide ou expirée</h1>
          <p className="text-slate-400">Cette invitation n'est plus valide.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Key className="w-12 h-12 text-blue-500 mx-auto" />
          <h1 className="text-3xl font-black text-white">Créer votre compte</h1>
          <p className="text-slate-400">
            Invitation pour <span className="text-blue-400">{invitation?.organizations?.name}</span>
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              value={invitation?.email} 
              disabled
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Votre nom complet</label>
            <input 
              type="text" 
              required
              value={form.fullName}
              onChange={(e) => setForm({...form, fullName: e.target.value})}
              placeholder="John Doe"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Mot de passe</label>
            <input 
              type="password" 
              required
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Confirmer le mot de passe</label>
            <input 
              type="password" 
              required
              value={form.confirmPassword}
              onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <button 
            type="submit"
            disabled={registering}
            className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-wider rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-all"
          >
            {registering ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}