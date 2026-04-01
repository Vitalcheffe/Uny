
import React, { useMemo } from 'react';
import * as Router from 'react-router-dom';
const { Link, useLocation, useNavigate } = Router as any;
import { 
  Home, Users, Briefcase, FileText, Receipt, 
  FileCheck, Clock, Wallet, BarChart3, Settings, 
  CreditCard, LogOut, ChevronDown, ShieldCheck, Brain, FileScan, GitMerge
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import { motion } from 'motion/react';

const NavItem = ({ icon: Icon, label, path, active }: any) => (
  <Link 
    to={path} 
    className="block"
  >
    <motion.div
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`group flex items-center gap-3 px-4 py-2.5 transition-all rounded-xl text-sm font-semibold tracking-tight ${
        active 
          ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm' 
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      <Icon 
        size={18} 
        className={`transition-colors ${active ? 'text-blue-700' : 'group-hover:text-slate-900'}`} 
      />
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" 
        />
      )}
    </motion.div>
  </Link>
);

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, isUnyAdmin } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const fullName = profile?.full_name || 'Member';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const navigation = useMemo(() => {
    const nav = [
      {
        section: t('core'),
        items: [
          { id: 'overview', name: t('dashboard'), icon: Home, href: '/dashboard' },
          { id: 'clients', name: t('clients'), icon: Users, href: '/dashboard/clients' },
          { id: 'projects', name: t('projects'), icon: Briefcase, href: '/dashboard/projects' },
        ]
      },
      {
        section: t('intelligence'),
        items: [
          { id: 'documents', name: t('vault'), icon: FileText, href: '/dashboard/documents' },
          { id: 'knowledge', name: t('knowledge_registry'), icon: Brain, href: '/dashboard/knowledge' },
          { id: 'knowledge-hub', name: t('validation_center'), icon: FileScan, href: '/dashboard/knowledge-hub' },
        ]
      },
      {
        section: t('operations'),
        items: [
          { id: 'invoices', name: t('invoicing'), icon: Receipt, href: '/dashboard/tools/invoices' },
          { id: 'contracts', name: t('contracts'), icon: FileCheck, href: '/dashboard/tools/contracts' },
        ]
      },
      {
        section: t('human_capital'),
        items: [
          { id: 'team', name: t('team'), icon: Users, href: '/dashboard/team' },
          { id: 'time', name: t('time_tracking'), icon: Clock, href: '/dashboard/time' },
        ]
      },
      {
        section: t('management'),
        items: [
          { id: 'treasury', name: t('treasury'), icon: Wallet, href: '/dashboard/tools/treasury' },
          { id: 'strategy', name: t('analytics'), icon: BarChart3, href: '/dashboard/tools/strategy' },
        ]
      }
    ];

    if (isUnyAdmin) {
      nav.push({
        section: t('sovereign_control'),
        items: [
          { id: 'gateway', name: t('nav.admin.gateway'), icon: ShieldCheck, href: '/dashboard/admin/gateway' },
          { id: 'workflows', name: t('nav.admin.workflows'), icon: GitMerge, href: '/dashboard/admin/workflows' },
          { id: 'audit', name: t('nav.admin.audit'), icon: ShieldCheck, href: '/dashboard/admin/audit' },
          { id: 'telemetry', name: t('nav.admin.telemetry'), icon: BarChart3, href: '/dashboard/admin/telemetry' },
          { id: 'billing', name: t('nav.admin.billing'), icon: CreditCard, href: '/dashboard/admin/billing' },
        ]
      });
    }

    return nav;
  }, [isUnyAdmin, t]);

  return (
    <aside className="w-full bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 z-[60]">
      <div className="p-8 border-b border-slate-200">
        <Link to="/dashboard" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 bg-blue-700 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
            <span className="font-bold text-xl italic">U</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">UNY</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Enterprise OS</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar">
        {navigation.map((group) => (
          <div key={group.section}>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4 mb-3 italic">
              {group.section}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem 
                  key={item.id} 
                  icon={item.icon} 
                  label={item.name} 
                  path={item.href} 
                  active={location.pathname === item.href || (item.id === 'overview' && location.pathname === '/dashboard/')} 
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-200 bg-slate-50">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-4 shadow-sm">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0 overflow-hidden">
                 {profile?.avatar ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="text-sm font-bold truncate text-slate-900 tracking-tight">
                  {fullName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {profile?.role?.replace('_', ' ') || 'Member'}
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
           </div>

           <div className="pt-2 border-t border-slate-200 space-y-1">
              <Link to="/dashboard/admin/settings" className="flex items-center gap-3 px-2 py-2 text-slate-500 hover:text-blue-700 text-xs font-bold uppercase tracking-widest transition-colors rounded-lg hover:bg-slate-100">
                 <Settings size={14} /> Organisation
              </Link>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-2 py-2 text-slate-500 hover:text-rose-700 text-xs font-bold uppercase tracking-widest transition-colors rounded-lg hover:bg-rose-50"
              >
                <LogOut size={14} /> Logout
              </button>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
