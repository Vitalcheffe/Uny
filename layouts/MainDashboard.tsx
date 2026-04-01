/**
 * Main Dashboard Layout
 *
 * Primary layout with role-based navigation and Framer Motion transitions.
 */

import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Activity, 
  Menu, 
  X,
  ChevronRight,
  Database,
  Briefcase,
  CreditCard,
  Zap,
  Building2,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

const MainDashboard: React.FC = () => {
  const { user, signOut, isSuperAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Nexus Chat', path: '/dashboard/chat', icon: Zap, roles: [UserRole.USER, UserRole.MANAGER, UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN] },
    { name: 'Documents', path: '/dashboard/documents', icon: FileText, roles: [UserRole.USER, UserRole.MANAGER, UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN] },
    { name: 'Projects', path: '/dashboard/projects', icon: Briefcase, roles: [UserRole.MANAGER, UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN] },
    { name: 'Team', path: '/dashboard/team', icon: Users, roles: [UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN] },
    { name: 'Finance', path: '/dashboard/billing', icon: CreditCard, roles: [UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN] },
  ];

  const adminItems = [
    { name: 'Flux Audits', path: '/dashboard/admin/global-audit', icon: Eye, roles: [UserRole.SUPER_ADMIN] },
    { name: 'Companies', path: '/dashboard/admin/companies', icon: Building2, roles: [UserRole.SUPER_ADMIN] },
    { name: 'Audit Ledger', path: '/dashboard/admin/audit', icon: Database, roles: [UserRole.SUPER_ADMIN] },
    { name: 'PII Monitor', path: '/dashboard/admin/pii', icon: ShieldCheck, roles: [UserRole.SUPER_ADMIN] },
    { name: 'Telemetry', path: '/dashboard/admin/telemetry', icon: Activity, roles: [UserRole.SUPER_ADMIN] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || UserRole.GUEST));
  const filteredAdminItems = adminItems.filter(item => item.roles.includes(user?.role || UserRole.GUEST));

  return (
    <div style={{ zoom: 0.7 }} className="min-h-screen bg-white text-slate-900 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative bg-[#1E3A8A] text-white border-r border-slate-700 flex flex-col z-50"
      >
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Zap size={18} className="text-[#1E3A8A]" />
                </div>
                <span className="font-black italic text-xl uppercase tracking-tighter text-white">UNY <span className="text-white">Node</span></span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-8 mt-8 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            {isSidebarOpen && <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 mb-4">Core Modules</p>}
            {filteredNavItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                  location.pathname === item.path 
                    ? 'bg-white/10 text-white border border-white/20' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={20} className={location.pathname === item.path ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                {isSidebarOpen && <span className="text-sm font-bold uppercase tracking-widest">{item.name}</span>}
                {isSidebarOpen && location.pathname === item.path && (
                  <motion.div layoutId="active-nav" className="ml-auto"><ChevronRight size={14} /></motion.div>
                )}
              </Link>
            ))}
          </div>

          {filteredAdminItems.length > 0 && (
            <div className="space-y-1">
              {isSidebarOpen && <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 ml-4 mb-4">Admin Protocol</p>}
              {filteredAdminItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                    location.pathname === item.path 
                      ? 'bg-white/10 text-white border border-white/20' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon size={20} className={location.pathname === item.path ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                  {isSidebarOpen && <span className="text-sm font-bold uppercase tracking-widest">{item.name}</span>}
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/10 bg-[#1E3A8A]">
          <div className={`flex items-center gap-3 ${isSidebarOpen ? 'p-2' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-sm text-[#1E3A8A] border-2 border-white shadow-lg">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-tighter truncate text-white">{user?.full_name || 'Anonymous'}</p>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest truncate">{user?.role}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleSignOut}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl text-white/70 hover:bg-white/10 hover:text-white transition-all mt-2 ${isSidebarOpen ? '' : 'justify-center'}`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-bold uppercase tracking-widest">Disconnect</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto bg-slate-50">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 p-8 max-w-7xl mx-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MainDashboard;
