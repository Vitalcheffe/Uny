import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Users, FileText, Folder, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { THEME } from '../constants/theme';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 transition-all ${isActive ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
      style={{
        padding: `${THEME.spacing.md} ${THEME.spacing.lg}`,
        borderRadius: THEME.borderRadius.xl,
      }}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export default function ModernLayout({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className="min-h-screen flex text-slate-900"
      style={{
        backgroundColor: THEME.colors.background,
      }}
    >
      <aside 
        className="w-64 flex flex-col gap-8 border-r border-slate-300"
        style={{
          padding: THEME.spacing.lg,
        }}
      >
        <div 
          className="font-black italic uppercase tracking-tighter"
          style={{
            fontSize: THEME.typography.fontSize['2xl'],
          }}
        >
          UNY
        </div>
        <nav className="flex flex-col gap-2 flex-grow">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/dashboard/clients" icon={Users} label="Clients" />
          <NavItem to="/dashboard/documents" icon={FileText} label="Documents" />
          <NavItem to="/dashboard/knowledge" icon={Folder} label="Knowledge" />
        </nav>
        <button 
          className="flex items-center gap-3 text-slate-500 hover:text-red-600 transition-colors"
          style={{
            padding: `${THEME.spacing.md} ${THEME.spacing.lg}`,
          }}
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </aside>
      <main 
        className="flex-grow"
        style={{
          padding: THEME.spacing.xl,
        }}
      >
        {children}
      </main>
    </div>
  );
}
