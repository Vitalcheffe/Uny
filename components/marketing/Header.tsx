import React from 'react';
import * as Router from 'react-router-dom';
const { Link, useLocation, useNavigate } = Router as any;
import { motion as _motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';

const motion = _motion as any;

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const scrollToSection = (targetId: string) => {
    const element = document.getElementById(targetId);
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => scrollToSection(targetId), 150);
    } else {
      scrollToSection(targetId);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-6 flex justify-center pointer-events-none">
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-7xl flex items-center justify-between bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-3xl px-8 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)] pointer-events-auto"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center transition-all group-hover:rotate-12 group-hover:scale-110 shadow-lg shadow-slate-900/20">
            <span className="text-white font-black italic text-2xl leading-none">U</span>
          </div>
          <span className="text-2xl font-[950] tracking-tighter text-slate-900 italic uppercase group-hover:text-blue-600 transition-colors">UNY</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {[
            { name: t('nav.infrastructure'), id: 'features' },
            { name: t('nav.capabilities'), id: 'benefits' },
            { name: t('nav.access'), id: 'pricing' },
            { name: t('nav.compliance'), id: 'documentation' },
            { name: t('nav.audit'), id: 'contact-us' }
          ].map((item) => (
            <a 
              key={item.id} 
              href={`#${item.id}`}
              onClick={(e) => handleNavClick(e, item.id)}
              className="relative text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-600 transition-all italic group"
            >
              {item.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Auth Buttons & Lang */}
        <div className="flex items-center gap-6">
          <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-200/50">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all italic ${language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all italic ${language === 'fr' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              FR
            </button>
          </div>
          
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <button 
            onClick={() => navigate(user ? "/dashboard" : "/login")}
            className="hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-600 transition-colors italic"
          >
            {t('nav.clientArea')}
          </button>
          
          <button 
            onClick={(e) => handleNavClick(e as any, 'contact-us')}
            className="group relative bg-slate-900 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-slate-900/20 active:scale-95 italic"
          >
            <span className="relative z-10">{t('nav.requestAudit')}</span>
            <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      </motion.div>
    </header>
  );
};

export default Header;