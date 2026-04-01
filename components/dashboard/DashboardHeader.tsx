
import React from 'react';
import { Search, Bell, ArrowLeft, ChevronRight, Zap, ShieldCheck, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage } from '../../lib/local-adaptation';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const DashboardHeader: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isHome = pathSegments.length === 1 && pathSegments[0] === 'dashboard';

  return (
    <header className="h-20 flex items-center justify-between px-10 border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center gap-6">
        {!isHome && (
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all group"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
             <Link to="/dashboard" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors">Plateforme</Link>
             {pathSegments.slice(1).map((seg, i) => (
               <React.Fragment key={seg}>
                 <ChevronRight size={10} className="text-slate-300" />
                 <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">{seg.replace('-', ' ')}</span>
               </React.Fragment>
             ))}
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5 italic uppercase">
            {isHome ? t('dashboard') : pathSegments[pathSegments.length - 1].replace('-', ' ')}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative w-72 group hidden xl:block">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher des documents, entités..." 
            className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white focus:border-blue-700 transition-all font-medium placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="p-2.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 transition-all rounded-xl flex items-center gap-2">
              <Globe size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{language}</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {(['fr', 'ar', 'ary', 'en'] as SupportedLanguage[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors ${language === lang ? 'text-blue-700' : 'text-slate-500'}`}
                >
                  {lang === 'fr' ? 'Français' : lang === 'ar' ? 'العربية' : lang === 'ary' ? 'Darija' : 'English'}
                </button>
              ))}
            </div>
          </div>

          <button className="p-2.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 transition-all rounded-xl relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-600 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all rounded-xl">
            <Zap size={20} />
          </button>
        </div>

        <div className="h-10 w-px bg-slate-200 mx-2" />

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">Sécurité</span>
            <span className="text-[11px] font-bold text-slate-900 mt-1">Vérifiée</span>
          </div>
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700 border border-blue-200">
             <ShieldCheck size={16} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
