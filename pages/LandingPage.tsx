import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'motion/react';
import { 
  Check, ArrowRight, Zap, Shield, Brain, 
  Globe, Cpu, Activity, Sparkles, Users, Building2,
  BarChart3, FileText, MessageSquare, Rocket, ChevronRight,
  Menu, X, Play, Star, ArrowUpRight
} from 'lucide-react';

// --- ANIMATED BACKGROUND COMPONENTS ---

const AnimatedGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0" style={{
      backgroundImage: `
        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px'
    }} />
    {/* Gradient overlays */}
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px]" />
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
  </div>
);

// --- GLASS CARD COMPONENT ---

const GlassCard = ({ children, className = '', hover = false }: { children: React.ReactNode, className?: string, hover?: boolean }) => (
  <motion.div
    whileHover={hover ? { scale: 1.02, y: -4 } : {}}
    className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 ${className}`}
  >
    {children}
  </motion.div>
);

// --- FEATURE CARD ---

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: { icon: any, title: string, description: string, delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      <GlassCard hover className="h-full group">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm leading-relaxed">{description}</p>
      </GlassCard>
    </motion.div>
  );
};

// --- STATS COUNTER ---

const StatCounter = ({ value, label, suffix = '' }: { value: number, label: string, suffix?: string }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <div className="text-center">
      <div className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-white/50 text-sm mt-1">{label}</div>
    </div>
  );
};

// --- TESTIMONIAL CARD ---

const TestimonialCard = ({ quote, author, role, company }: { quote: string, author: string, role: string, company: string }) => (
  <GlassCard className="relative">
    <Sparkles className="w-8 h-8 text-yellow-400/50 absolute top-4 right-4" />
    <p className="text-white/80 text-lg leading-relaxed mb-6">"{quote}"</p>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
        {author[0]}
      </div>
      <div>
        <div className="text-white font-medium">{author}</div>
        <div className="text-white/50 text-sm">{role} @ {company}</div>
      </div>
    </div>
  </GlassCard>
);

// --- PRICING CARD ---

