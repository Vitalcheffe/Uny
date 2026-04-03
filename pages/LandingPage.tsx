
import React, { useState, useEffect, Suspense } from 'react';
import Header from '../components/marketing/Header';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import * as Router from 'react-router-dom';
const { Link, useLocation, useNavigate } = Router as any;
import { 
  Check, ArrowRight, Smartphone, Monitor, 
  Zap, Globe, Cpu, ShieldAlert, Search, Activity, BrainCircuit, Terminal,
  Settings, MessageSquare, Eye, Sparkles, Plus, Twitter, Youtube, Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataService } from '../lib/data-service';
import Hero3D from '../components/marketing/Hero3D';

// --- SYNTHETIC UI COMPONENTS (Zero Image Dependency) ---

const DashboardMockup = () => (
  <div className="w-full aspect-[16/10] bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-xl flex flex-col">
    {/* Top Header */}
    <div className="h-12 border-b border-slate-100 bg-slate-50 flex items-center justify-between px-6">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-rose-500" />
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      </div>
      <div className="flex gap-4">
        <div className="w-24 h-2 bg-slate-200 rounded-full" />
        <div className="w-8 h-2 bg-blue-500/20 rounded-full" />
      </div>
    </div>
    
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-16 border-r border-slate-100 bg-slate-50 flex flex-col items-center py-6 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`w-8 h-8 rounded-lg border border-slate-200 ${i === 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-white'}`} />
        ))}
      </div>
      
      {/* Main Grid */}
      <div className="flex-1 p-8 space-y-8 overflow-hidden">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="w-32 h-2 bg-slate-200 rounded-full" />
            <div className="w-48 h-6 bg-slate-900 rounded-lg" />
          </div>
          <div className="flex gap-2">
             <div className="w-20 h-8 bg-blue-100 rounded-full border border-blue-200" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200" />
              <div className="w-full h-2 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 min-h-[180px] bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-20" />
          <div className="w-full h-full flex items-end gap-2">
            {[...Array(12)].map((_, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${20 + Math.random() * 60}%` }}
                transition={{ duration: 2, delay: i * 0.1 }}
                className="flex-1 bg-blue-500/20 rounded-t-lg border-t border-blue-500/40"
              />
            ))}
          </div>
          <motion.div 
            animate={{ top: ['0%', '100%'], opacity: [0, 0.2, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute left-0 w-full h-px bg-blue-400 z-10"
          />
        </div>
      </div>
    </div>
  </div>
);

const MobileMockup = () => (
  <div className="w-[280px] aspect-[9/19] bg-zinc-950 rounded-[48px] border-[8px] border-zinc-800 shadow-2xl overflow-hidden flex flex-col relative mx-auto">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-20" />
    
    <div className="flex-1 p-6 space-y-6 pt-12">
      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 mx-auto" />
      <div className="space-y-2">
        <div className="w-32 h-3 bg-white/10 rounded-full mx-auto" />
        <div className="w-20 h-2 bg-white/5 rounded-full mx-auto" />
      </div>

      <div className="space-y-3 pt-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-2xl border border-white/5 p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-2/3 h-2 bg-zinc-800 rounded-full" />
              <div className="w-1/2 h-1.5 bg-zinc-900 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Bottom Bar */}
    <div className="h-16 bg-zinc-900/50 border-t border-white/5 flex items-center justify-around px-6">
       {[...Array(4)].map((_, i) => <div key={i} className="w-4 h-4 rounded-full bg-white/10" />)}
    </div>
  </div>
);

const DataFluxLine: React.FC<{ isPaused: boolean }> = ({ isPaused }) => {
  const [text, setText] = useState('');
  
  useEffect(() => {
    if (isPaused) return;
    const chars = '0123456789ABCDEF<>[]{}_-+=#@!$%^&*()';
    const interval = setInterval(() => {
      let result = '';
      for (let i = 0; i < 40; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setText(result);
    }, 100);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="font-mono text-[10px] text-blue-500/40 truncate tracking-tighter">
      {text || 'A0F9283B-D9E2-4F11-B61E-C9A8B7D6E5F4'}
    </div>
  );
};

const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, .cursor-pointer')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-blue-500 pointer-events-none z-[9999] hidden lg:block mix-blend-difference"
      animate={{
        x: mousePos.x - 16,
        y: mousePos.y - 16,
        scale: isHovering ? 2.5 : 1,
        backgroundColor: isHovering ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 250, mass: 0.5 }}
    />
  );
};

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { scrollY, scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.9]);
  const heroY = useTransform(scrollY, [0, 400], [0, 100]);
  
  const [isHoveringFlux, setIsHoveringFlux] = useState(false);
  const location = useLocation();

  const [auditForm, setAuditForm] = useState({
    orgName: '',
    email: '',
    teamSize: '1-10 Employés',
    industry: 'AUTRE'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditForm.orgName || !auditForm.email) {
      alert('Veuillez remplir le nom de votre entreprise et votre email');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('📤 Sending audit request:', auditForm);
      
      const success = await DataService.createAuditRequest({
        company_name: auditForm.orgName,
        email: auditForm.email,
        team_size: auditForm.teamSize,
        industry: auditForm.industry,
        annual_revenue: 'N/A'
      });
      
      console.log('✅ Response:', success);
      
      if (success) {
        setIsSubmitted(true);
        alert('Demande envoyée avec succès! Nous vous répondrons sous 24h.');
      } else {
        alert('Erreur: La demande n\'a pas pu être envoyée. Veuillez réessayer.');
      }
    } catch (error: any) {
      console.error('🛡️ [Kernel] Audit request failed:', error);
      alert('Erreur: ' + (error?.message || 'Une erreur est survenue'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => scrollToId(id), 500);
    }
  }, [location.hash]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const slamInVariants = {
    hidden: { scale: 2, y: -100, opacity: 0, rotateX: 20 },
    visible: { 
      scale: 1, 
      y: 0, 
      opacity: 1, 
      rotateX: 0,
      transition: { 
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
        duration: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans">
      <CustomCursor />
      
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-[100]"
        style={{ scaleX }}
      />

      <Header />
      
      {/* --- SECTION 1: HERO --- */}
      <section className="relative pt-40 pb-32 px-6 min-h-screen flex items-center overflow-hidden bg-[#050505]">
        <Suspense fallback={null}>
          <Hero3D />
        </Suspense>
        
        {/* Noise Overlay for texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1.2 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            className="absolute top-[10%] -left-20 w-[1000px] h-[600px] blur-[150px]"
            style={{ background: 'radial-gradient(circle, rgba(30,58,138,0.3) 0%, rgba(255,255,255,0) 70%)' }}
          />
        </div>

        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 max-w-7xl mx-auto text-center"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-12"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                v9.0.2 • Enterprise Operating System
              </span>
            </motion.div>
            
            <motion.h1 
              variants={slamInVariants}
              className="text-7xl md:text-9xl lg:text-[180px] font-[950] text-white tracking-tighter mb-12 leading-[0.8] italic uppercase"
            >
              <span className="block">{t('hero.title1')}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 bg-[length:200%_auto] animate-gradient-x">
                {t('hero.title2')}
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-16 leading-relaxed font-medium"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <button 
                onClick={() => scrollToId('contact-us')}
                className="group relative px-12 py-6 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-[0.2em] overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {t('hero.btnAudit')}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="absolute inset-0 bg-white group-hover:text-white" />
              </button>
              
              <button 
                onClick={() => scrollToId('features')}
                className="group px-12 py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-white/10 transition-all backdrop-blur-md flex items-center gap-3"
              >
                {t('hero.btnFeatures')}
                <Sparkles size={18} className="text-blue-400 group-hover:rotate-12 transition-transform" />
              </button>
            </motion.div>
          </motion.div>

          {/* Dashboard Mockup with perspective */}
          <div className="relative mt-32 max-w-6xl mx-auto px-6 perspective-1000">
            <motion.div
              initial={{ opacity: 0, y: 100, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-[40px] opacity-50" />
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-blue-500/10">
                <DashboardMockup />
                
                {/* Floating interactive elements */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/20 blur-3xl rounded-full"
                />
                <motion.div 
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/20 blur-3xl rounded-full"
                />
              </div>

              {/* Floating Status Cards */}
              <motion.div 
                animate={{ y: [0, -30, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-16 -right-16 p-10 bg-[#0A0A0A] border border-white/10 text-white rounded-[40px] shadow-2xl hidden lg:block z-20 backdrop-blur-xl"
              >
                <Activity size={32} className="mb-4 text-blue-500" />
                <p className="text-[11px] font-black uppercase tracking-[0.3em] leading-none text-zinc-500 mb-2">Neural Link</p>
                <p className="text-3xl font-black italic text-blue-500">Active</p>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-16 -left-16 p-10 bg-[#0A0A0A] border border-white/10 text-white rounded-[40px] shadow-2xl hidden lg:block z-20 backdrop-blur-xl"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Zap size={32} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] leading-none text-zinc-500 mb-2">System Load</p>
                    <p className="text-3xl font-black italic text-emerald-500">Nameinal</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* --- SECTION 2: TRUSTED BY --- */}
      <section className="py-32 bg-[#050505] relative border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-16"
          >
            {t('trusted.title')}
          </motion.p>
          
          <div className="relative">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-[#050505] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[#050505] to-transparent z-10" />
            
            <div className="flex overflow-hidden group">
              <motion.div 
                animate={{ x: [0, -1920] }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="flex items-center gap-32 whitespace-nowrap px-16"
              >
                {['GOLDMAN SACHS', 'MORGAN STANLEY', 'BLACKROCK', 'JP MORGAN', 'CITI', 'HSBC', 'GOLDMAN SACHS', 'MORGAN STANLEY', 'BLACKROCK', 'JP MORGAN'].map((brand, i) => (
                  <span key={i} className="text-3xl md:text-5xl font-black text-white/10 hover:text-white/40 transition-colors cursor-default tracking-tighter italic uppercase">
                    {brand}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
            {/* --- SECTION 3: MULTI-DEVICE --- */}
      <section className="py-40 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <motion.div 
            whileInView="visible" initial="hidden" viewport={{ once: true }} variants={containerVariants}
            className="text-center lg:text-left"
          >
            <motion.span variants={itemVariants} className="text-blue-700 font-black uppercase tracking-[0.3em] text-xs mb-6 block">{t('multiDevice.tag')}</motion.span>
            <motion.h2 variants={itemVariants} className="text-6xl lg:text-8xl font-[900] text-slate-900 mb-10 leading-[0.9] tracking-tighter italic">{t('multiDevice.title1')} <br /> <span className="text-blue-700">{t('multiDevice.title2')}</span></motion.h2>
            <motion.p variants={itemVariants} className="text-xl text-slate-500 mb-14 max-w-xl leading-relaxed font-medium">
              {t('multiDevice.desc')}
            </motion.p>
            <motion.div variants={itemVariants} className="flex justify-center lg:justify-start gap-8">
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-8 py-5 rounded-[24px]">
                <Smartphone className="text-blue-700" /> <span className="font-black uppercase text-xs tracking-widest text-slate-900">{t('multiDevice.mobile')}</span>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-8 py-5 rounded-[24px]">
                <Monitor className="text-blue-700" /> <span className="font-black uppercase text-xs tracking-widest text-slate-900">{t('multiDevice.web')}</span>
              </div>
            </motion.div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1 }}
            className="relative"
          >
             <div className="bg-blue-50 rounded-[80px] p-12 lg:p-20 relative overflow-hidden flex items-center justify-center border border-slate-100">
                <div className="absolute top-0 left-0 w-full h-full bg-blue-100 blur-3xl rounded-full translate-y-1/2" />
                <MobileMockup />
             </div>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 4: PROJECT MANAGEMENT --- */}
      <section id="features" className="py-40 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <motion.div 
             initial={{ opacity: 0, x: -50 }}
             whileInView={{ opacity: 1, x: 0 }}
             transition={{ duration: 1 }}
             className="relative lg:order-1 order-2"
          >
            <div className="bg-white rounded-[40px] overflow-hidden p-6 border border-slate-200 shadow-xl">
              <DashboardMockup />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-white border border-slate-200 p-8 rounded-[32px] hidden md:block shadow-xl">
               <div className="grid grid-cols-2 gap-6">
                 {(t('projectMgmt.items', { returnObjects: true }) as string[]).map((item) => (
                   <div key={item} className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"><Check size={14} className="text-blue-700" strokeWidth={3} /></div>
                     <span className="font-black text-xs uppercase tracking-widest text-slate-700">{item}</span>
                   </div>
                 ))}
               </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="lg:order-2 order-1"
          >
            <span className="text-blue-700 font-black uppercase tracking-[0.3em] text-xs mb-6 block">{t('projectMgmt.tag')}</span>
            <h2 className="text-6xl lg:text-8xl font-[950] text-slate-900 mb-10 leading-[0.85] tracking-tighter italic uppercase">{t('projectMgmt.title1')} <br /> <span className="text-blue-700">{t('projectMgmt.title2')}</span></h2>
            <p className="text-xl text-slate-500 mb-12 max-w-xl leading-relaxed font-medium">
              {t('projectMgmt.desc')}
            </p>
            <button 
              onClick={() => scrollToId('contact-us')}
              className="bg-blue-700 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm flex items-center gap-4 hover:bg-blue-800 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              {t('projectMgmt.btn')} <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 5: FINANCIALS --- */}
      <section id="benefits" className="py-40 px-6 bg-[#050505] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8"
            >
              <Zap size={12} />
              {t('financials.tag')}
            </motion.div>
            <h2 className="text-6xl lg:text-8xl font-[950] text-white mb-10 leading-[0.85] tracking-tighter italic uppercase">
              {t('financials.title1')} <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">{t('financials.title2')}</span>
            </h2>
            <p className="text-xl text-zinc-500 mb-14 max-w-xl leading-relaxed font-medium italic">
              {t('financials.desc')}
            </p>
            <div className="grid grid-cols-2 gap-6">
              {(t('financials.items', { returnObjects: true }) as string[]).map((f, i) => (
                <motion.div 
                  key={f} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-[24px] transition-all hover:bg-white/[0.05] hover:border-blue-500/30 group"
                >
                  <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Check size={16} className="text-blue-400 group-hover:text-white" strokeWidth={3} />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <div className="relative">
            {/* Floating decorative elements */}
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full z-0"
            />
            <motion.div
              animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full z-0"
            />

             <motion.div 
               initial={{ rotate: 5, y: 30, opacity: 0 }}
               whileInView={{ rotate: 0, y: 0, opacity: 1 }}
               transition={{ duration: 1 }}
               className="relative z-10 bg-white/[0.02] backdrop-blur-3xl rounded-[60px] p-6 md:p-12 border border-white/10 shadow-2xl overflow-hidden group"
             >
               {/* Inner glass card */}
               <div className="bg-zinc-900/80 rounded-[40px] overflow-hidden p-6 md:p-10 border border-white/10 shadow-2xl relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                  
                  <div className="space-y-10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('financials.balance_label') || 'Total Balance'}</p>
                        <motion.p 
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          className="text-4xl md:text-5xl font-black italic text-white tracking-tighter"
                        >
                          $142,500<span className="text-blue-500">.00</span>
                        </motion.p>
                      </div>
                      <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/40 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                        <Zap size={28} fill="currentColor" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      {[
                        { label: 'Revenue', value: '85%', color: 'bg-blue-500' },
                        { label: 'Expenses', value: '32%', color: 'bg-zinc-700' },
                        { label: 'Profit', value: '64%', color: 'bg-emerald-500' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{item.label}</span>
                            <span className="text-[10px] font-black text-white">{item.value}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: item.value }}
                              transition={{ duration: 1.5, delay: 0.5 + (i * 0.2), ease: "circOut" }}
                              className={`h-full ${item.color} rounded-full`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                      <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                            <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                      <button className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                        {t('financials.view_all') || 'View Details'} →
                      </button>
                    </div>
                  </div>
               </div>

               {/* Floating elements */}
               <motion.div
                 animate={{ y: [0, -10, 0] }}
                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute top-20 -right-4 bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl rotate-12"
               >
                 +24%
               </motion.div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* --- SECTION 6: DEEP CONTEXT SCANNER --- */}
      <section className="py-40 px-6 bg-[#050505] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-24 opacity-10 pointer-events-none">
          <BrainCircuit size={400} className="text-blue-500 animate-pulse" />
        </div>
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="max-w-7xl mx-auto space-y-24 relative z-10">
          <div className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <Terminal size={12} />
              {t('scanner.tag')}
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-8xl font-[950] italic uppercase tracking-tighter leading-none text-white"
            >
              {t('scanner.title1')} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">{t('scanner.title2')}</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium leading-relaxed italic"
            >
              {t('scanner.desc')}
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-stretch">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative bg-[#0a0a0a] rounded-[48px] border border-white/5 overflow-hidden p-8 h-[500px] cursor-crosshair group shadow-2xl"
              onMouseEnter={() => setIsHoveringFlux(true)}
              onMouseLeave={() => setIsHoveringFlux(false)}
            >
              <div className="absolute top-0 left-0 w-full h-full p-10 space-y-2 overflow-hidden flex flex-col">
                <div className="mb-6 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">RAW_INGESTION_BUFFER</span>
                   </div>
                   <span className="text-[10px] font-mono text-zinc-700">OFFSET: 0x4F92</span>
                </div>
                {[...Array(25)].map((_, i) => (
                  <DataFluxLine key={i} isPaused={isHoveringFlux} />
                ))}
              </div>

              <AnimatePresence>
                {isHoveringFlux && (
                  <motion.div 
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] z-10"
                  />
                )}
              </AnimatePresence>

              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-8 left-8 flex items-center gap-3">
                 <Terminal size={14} className="text-blue-500" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    {isHoveringFlux ? t('scanner.statusLocked') : t('scanner.statusAwaiting')}
                 </span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-[#0a0a0a] rounded-[48px] p-12 flex flex-col justify-between relative border border-white/5 shadow-xl overflow-hidden"
            >
              {/* Glow Effect */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
              
              <div className="space-y-8 relative z-10">
                 <div className="flex items-center gap-4 text-blue-400">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <Cpu size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.6em]">{t('scanner.logic')}</span>
                 </div>
                 
                 <AnimatePresence mode="wait">
                    {!isHoveringFlux ? (
                      <motion.div 
                        key="standby"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-6 py-12 flex flex-col items-center justify-center text-center"
                      >
                         <div className="w-24 h-24 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-center animate-spin-slow">
                            <Search size={32} className="text-zinc-700" />
                         </div>
                         <p className="text-[11px] font-black uppercase tracking-widest text-zinc-600 animate-pulse">
                           {t('scanner.intercepting')}
                         </p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="active"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                         <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">{t('scanner.insights')}</h3>
                         
                         <div className="space-y-4">
                            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] flex items-center gap-6 group transition-all hover:bg-white/[0.05] hover:border-rose-500/30">
                               <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/30">
                                  <ShieldAlert size={20} />
                                </div>
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">{t('scanner.anomaly')}</p>
                                  <p className="text-lg font-black italic uppercase tracking-tight text-white">{t('scanner.anomalyTitle')}</p>
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 italic">{t('scanner.anomalyDesc')}</p>
                               </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] flex items-center gap-6 transition-all hover:bg-white/[0.05] hover:border-blue-500/30">
                               <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30">
                                  <Globe size={20} />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">{t('scanner.shift')}</p>
                                  <p className="text-lg font-black italic uppercase tracking-tight text-white">{t('scanner.shiftTitle')}</p>
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 italic">{t('scanner.shiftDesc')}</p>
                               </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] flex items-center gap-6 transition-all hover:bg-white/[0.05] hover:border-emerald-500/30">
                               <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
                                  <Activity size={20} />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">{t('scanner.fusion')}</p>
                                  <p className="text-lg font-black italic uppercase tracking-tight text-white">{t('scanner.fusionTitle')}</p>
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 italic">{t('scanner.fusionDesc')}</p>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              <div className="pt-8 border-t border-white/5 flex items-center justify-between opacity-50 relative z-10">
                 <div className="flex items-center gap-3">
                    <Cpu size={14} className="text-blue-400" />
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500">Multi-Modal Intelligence v9</span>
                 </div>
                 <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-zinc-800" />)}
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- SECTION 7: FEATURE BENTO GRID --- */}
      <section className="py-40 px-6 bg-[#050505] text-white rounded-t-[100px] -mt-20 relative z-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8"
            >
              <Settings size={12} />
              {t('architecture.tag')}
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-7xl md:text-9xl font-[950] mb-12 tracking-tighter italic uppercase leading-[0.85]"
            >
              {t('architecture.title1')} <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">{t('architecture.title2')}</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-2xl text-zinc-500 max-w-4xl mx-auto font-medium leading-relaxed italic"
            >
              {t('architecture.desc')}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[300px]">
             {(t('architecture.cards', { returnObjects: true }) as any[]).map((f, i) => {
               const icons = [Settings, Zap, MessageSquare, Globe, Eye];
               const Icon = icons[i % icons.length];
               
               // Bento Grid Logic
               const gridClasses = [
                 "md:col-span-3 md:row-span-2", // Big feature
                 "md:col-span-3 md:row-span-1", // Wide feature
                 "md:col-span-2 md:row-span-1", // Small feature
                 "md:col-span-2 md:row-span-1", // Small feature
                 "md:col-span-2 md:row-span-1", // Small feature
               ][i] || "md:col-span-2";

               return (
                 <motion.div 
                   key={i} 
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   whileHover={{ y: -10, rotateX: 5, rotateY: -5 }}
                   transition={{ delay: i * 0.1, type: "spring" as const, stiffness: 300 }}
                   className={`group relative bg-white/[0.02] border border-white/5 p-10 rounded-[48px] hover:bg-white/[0.05] hover:border-blue-500/30 cursor-pointer overflow-hidden flex flex-col justify-end ${gridClasses} perspective-1000`}
                 >
                  <div className="absolute top-10 right-10 w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all shadow-xl group-hover:shadow-blue-500/20">
                     <Icon size={28} strokeWidth={2.5} />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-3xl font-[950] mb-4 uppercase tracking-tight italic text-white">{f.title}</h3>
                    <p className="text-zinc-500 font-bold leading-relaxed text-lg opacity-80 group-hover:opacity-100 transition-opacity max-w-md italic">
                      {f.desc}
                    </p>
                  </div>

                  {/* Decorative mesh background for the card */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-1000 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 to-transparent" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50" />
                  </div>
                 </motion.div>
               );
             })}
          </div>
        </div>
      </section>

      {/* --- SECTION 8: CASE STUDIES --- */}
      <section className="py-40 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mb-32 text-center lg:text-left"
          >
            <h2 className="text-5xl lg:text-7xl font-[900] text-white leading-[0.95] italic uppercase tracking-tighter mb-12">
              {t('caseStudies.title1')} <br className="hidden lg:block" /> {t('caseStudies.title2')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
             {(t('caseStudies.cards', { returnObjects: true }) as any[]).map((review, i) => (
               <motion.div 
                 key={i} 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 className="glass-card p-12 rounded-[56px] flex flex-col justify-between"
               >
                  <p className="text-xl font-bold text-zinc-300 mb-12 leading-relaxed italic opacity-90">{review.text}</p>
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 rounded-2xl bg-blue-600 overflow-hidden shadow-inner border-2 border-white/10 flex items-center justify-center text-white font-black text-lg italic">
                        {review.name.split(' ').map((n: string) => n[0]).join('')}
                     </div>
                     <div>
                        <p className="font-black text-lg tracking-tight uppercase italic text-white">{review.name}</p>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">{review.role}</p>
                     </div>
                  </div>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 9: ACCESS & DEPLOYMENT --- */}
      <section id="pricing" className="py-40 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto text-center">
           <div className="mb-32">
              <span className="text-blue-500 font-black uppercase tracking-[0.3em] text-xs mb-8 block">{t('pricing.tag')}</span>
              <h2 className="text-7xl md:text-9xl font-[900] text-white tracking-tighter mb-12 italic uppercase">{t('pricing.title1')} <br /> <span className="text-blue-500">{t('pricing.title2')}</span></h2>
           </div>

           <div className="grid lg:grid-cols-2 gap-10 items-stretch max-w-5xl mx-auto">
              <motion.div whileHover={{ y: -10 }} className="glass-card p-14 rounded-[64px] text-left flex flex-col group transition-all">
                 <h3 className="text-2xl font-[900] mb-4 italic uppercase tracking-tight text-white">{t('pricing.basic.title')}</h3>
                 <p className="text-zinc-500 font-bold mb-12 text-lg">{t('pricing.basic.desc')}</p>
                 <ul className="space-y-6 mb-16 flex-1">
                    {(t('pricing.basic.items', { returnObjects: true }) as string[]).map(item => (
                      <li key={item} className="flex items-center gap-5 font-black text-sm uppercase tracking-tight text-zinc-400">
                        <div className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-sm"><Check size={14} className="text-blue-500" strokeWidth={3} /></div>
                        {item}
                      </li>
                    ))}
                 </ul>
                 <button onClick={() => scrollToId('contact-us')} className="w-full py-7 bg-white/5 border border-white/10 text-white rounded-[28px] font-black text-sm uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-sm text-center">{t('pricing.basic.btn')}</button>
              </motion.div>

              <motion.div whileHover={{ y: -10 }} className="bg-blue-600 p-14 rounded-[64px] text-left flex flex-col relative scale-105 shadow-[0_60px_100px_rgba(59,130,246,0.15)] z-10 border-4 border-white/10">
                 <div className="absolute top-0 right-14 -translate-y-1/2 bg-white text-blue-600 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-xl">{t('pricing.enterprise.tag')}</div>
                 <h3 className="text-2xl font-[900] mb-4 text-white italic uppercase tracking-tight">{t('pricing.enterprise.title')}</h3>
                 <p className="text-blue-100 font-bold mb-12 text-lg">{t('pricing.enterprise.desc')}</p>
                 <ul className="space-y-6 mb-16 flex-1 text-blue-50">
                    {(t('pricing.enterprise.items', { returnObjects: true }) as string[]).map(item => (
                      <li key={item} className="flex items-center gap-5 font-black text-sm uppercase tracking-tight">
                        <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]"><Check size={14} className="text-blue-600" strokeWidth={3} /></div>
                        {item}
                      </li>
                    ))}
                 </ul>
                 <button onClick={() => scrollToId('contact-us')} className="w-full py-7 bg-white text-blue-600 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all shadow-2xl italic text-center">{t('pricing.enterprise.btn')}</button>
              </motion.div>
           </div>
        </div>
      </section>

      {/* --- SECTION 10: BLOG / STRATEGIC RESOURCES --- */}
      <section id="blog" className="py-40 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="space-y-6">
              <span className="text-blue-500 font-black uppercase tracking-[0.3em] text-xs block">{t('blog.tag')}</span>
              <h2 className="text-6xl md:text-8xl font-[900] text-white italic uppercase tracking-tighter leading-none">
                {t('blog.title1')} <br /> <span className="text-blue-500">{t('blog.title2')}</span>
              </h2>
            </div>
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white transition-all cursor-pointer">
                <ArrowRight size={24} className="rotate-180" />
              </div>
              <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white transition-all cursor-pointer">
                <ArrowRight size={24} />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {(t('blog.posts', { returnObjects: true }) as any[]).map((post, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group glass-card rounded-[56px] overflow-hidden flex flex-col h-full hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="aspect-[16/10] bg-zinc-900 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-8 left-8 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                    {post.tag}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black shadow-2xl">
                      <ArrowRight size={24} />
                    </div>
                  </div>
                </div>
                <div className="p-12 flex flex-col flex-1 space-y-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{post.date}</span>
                  <h3 className="text-3xl font-[900] text-white italic uppercase tracking-tighter leading-tight group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-zinc-500 font-bold leading-relaxed line-clamp-3">
                    {post.desc}
                  </p>
                  <div className="pt-6 mt-auto border-t border-white/5 flex items-center gap-3 text-blue-500 font-black uppercase tracking-widest text-xs">
                    {t('blog.readMore')} <Plus size={14} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 11: CONTACT & AUDIT --- */}
      <section id="contact-us" className="py-40 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             className="text-center mb-24"
           >
              <span className="text-blue-700 font-black uppercase tracking-[0.3em] text-xs mb-8 block">{t('contact.tag')}</span>
              <h2 className="text-6xl md:text-8xl font-[950] text-slate-900 italic uppercase tracking-tighter leading-none">{t('contact.title')}</h2>
              <p className="text-xl text-slate-500 mt-6 max-w-2xl mx-auto font-medium italic">
                {t('contact.desc')}
              </p>
           </motion.div>
           
           <div className="grid lg:grid-cols-2 gap-24 items-start">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="space-y-12"
              >
                <div className="bg-slate-50 border border-slate-200 p-10 rounded-[48px] space-y-8 shadow-xl">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-[950] italic uppercase tracking-tight text-slate-900">{t('contact.why.title')}</h3>
                    <p className="text-slate-500 font-bold leading-relaxed">
                      {t('contact.why.desc')}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {(t('contact.why.items', { returnObjects: true }) as string[]).map((point, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20"><Check size={20} /></div>
                        <span className="font-black text-xs uppercase tracking-widest text-slate-700">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm cursor-pointer text-slate-400 group">
                    <Twitter size={24} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm cursor-pointer text-slate-400 group">
                    <Youtube size={24} className="group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </motion.div>

              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-blue-50 border border-blue-100 p-12 rounded-[64px] text-center space-y-6 shadow-2xl"
                >
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-blue-600/30">
                    <Check className="text-white" size={40} />
                  </div>
                  <h3 className="text-3xl font-[950] italic uppercase text-slate-900">{t('contact.success.title')}</h3>
                  <p className="text-slate-500 font-bold">
                    {t('contact.success.desc')}
                  </p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-blue-600 font-black uppercase tracking-widest text-[10px] hover:text-blue-700 transition-colors"
                  >
                    {t('contact.success.btn')}
                  </button>
                </motion.div>
              ) : (
                <motion.form 
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  onSubmit={handleAuditSubmit} 
                  className="bg-white border border-slate-200 p-12 rounded-[64px] shadow-2xl space-y-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">{t('contact.form.org')}</label>
                      <input 
                        type="text" 
                        required
                        value={auditForm.orgName}
                        onChange={(e) => setAuditForm({...auditForm, orgName: e.target.value})}
                        placeholder="EX: ATLAS TECH" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 text-slate-900 font-black italic uppercase text-sm focus:border-blue-700 outline-none transition-all focus:bg-white" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Email Professionnel</label>
                      <input 
                        type="email" 
                        required
                        value={auditForm.email}
                        onChange={(e) => setAuditForm({...auditForm, email: e.target.value})}
                        placeholder="CEO@ATLAS.MA" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 text-slate-900 font-black italic uppercase text-sm focus:border-blue-700 outline-none transition-all focus:bg-white" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Taille de l'équipe</label>
                        <select 
                          value={auditForm.teamSize}
                          onChange={(e) => setAuditForm({...auditForm, teamSize: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 text-slate-900 font-black italic uppercase text-sm focus:border-blue-700 outline-none transition-all appearance-none focus:bg-white"
                        >
                          <option className="bg-white">1-10 Employés</option>
                          <option className="bg-white">11-50 Employés</option>
                          <option className="bg-white">50+ Employés</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Secteur</label>
                        <select 
                          value={auditForm.industry}
                          onChange={(e) => setAuditForm({...auditForm, industry: e.target.value as any})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 text-slate-900 font-black italic uppercase text-sm focus:border-blue-700 outline-none transition-all appearance-none focus:bg-white"
                        >
                          <option value="DENTISTE" className="bg-white">DENTISTE</option>
                          <option value="AVOCAT" className="bg-white">AVOCAT</option>
                          <option value="LOGISTIQUE" className="bg-white">LOGISTIQUE</option>
                          <option value="FINANCE" className="bg-white">FINANCE</option>
                          <option value="RH" className="bg-white">RH</option>
                          <option value="JURIDIQUE" className="bg-white">JURIDIQUE</option>
                          <option value="AUTRE" className="bg-white">AUTRE</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-700 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-blue-800 transition-all shadow-xl shadow-blue-500/30 italic flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Traitement...
                      </>
                    ) : (
                      'Soumettre ma demande'
                    )}
                  </button>
                  <p className="text-[8px] text-slate-400 text-center font-bold uppercase tracking-widest">
                    Réponse garantie sous 24h par un expert UNY.
                  </p>
                </motion.form>
              )}
           </div>
        </div>
      </section>

      {/* --- SECTION 12: FINAL CTA --- */}
      <section className="py-40 px-6 bg-[#050505]">
        <motion.div 
          whileInView={{ scale: [0.95, 1], opacity: [0, 1] }}
          className="max-w-5xl mx-auto glass-card rounded-[80px] p-24 text-center relative overflow-hidden shadow-[0_100px_200px_rgba(0,0,0,0.4)]"
        >
           <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" 
           />
           
           <h2 className="text-6xl md:text-8xl font-[900] text-white mb-10 relative z-10 italic uppercase tracking-tighter">{t('cta.title1')} <br /> <span className="text-blue-500">{t('cta.title2')}</span></h2>
           <p className="text-2xl text-zinc-400 mb-16 relative z-10 max-w-xl mx-auto font-bold italic">
              {t('cta.desc')}
           </p>
           <button onClick={() => scrollToId('contact-us')} className="bg-white text-black px-16 py-8 rounded-full text-3xl font-[950] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_30px_60px_rgba(255,255,255,0.1)] relative z-10 inline-block italic group">
              {t('cta.btn')} <ArrowRight size={32} className="inline-block ml-4 group-hover:translate-x-2 transition-transform" />
           </button>
        </motion.div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-32 px-6 bg-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
            <div className="col-span-2 space-y-12">
              <Link to="/" className="flex items-center gap-4 group">
                <div className="w-14 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center text-white font-black italic text-3xl shadow-2xl group-hover:rotate-12 transition-transform">U</div>
                <span className="text-3xl font-black italic uppercase tracking-tighter text-white">UNY HUB</span>
              </Link>
              <p className="text-zinc-500 font-bold max-w-sm leading-relaxed text-lg">
                {t('footer.desc')}
              </p>
              <div className="flex gap-6">
                {[Twitter, Youtube, Globe].map((Icon, i) => (
                  <div key={i} className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm cursor-pointer text-zinc-400">
                    <Icon size={24} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.5em] text-zinc-700 mb-10">{t('footer.interface')}</h4>
              <ul className="space-y-6 font-black text-sm uppercase tracking-widest text-zinc-400">
                <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-blue-500 transition-colors uppercase">{t('footer.home')}</button></li>
                <li><button onClick={() => scrollToId('features')} className="hover:text-blue-500 transition-colors uppercase">{t('footer.nodes')}</button></li>
                <li><button onClick={() => scrollToId('pricing')} className="hover:text-blue-500 transition-colors uppercase">{t('footer.access')}</button></li>
                <li><button onClick={() => scrollToId('blog')} className="hover:text-blue-500 transition-colors uppercase">{t('footer.journal')}</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.5em] text-zinc-700 mb-10">{t('footer.protocol')}</h4>
              <ul className="space-y-6 font-black text-sm uppercase tracking-widest text-zinc-400">
                <li><button onClick={() => scrollToId('contact-us')} className="hover:text-blue-500 transition-colors uppercase text-left">{t('footer.contact')}</button></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors uppercase">{t('footer.privacy')}</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors uppercase">{t('footer.security')}</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">{t('footer.status')}</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{t('footer.rights')}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 italic">{t('footer.build')}</span>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-blue-600" />)}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
