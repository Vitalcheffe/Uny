import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  Zap,
  FileText,
  Briefcase,
  Users,
  CreditCard,
  LogOut,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';

const SIDEBAR_ITEMS = [
  { name: 'Accueil', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Chat IA', path: '/dashboard/chat', icon: Zap },
  { name: 'Documents', path: '/dashboard/documents', icon: FileText },
  { name: 'Projets', path: '/dashboard/projects', icon: Briefcase },
  { name: 'Équipe', path: '/dashboard/team', icon: Users },
  { name: 'Facturation', path: '/dashboard/billing', icon: CreditCard },
];

export default function UserLayout() {
  const { user, profile, signOut } = useAuth();
  const { organization } = useOrganization();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/dashboard/') return 'Accueil';
    if (path.includes('chat')) return 'Chat IA';
    if (path.includes('documents')) return 'Documents';
    if (path.includes('projects')) return 'Projets';
    if (path.includes('team')) return 'Équipe';
    if (path.includes('billing')) return 'Facturation';
    return 'Dashboard';
  };

  const getInitials = () => {
    const name = user?.full_name || user?.email || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const companyName = organization?.name || 'Mon Entreprise';
  const tokensUsed = 2340;
  const tokensLimit = 50000;
  const tokenPercentage = Math.round((tokensUsed / tokensLimit) * 100);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[240px] bg-[#0A0A1A] flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="text-white font-semibold text-lg">UNY</span>
          </div>
        </div>

        {/* Separator */}
        <div className="mx-6 border-t border-white/10" />

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg mb-1
                  transition-colors relative
                  ${isActive 
                    ? 'text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#2563EB] rounded-r" />
                )}
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/10 space-y-4">
          {/* Company name pill */}
          <div className="px-3 py-2 bg-white/10 rounded-lg">
            <span className="text-white/80 text-sm font-medium">{companyName}</span>
          </div>

          {/* Tokens usage */}
          <div className="px-3">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/60">Tokens</span>
              <span className="text-white">{tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#2563EB] rounded-full transition-all"
                style={{ width: `${tokenPercentage}%` }}
              />
            </div>
          </div>

          {/* Signout button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-[#0A0A1A]">
              {getPageTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0A0A1A] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{getInitials()}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