const PricingCard = ({ name, price, features, popular = false }: { name: string, price: string, features: string[], popular?: boolean }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`relative bg-white/10 backdrop-blur-xl border rounded-2xl p-8 ${popular ? 'border-blue-500' : 'border-white/20'}`}
  >
    {popular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-xs font-medium text-white">
        Plus populaire
      </div>
    )}
    <div className="text-white/60 mb-2">{name}</div>
    <div className="text-4xl font-bold text-white mb-6">{price}<span className="text-lg font-normal text-white/60">/mois</span></div>
    <ul className="space-y-3 mb-8">
      {features.map((feature, i) => (
        <li key={i} className="flex items-center gap-2 text-white/80">
          <Check className="w-5 h-5 text-green-400" />
          {feature}
        </li>
      ))}
    </ul>
    <Link
      to="/signup"
      className={`block w-full py-3 rounded-xl font-medium text-center transition-all ${
        popular 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90' 
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      Commencer gratuit
    </Link>
  </motion.div>
);

// --- MAIN COMPONENT ---

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const features = [
    { icon: Brain, title: 'IA Générative', description: 'Accédez à Claude, GPT et Gemini depuis une interface unifiée.强大的人工智能驱动你的业务。' },
    { icon: BarChart3, title: 'Analytics Avancé', description: 'Tableaux de bord en temps réel. Suivez vos KPIs et prenez des décisions data-driven.' },
    { icon: FileText, title: 'Documents Intelligents', description: 'Générez, signez et stockez vos documents. 超智能文档管理。' },
    { icon: Users, title: 'Gestion d\'Équipe', description: 'Invitez vos collaborateurs. Définissez les rôles et permissions proprement.' },
    { icon: Building2, title: 'Multi-Entreprises', description: 'Gérez plusieurs organisations depuis un seul compte. 真正的SaaS架构。' },
    { icon: Shield, title: 'Sécurité Enterprise', description: 'Authentification forte, audit logs, RLS. 银行级别的安全。' },
  ];
  
  const testimonials = [
    { quote: 'UNY a transformé notre gestion d\'entreprise. L\'IA nous fait gagner des heures chaque semaine.', author: 'Marie K.', role: 'CEO', company: 'TechCorp Africa' },
    { quote: 'Enfin un outil qui comprend les entreprises africaines. Simple, puissant, efficace.', author: 'Jean P.', role: 'Dirigeant', company: 'Groupe SOF' },
    { quote: 'La meilleure plateforme SaaS que j\'ai utilisée. Et le support est francophone!', author: 'Sarah M.', role: 'CTO', company: 'InnovTech' },
  ];
  
  const plans = [
    { name: 'Starter', price: 'Gratuit', features: ['5 utilisateurs', '10GB stockage', 'IA basique', 'Email support'] },
    { name: 'Pro', price: '49€', features: ['25 utilisateurs', '100GB stockage', 'IA avancée', 'Priority support', 'API access'], popular: true },
    { name: 'Enterprise', price: '199€', features: ['Utilisateurs illimités', 'Stockage illimité', 'IA premium', '24/7 Support', 'SLAs', 'Custom integrations'] },
  ];
  
  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white overflow-x-hidden">
      {/* Animated Background */}
      <AnimatedGrid />
      
      {/* Header */}
      <motion.header
        style={{ opacity: useSpring(headerOpacity) }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all ${
          scrolled ? 'bg-[#0A0A1A]/80 backdrop-blur-xl border-b border-white/10' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="font-bold text-xl">UNY</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/60 hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-white/60 hover:text-white transition-colors">Tarifs</a>
            <a href="#testimonials" className="text-white/60 hover:text-white transition-colors">Témoignages</a>
          </nav>
          
          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-white/60 hover:text-white transition-colors">Connexion</Link>
            <Link to="/signup" className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium hover:opacity-90 transition-opacity">
              Essai gratuit
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </motion.header>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 right-0 z-40 bg-[#0A0A1A]/95 backdrop-blur-xl border-b border-white/10 p-6 md:hidden"
          >
            <nav className="flex flex-col gap-4">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg text-white/60">Fonctionnalités</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg text-white/60">Tarifs</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-lg text-white/60">Témoignages</a>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg text-white/60">Connexion</Link>
              <Link to="/signup" className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium text-center">
                Essai gratuit
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <motion.div style={{ y: heroY }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white/80">L'OS Numérique pour l'Afrique</span>
          </motion.div>
          
          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Gérez votre entreprise
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              avec l'intelligence artificielle
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-white/60 mb-10 max-w-2xl mx-auto"
          >
            La plateforme todo-en-un pour entrepreneurs africains. 
            IA, documents, projets, équipe — un seul outil.
          </motion.p>
          
          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-semibold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/demo"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 border border-white/20 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Voir la démo
            </Link>
          </motion.div>
          
          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-12 mt-20"
          >
            <StatCounter value={2500} label="Entreprises" />
            <StatCounter value={15000} label="Utilisateurs" />
            <StatCounter value={99} suffix="%" label="Satisfaction" />
          </motion.div>
        </motion.div>
        
        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="relative z-10 max-w-5xl mx-auto mt-20 px-6"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            {/* Mock Dashboard */}
            <div className="bg-[#0A0A1A]/80 p-2">
              <div className="flex gap-1 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚀</div>
                  <div className="text-2xl font-bold text-white">Dashboard Moderne</div>
                  <div className="text-white/50 mt-2">Bientôt disponible</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Une plateforme complète pour gérer votre entreprise. 
              Sans abstraction, sans compromis.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section id="testimonials" className="relative py-32 bg-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-white/60 text-lg">
              Des milliers d'entreprises nous font confiance au quotidien.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <TestimonialCard {...t} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section id="pricing" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Des tarifs simples
            </h2>
            <p className="text-white/60 text-lg">
              Pas de frais cachés. Tout est inclus.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <PricingCard {...plan} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 rounded-3xl p-12"
          >
            <Rocket className="w-16 h-16 text-blue-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">
              Prêt à démarrer?
            </h2>
            <p className="text-white/60 text-lg mb-8">
              Rejoignez plus de 2500 entreprises qui nous font confiance.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-semibold text-lg hover:opacity-90 transition-all"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">U</span>
              </div>
              <span className="font-bold">UNY</span>
            </div>
            <div className="text-white/40 text-sm">
              © 2026 UNY. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}