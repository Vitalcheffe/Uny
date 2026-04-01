
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="@react-three/fiber" />

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Router from 'react-router-dom';
const { Link, useNavigate } = Router as any;
import { 
  Mail, Lock, User, ArrowRight, Loader2, AlertCircle, 
  ChevronLeft, ShieldCheck, Globe, Cpu, Home, Zap, 
  Sparkles, Fingerprint, Eye, EyeOff, Activity, RefreshCw,
  CheckCircle2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../lib/supabase-data-layer';
import { supabase } from '../lib/supabase';

// --- 3D NEURAL CORE COMPONENT ---

const NeuralCore = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <group>
      <Float speed={4} rotationIntensity={1} floatIntensity={2}>
        <Sphere args={[1, 100, 100]} scale={2.4}>
          <MeshDistortMaterial
            color="#4f46e5"
            speed={3}
            distort={0.4}
            radius={1}
            metalness={0.8}
            roughness={0.2}
            emissive="#1e1b4b"
            emissiveIntensity={0.5}
          />
        </Sphere>
      </Float>
      
      {/* Orbital Rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.2, 0.01, 16, 100]} />
        <meshStandardMaterial color="#4f46e5" emissive="#4f46e5" emissiveIntensity={2} transparent opacity={0.3} />
      </mesh>
      
      <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[3.5, 0.005, 16, 100]} />
        <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={1} transparent opacity={0.2} />
      </mesh>

      <PerspectiveCamera makeDefault position={[0, 0, 8]} />
      <Environment preset="city" />
      <ContactShadows position={[0, -4.5, 0]} opacity={0.4} scale={20} blur={2} far={10} />
    </group>
  );
};

// --- AUTH COMPONENT ---

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, profile, profileLoaded } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: any;
    const handleMouseDown = () => {
      timer = setTimeout(async () => {
        // Bootstrap logic
        try {
          const profiles = await firestoreService.getCollectionGlobal('profiles', [{ field: 'role', operator: '==', value: 'SUPER_ADMIN' }]);
          if (profiles.length === 0) {
              // Create Super Admin
              const email = 'amineharchelkorane5@gmail.com';
              const password = 'SuperSecretPassword123!';
              
              const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
              });

              if (authError) throw authError;

              if (authData.user) {
                await firestoreService.addDocumentGlobal('profiles', {
                  user_id: authData.user.id,
                  full_name: 'Fondateur UNY',
                  role: 'SUPER_ADMIN',
                  email: email,
                  onboarding_completed: true
                });
                alert('Super Admin created in Supabase.');
              }
          }
        } catch (err) {
          console.error('Bootstrap error:', err);
        }
      }, 3000); // 3 seconds long press
    };
    const handleMouseUp = () => clearTimeout(timer);
    
    const logo = logoRef.current;
    if (logo) {
      logo.addEventListener('mousedown', handleMouseDown);
      logo.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      if (logo) {
        logo.removeEventListener('mousedown', handleMouseDown);
        logo.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, []);

  // REDIRECT PROTOCOL - Optimized for high-frequency restarts
  useEffect(() => {
    if (user && profileLoaded) {
      const timer = setTimeout(() => {
        if (profile?.onboarding_completed) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      }, 1500); // Extended slightly for visual impact
      return () => clearTimeout(timer);
    }
  }, [user, profile, profileLoaded, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Authentification échouée.");
    } finally {
      setLoading(false);
    }
  };

  // HANDSHAKE UI: Renders when already logged in
  if (user && profileLoaded) {
    return (
      <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans text-slate-900 selection:bg-indigo-600 selection:text-white overflow-hidden">
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center relative p-12 bg-white z-20">
          <div className="w-full max-w-md space-y-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
              <div className="relative flex justify-center">
                <div className="w-32 h-32 bg-emerald-50 rounded-[40px] flex items-center justify-center border border-emerald-100 shadow-xl shadow-emerald-500/10">
                  <ShieldCheck size={56} className="text-emerald-500 animate-pulse" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-emerald-400 blur-3xl rounded-full"
                />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-[950] italic uppercase tracking-tighter text-slate-900">
                  Authorized <br /> <span className="text-indigo-600">Handshake</span>
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">
                  Syncing Organizational Node...
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Identity Protocol</span>
                   </div>
                   <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest italic">Verified</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 font-black italic">
                      {profile?.full_name?.[0] || user.email?.[0].toUpperCase()}
                   </div>
                   <div className="flex-1 text-left">
                      <p className="text-sm font-black italic uppercase tracking-tight">{profile?.full_name || 'Operative'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{user.email}</p>
                   </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 opacity-50">
                 <Loader2 size={24} className="animate-spin text-indigo-600" />
                 <span className="text-[8px] font-black uppercase tracking-[0.4em]">Calibrating Interface Gateway</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Keeping the 3D visual on the right for symmetry */}
        <div className="hidden md:flex md:flex-1 bg-slate-50 relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Canvas dpr={[1, 2]}>
              <NeuralCore />
            </Canvas>
          </div>
          <div className="absolute top-16 right-16 flex items-center gap-4 opacity-10">
             <span className="text-[11px] font-black uppercase tracking-[0.8em]">UNY COGNITIVE UNIT</span>
             <Sparkles size={20} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans text-slate-900 selection:bg-indigo-600 selection:text-white overflow-hidden">
      
      {/* HEADER ESCAPE NODE */}
      <div className="fixed top-6 left-6 z-[100] md:top-10 md:left-16">
        <Link 
          to="/" 
          className="flex items-center gap-3 px-6 py-3 bg-slate-50 backdrop-blur-xl border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 hover:border-slate-400 shadow-sm transition-all group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Exit to Interface</span>
        </Link>
      </div>

      {/* --- LEFT SIDE: THE INTERACTION CANVAS --- */}
      <div className="w-full flex flex-col items-center justify-center relative px-8 md:px-16 py-20 bg-white z-20">
        <div className="w-full max-w-[440px] space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-12"
          >
            {/* Branding Small */}
            <div className="flex items-center gap-4">
              <div ref={logoRef} className="w-12 h-12 bg-slate-900 rounded-[18px] flex items-center justify-center text-white shadow-2xl transition-all hover:rotate-12 cursor-pointer">
                <span className="font-black italic text-2xl leading-none">U</span>
              </div>
              <div>
                <span className="font-[950] text-2xl tracking-tighter italic uppercase leading-none block">UNY HUB</span>
                <span className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-1 block">Cognitive OS v12.5</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-[950] tracking-[-0.05em] text-slate-900 leading-[0.9] italic uppercase">
                Authorize <br /> <span className="text-indigo-600">Access</span>
              </h1>
              <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest leading-relaxed">
                L'accès à UNY Hub est réservé aux organisations certifiées.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-rose-50 border border-rose-100 p-6 rounded-[28px] flex items-start gap-4 text-rose-700 text-[10px] font-black uppercase tracking-widest leading-relaxed italic"
                  >
                    <AlertCircle size={20} className="shrink-0 text-rose-500" />
                    <span>Access Denied: {error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-5">Neural ID (Email)</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="OPERATOR@NETWORK.IO" 
                      className="w-full px-14 py-6 rounded-[30px] border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all text-sm font-black italic uppercase placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Pass-Key</label>
                    <button type="button" className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors italic">
                      Recover?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••" 
                      className="w-full px-14 py-6 rounded-[30px] border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all text-sm font-black tracking-[0.5em] placeholder:text-slate-300"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className={`w-full py-7 rounded-[32px] font-black text-xs uppercase tracking-[0.5em] shadow-sm hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-4 disabled:opacity-50 group italic ${
                  email === 'amineharchelkorane5@gmail.com' 
                    ? 'bg-slate-900 text-white hover:bg-slate-950' 
                    : 'bg-slate-900 text-white hover:bg-indigo-600'
                }`}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>{email === 'amineharchelkorane5@gmail.com' ? 'Accès Souverain' : 'Authorize Login'}</span>
                    {email === 'amineharchelkorane5@gmail.com' ? <ShieldCheck size={20} className="group-hover:scale-125 transition-transform" /> : <Fingerprint size={20} className="group-hover:scale-125 transition-transform" />}
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-8 border-t border-slate-100">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                Vous n'avez pas d'accès ?{' '}
                <Link 
                  to="/#contact-us"
                  className="text-indigo-600 font-black hover:text-indigo-800 transition-colors ml-2 underline"
                >
                  Demander une démo
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* Absolute Footer for Versioning */}
        <div className="absolute bottom-10 left-10 md:left-16 lg:left-24 opacity-20 hidden md:block">
           <span className="text-[9px] font-mono font-black text-slate-900 tracking-[0.5em] uppercase">SYSTEM_STATE: NOMINAL // BUILD_2100.ALPHA</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
