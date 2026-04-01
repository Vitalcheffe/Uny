
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, ShieldCheck, BarChart3, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { id: 'clients', name: 'Clients', icon: Users, href: '/dashboard/admin/clients' },
    { id: 'employees', name: 'Employés', icon: Users, href: '/dashboard/admin/employees' },
    { id: 'access', name: 'Accès', icon: ShieldCheck, href: '/dashboard/admin/access' },
    { id: 'audit', name: 'Audit', icon: BarChart3, href: '/dashboard/admin/audit' },
  ];

  return (
    <aside className="w-full bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 z-[60]">
      <div className="p-8 border-b border-slate-200">
        <div className="text-slate-900 font-black italic text-xl tracking-tighter">UNY SUPER ADMIN</div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <Link 
            key={item.id}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              location.pathname === item.href 
                ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <item.icon size={18} />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-200">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-rose-700 text-sm font-bold transition-colors rounded-lg hover:bg-rose-50"
        >
          <LogOut size={18} /> Déconnexion
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
